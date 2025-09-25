// Gaming Platform Integration with @mysten/dapp-kit

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

// Walrus Configuration
const WALRUS_PUBLISHER_URL = 'https://publisher.walrus-testnet.walrus.space'
const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space'

// Platform Configuration
const PLATFORM_OBJECT_ID =
  '0xb49675a6b80888974862d7bf14567185797f5a136b5632253fed528c8b5f1c72'
const PLATFORM_PACKAGE_ID =
  '0xec2121dffb67743b19e5eb028cf425fb6fffeba59a2c01474d398a154dd29e1c'
const CLOCK_OBJECT_ID = '0x6'

export interface UploadResult {
  blobId: string
  url: string
}

export interface GameUploadData {
  name: string
  description: string
  posterFile: File
  gameFile?: File
  categories: number[]
  isMobileFriendly: boolean
  gameType: number // 0 for SWF, 1 for URL
  isUrl?: boolean
  gameUrl?: string
}

export interface UserProfile {
  user: string
  username: string
  reputation_score: string
  games_uploaded: string
  games_played: string
  total_score: string
  achievements: string[]
  created_at: string
}

export interface Game {
  id: string
  name: string
  description: string
  poster_walrus_id: string
  game_file_walrus_id: string
  categories: number[]
  uploader: string
  featured: boolean
  is_mobile_friendly: boolean
  game_type: number
  created_at: string
  play_count: string
  rating_sum: string
  rating_count: string
  high_score: string
  high_score_holder: string
}

