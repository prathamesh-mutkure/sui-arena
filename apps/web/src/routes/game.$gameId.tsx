import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import RufflePlayerComponent from '@/components/ruffle-player'
import useGameStore from '@/zustand/games-store'

export const Route = createFileRoute('/game/$gameId')({
  component: RouteComponent,
})

export default function RouteComponent() {
  const { gameId } = Route.useParams()

  const { selectGame, selectedGame } = useGameStore((state) => state)

  useEffect(() => {
    if (gameId) {
      selectGame(gameId)
    }
  }, [gameId, selectGame])

  if (!gameId) {
    return <h1>Game ID is required</h1>
  }

  return (
    <main
      className={`h-[calc(100vh-108px)] flex items-center justify-center text-white py-12 px-4`}
    >
      {!selectedGame && <h3>Game Not Found</h3>}

      {selectedGame && (
        <RufflePlayerComponent
          swfUrl={selectedGame.flashFile}
          gameId={selectedGame.id}
          gameType={selectedGame.type}
        />
      )}
    </main>
  )
}
