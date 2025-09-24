import React, { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import type { RufflePlayer } from '@/types/ruffle'
import { calculateGamingActivity } from '@/lib/reputation-score-helper'
// import { storeAttestationInBackend } from '@/lib/backend-helper'

interface RufflePlayerProps {
  swfUrl: string
  gameId: string
  gameType: Game['type']
  width?: number
  height?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

type TGameMetrics = {
  startTime: Date | null
  endTime: Date | null
  keystrokes: number
  mouseClicks: number
  totalPlayTime: number
}

const SKIP_ONCHAIN_ATTESTATION = false

const RufflePlayerComponent: React.FC<RufflePlayerProps> = ({
  swfUrl,
  gameId,
  gameType,
  width = 1000,
  height = 750,
  onStart,
  onEnd,
  onError,
}) => {
  const account = useCurrentAccount()

  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<RufflePlayer | null>(null)

  const isGameActiveRef = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const metricsRef = useRef<TGameMetrics>({
    startTime: null,
    endTime: null,
    keystrokes: 0,
    mouseClicks: 0,
    totalPlayTime: 0,
  })

  useEffect(() => {
    loadRuffle()

    return () => {
      if (playerRef.current) {
        playerRef.current.remove()
        playerRef.current = null
      }

      handleGameEnd()

      window.removeEventListener('keyup', handleKeyPress)
      window.removeEventListener('mouseup', handleMouseClick)
    }
  }, [])

  async function loadRuffle() {
    try {
      if (gameType !== 'flash') {
        return
      }

      if (!window.RufflePlayer) {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/@ruffle-rs/ruffle'
        script.async = true

        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      if (!containerRef.current) {
        return
      }

      if (!window.RufflePlayer) {
        console.log('RufflePlayer is not available on window')
        return
      }

      // Initialize Ruffle player
      const ruffle = window.RufflePlayer.newest()
      const player = ruffle.createPlayer()

      player.style.width = `100%`
      player.style.height = `100%`

      if (containerRef.current.firstChild) {
        console.log('Container already has a child, removing...')
        containerRef.current.firstChild.remove()
      }

      containerRef.current.appendChild(player)
      playerRef.current = player

      // Load the SWF file
      await player.load(swfUrl)
      console.log('SWF loaded')
      handleGameStart()

      window.addEventListener('keyup', handleKeyPress)
      window.addEventListener('mouseup', handleMouseClick)
    } catch (error) {
      console.error('Error loading Ruffle or SWF:', error)
      handleError(
        error instanceof Error
          ? error
          : new Error('Failed to load Ruffle player'),
      )
    }
  }

  function loadIFrame() {
    try {
      handleGameStart()

      window.addEventListener('keyup', handleKeyPress)
      window.addEventListener('mouseup', handleMouseClick)
    } catch (error) {
      console.log('Failed setting up game')
    }
  }

  function handleGameStart() {
    console.log('handleGameStart, isGameActive is', isGameActiveRef.current)

    if (isGameActiveRef.current) return

    isGameActiveRef.current = true

    metricsRef.current = {
      ...metricsRef.current,
      startTime: new Date(),
      endTime: null,
      keystrokes: 0,
      mouseClicks: 0,
      totalPlayTime: 0,
    }

    console.log('isGameActive is now', isGameActiveRef.current)
  }

  function handleGameEnd() {
    console.log('handleGameEnd, isGameActive is', isGameActiveRef.current)

    if (!isGameActiveRef.current) return

    isGameActiveRef.current = false

    const finalMetrics = calculateFinalMetrics(metricsRef.current)
    metricsRef.current = finalMetrics
    sendMetricsToBackend(finalMetrics)
  }

  function handleError(error: Error) {
    console.error('Error loading SWF: ', error)
    handleGameEnd()
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (!isGameActiveRef.current) return

    if (event.key.toLowerCase() === 'f') {
      toggleFullscreen()
    }

    metricsRef.current = {
      ...metricsRef.current,
      keystrokes: metricsRef.current.keystrokes + 1,
    }
  }

  function handleMouseClick() {
    if (!isGameActiveRef.current) return

    metricsRef.current = {
      ...metricsRef.current,
      mouseClicks: metricsRef.current.mouseClicks + 1,
    }
  }

  async function toggleFullscreen() {
    if (!containerRef.current || !playerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }

  async function sendMetricsToBackend(gameMetrics: TGameMetrics) {
    const addressToAttest = account?.address

    if (!addressToAttest) {
      console.log('No connected account, skipping metrics submission')
      return
    }

    if (SKIP_ONCHAIN_ATTESTATION) {
      console.log('Skipping on-chain attestation in testing')
      return '0x...'
    }

    try {
      // TODO: Get old attestation based on userId and gameId from True Network
      // If exists, update the existing attestation with new metrics
      // If not, create a new attestation

      console.log('Attesting metrics on-chain...')

      const gamingActivity = calculateGamingActivity({
        keyStrokes: gameMetrics.keystrokes,
        mouseClicks: gameMetrics.mouseClicks,
        numberOfGameplays: 1,
        totalGamePlayDuration: gameMetrics.totalPlayTime,
      })

      console.log('Final game metrics: ', gamingActivity)

      // const dataToAttest: TUserGameScoreSchema = {
      //   gameId: gameId,
      //   userId: addressToAttest,
      //   keyStokes: gameMetrics.keystrokes,
      //   mouseClicks: gameMetrics.mouseClicks,
      //   totalGamePlayDuration: gameMetrics.totalPlayTime,
      //   numberOfGameplays: 1,
      //   gamingActivity: gamingActivity,
      // }

      // const txHash = await attestUserGameScore(dataToAttest)

      // console.log('Metrics attested on-chain, txHash: ', txHash)

      // const data = await storeAttestationInBackend({
      //   gameId: dataToAttest.gameId,
      //   userId: dataToAttest.userId,
      //   gamePlayDuration: dataToAttest.totalGamePlayDuration,
      //   mouseClicks: dataToAttest.mouseClicks,
      //   keyStrokes: dataToAttest.keyStokes,
      //   gamingActivity: dataToAttest.gamingActivity,
      //   overallScore: dataToAttest.gamingActivity,
      // })

      // console.log('Gameplay data stored in backend: ', data)
      // return txHash
    } catch (error) {
      console.log('Error attesting:')
      console.log(error)
    }
  }

  function calculateFinalMetrics(prevMetrics: TGameMetrics): TGameMetrics {
    const endTime = dayjs(new Date())
    const startTime = dayjs(prevMetrics.startTime ?? endTime)
    const diff = endTime.diff(startTime, 'seconds')

    return {
      ...prevMetrics,
      endTime: endTime.toDate(),
      totalPlayTime: diff,
    }
  }

  return (
    <div className="w-full h-full">
      {gameType === 'flash' && (
        <div
          id="ruffle-container"
          ref={containerRef}
          className="h-full w-full"
        />
      )}

      {gameType === 'iframe' && (
        <iframe
          src={swfUrl}
          className="h-full w-full"
          allowFullScreen={true}
          frameBorder="0"
          onLoad={loadIFrame}
        />
      )}

      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-75 text-white p-2 rounded-full hover:bg-opacity-100 transition-opacity"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>
    </div>
  )
}

export default RufflePlayerComponent