// Upload file to Walrus
export async function uploadToWalrus(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${WALRUS_PUBLISHER_URL}/v1/store`, {
      method: 'PUT',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.newlyCreated) {
      return {
        blobId: result.newlyCreated.blobObject.blobId,
        url: `${WALRUS_AGGREGATOR_URL}/v1/${result.newlyCreated.blobObject.blobId}`,
      }
    } else if (result.alreadyCertified) {
      return {
        blobId: result.alreadyCertified.blobId,
        url: `${WALRUS_AGGREGATOR_URL}/v1/${result.alreadyCertified.blobId}`,
      }
    }

    throw new Error('Unexpected response from Walrus')
  } catch (error) {
    console.error('Walrus upload error:', error)
    throw error
  }
}

// Upload URL as text file to Walrus
export async function uploadUrlToWalrus(url: string): Promise<UploadResult> {
  const blob = new Blob([url], { type: 'text/plain' })
  const file = new File([blob], 'game-url.txt', { type: 'text/plain' })
  return uploadToWalrus(file)
}

// Hook for platform operations
export function usePlatformOperations() {
  const suiClient = useSuiClient()
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  // Register user
  const registerUser = async (username: string): Promise<void> => {
    if (!currentAccount) throw new Error('No account connected')

    const tx = new Transaction()

    tx.moveCall({
      target: `${PLATFORM_PACKAGE_ID}::game_platform::register_user`,
      arguments: [
        tx.object(PLATFORM_OBJECT_ID),
        tx.pure.string(username),
        tx.object(CLOCK_OBJECT_ID),
      ],
    })

    return new Promise((resolve, reject) => {
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        },
      )
    })
  }

  // Check if user exists
  const checkUserExists = async (userAddress?: string): Promise<boolean> => {
    const address = userAddress || currentAccount?.address

    if (!address) return false

    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction()
          tx.moveCall({
            target: `${PLATFORM_PACKAGE_ID}::game_platform::user_exists`,
            arguments: [
              tx.object(PLATFORM_OBJECT_ID),
              tx.pure.address(address),
            ],
          })
          return tx
        })(),
        sender: address,
      })

      return result.results?.[0]?.returnValues?.[0]?.[0]?.[0] === 1
    } catch {
      return false
    }
  }

  // Get user profile
  const getUserProfile = async (
    userAddress?: string,
  ): Promise<UserProfile | null> => {
    const address = userAddress || currentAccount?.address
    if (!address) return null

    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction()
          tx.moveCall({
            target: `${PLATFORM_PACKAGE_ID}::game_platform::get_user_profile`,
            arguments: [
              tx.object(PLATFORM_OBJECT_ID),
              tx.pure.address(address),
            ],
          })
          return tx
        })(),
        sender: address,
      })

      // Parse the result based on your struct - adjust as needed
      if (result.results?.[0]?.returnValues) {
        // This would need to be adjusted based on actual return format
        return {
          user: address,
          username: '',
          reputation_score: '0',
          games_uploaded: '0',
          games_played: '0',
          total_score: '0',
          achievements: [],
          created_at: '0',
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }

    return null
  }

  // Upload game
  const uploadGame = async (gameData: GameUploadData): Promise<void> => {
    if (!currentAccount) throw new Error('No account connected')

    // Upload files to Walrus first
    const posterUpload = await uploadToWalrus(gameData.posterFile)

    let gameFileUpload: UploadResult
    if (gameData.isUrl && gameData.gameUrl) {
      gameFileUpload = await uploadUrlToWalrus(gameData.gameUrl)
    } else if (gameData.gameFile) {
      gameFileUpload = await uploadToWalrus(gameData.gameFile)
    } else {
      throw new Error('No game file or URL provided')
    }

    // Get upload fee
    const stats = await getPlatformStats()

    const tx = new Transaction()

    // Split coin for upload fee
    const [coin] = tx.splitCoins(tx.gas, [stats.uploadFee])

    // Create category objects
    const categoryObjects = gameData.categories.map((cat) =>
      tx.moveCall({
        target: `${PLATFORM_PACKAGE_ID}::game_platform::new_category`,
        arguments: [tx.pure.u8(cat)],
      }),
    )

    // Create game type object
    const gameTypeObj = tx.moveCall({
      target: `${PLATFORM_PACKAGE_ID}::game_platform::new_game_type`,
      arguments: [tx.pure.u8(gameData.gameType)],
    })

    // Upload game
    tx.moveCall({
      target: `${PLATFORM_PACKAGE_ID}::game_platform::upload_game`,
      arguments: [
        tx.object(PLATFORM_OBJECT_ID),
        tx.pure.string(gameData.name),
        tx.pure.string(gameData.description),
        tx.pure.string(posterUpload.blobId),
        tx.pure.string(gameFileUpload.blobId),
        tx.makeMoveVec({ elements: categoryObjects }),
        tx.pure.bool(gameData.isMobileFriendly),
        gameTypeObj,
        coin,
        tx.object(CLOCK_OBJECT_ID),
      ],
    })

    return new Promise((resolve, reject) => {
      signAndExecute(
        {
          transaction: tx,
          options: {
            showEvents: true,
            showObjectChanges: true,
          },
        },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        },
      )
    })
  }

  // Play game (submit score)
  const playGame = async (gameId: string, score: number): Promise<void> => {
    if (!currentAccount) throw new Error('No account connected')

    const tx = new Transaction()

    tx.moveCall({
      target: `${PLATFORM_PACKAGE_ID}::game_platform::play_game`,
      arguments: [
        tx.object(PLATFORM_OBJECT_ID),
        tx.pure.id(gameId),
        tx.pure.u64(score),
        tx.object(CLOCK_OBJECT_ID),
      ],
    })

    return new Promise((resolve, reject) => {
      signAndExecute(
        {
          transaction: tx,
          options: {
            showEvents: true,
          },
        },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        },
      )
    })
  }

  // Rate game
  const rateGame = async (gameId: string, rating: number): Promise<void> => {
    if (!currentAccount) throw new Error('No account connected')

    const tx = new Transaction()

    tx.moveCall({
      target: `${PLATFORM_PACKAGE_ID}::game_platform::rate_game`,
      arguments: [
        tx.object(PLATFORM_OBJECT_ID),
        tx.pure.id(gameId),
        tx.pure.u8(rating),
      ],
    })

    return new Promise((resolve, reject) => {
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        },
      )
    })
  }

  // Get platform stats
  const getPlatformStats = async (): Promise<{
    totalGames: number
    totalUsers: number
    uploadFee: string
  }> => {
    if (!currentAccount) throw new Error('No account connected')

    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction()
        tx.moveCall({
          target: `${PLATFORM_PACKAGE_ID}::game_platform::get_platform_stats`,
          arguments: [tx.object(PLATFORM_OBJECT_ID)],
        })
        return tx
      })(),
      sender: currentAccount.address,
    })

    const returnValues = result.results?.[0]?.returnValues
    if (returnValues) {
      return {
        totalGames: parseInt(returnValues[0][0]) || 0,
        totalUsers: parseInt(returnValues[1][0]) || 0,
        uploadFee: returnValues[2][0] || '0',
      }
    }

    return { totalGames: 0, totalUsers: 0, uploadFee: '0' }
  }

  return {
    registerUser,
    checkUserExists,
    getUserProfile,
    uploadGame,
    playGame,
    rateGame,
    getPlatformStats,
  }
}
