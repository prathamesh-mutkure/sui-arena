import { useEffect, useState } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'

import {
  GAME_CATEGORIES,
  getWalrusUrl,
  usePlatformOperations,
  type GameUploadData,
} from '@/lib/sui-client'

// User Registration Component
export const UserRegistration: React.FC<{
  onRegistered: () => void
}> = ({ onRegistered }) => {
  const [username, setUsername] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const currentAccount = useCurrentAccount()
  const { registerUser, checkUserExists } = usePlatformOperations()

  useEffect(() => {
    if (currentAccount) {
      checkUserExists().then(setIsRegistered)
    }
  }, [currentAccount])

  const handleRegister = async () => {
    if (!username.trim()) {
      alert('Please enter a username')
      return
    }

    setIsRegistering(true)

    try {
      await registerUser(username)
      setIsRegistered(true)
      onRegistered()
      alert('Registration successful!')
    } catch (error) {
      console.error('Registration failed:', error)
      alert('Registration failed. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  if (!currentAccount) {
    return (
      <div>
        <p>Please connect wallet to continue</p>
      </div>
    )
  }

  if (isRegistered) {
    return (
      <div className="user-registered">
        <p>✅ User profile already exists</p>
      </div>
    )
  }

  return (
    <div className="user-registration">
      <h3>Create Gaming Profile</h3>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        maxLength={50}
      />
      <button onClick={handleRegister} disabled={isRegistering}>
        {isRegistering ? 'Creating Profile...' : 'Create Profile'}
      </button>
    </div>
  )
}

// Game Upload Component
export const GameUploadForm: React.FC = () => {
  const [gameData, setGameData] = useState<Partial<GameUploadData>>({
    categories: [],
    isMobileFriendly: false,
    gameType: 0, // Default to SWF
    isUrl: false,
  })
  const [isUploading, setIsUploading] = useState(false)
  const currentAccount = useCurrentAccount()
  const { uploadGame } = usePlatformOperations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentAccount) {
      alert('Please connect your wallet')
      return
    }

    if (
      !gameData.name ||
      !gameData.posterFile ||
      (!gameData.gameFile && !gameData.gameUrl)
    ) {
      alert('Please fill all required fields')
      return
    }

    setIsUploading(true)
    try {
      await uploadGame(gameData as GameUploadData)
      alert('Game uploaded successfully!')
      // Reset form
      setGameData({
        categories: [],
        isMobileFriendly: false,
        gameType: 0,
        isUrl: false,
      })
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const toggleCategory = (categoryId: number) => {
    const categories = gameData.categories || []
    const newCategories = categories.includes(categoryId)
      ? categories.filter((id) => id !== categoryId)
      : [...categories, categoryId]
    setGameData({ ...gameData, categories: newCategories })
  }

  return (
    <form onSubmit={handleSubmit} className="game-upload-form">
      <h3>Upload New Game</h3>

      <input
        type="text"
        placeholder="Game Name *"
        value={gameData.name || ''}
        onChange={(e) => setGameData({ ...gameData, name: e.target.value })}
        required
      />

      <textarea
        placeholder="Game Description"
        value={gameData.description || ''}
        onChange={(e) =>
          setGameData({ ...gameData, description: e.target.value })
        }
        rows={3}
      />

      <div>
        <label>Game Poster Image *</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setGameData({ ...gameData, gameUrl: e.target.value })
          }
          required
        />
      </div>

      <div>
        <label>Categories:</label>
        {Object.entries(GAME_CATEGORIES).map(([name, id]) => (
          <label key={id}>
            <input
              type="checkbox"
              checked={(gameData.categories || []).includes(id)}
              onChange={() => toggleCategory(id)}
            />
            {name.charAt(0) + name.slice(1).toLowerCase()}
          </label>
        ))}
      </div>

      <label>
        <input
          type="checkbox"
          checked={gameData.isMobileFriendly || false}
          onChange={(e) =>
            setGameData({ ...gameData, isMobileFriendly: e.target.checked })
          }
        />
        Mobile Friendly
      </label>

      <button type="submit" disabled={isUploading || !currentAccount}>
        {isUploading ? 'Uploading...' : 'Upload Game'}
      </button>
    </form>
  )
}

// Game Player Component
export const GamePlayer: React.FC<{
  gameId: string
  gameFileWalrusId: string
  gameType: number
  onGameComplete?: (score: number) => void
}> = ({ gameId, gameFileWalrusId, gameType, onGameComplete }) => {
  const [gameScore, setGameScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentAccount = useCurrentAccount()
  const { playGame } = usePlatformOperations()

  const handleScoreSubmit = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet to submit scores')
      return
    }

    setIsSubmitting(true)
    try {
      await playGame(gameId, gameScore)
      onGameComplete?.(gameScore)
      alert(`Score ${gameScore} submitted successfully!`)
    } catch (error) {
      console.error('Score submission failed:', error)
      alert('Failed to submit score. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const gameUrl = getWalrusUrl(gameFileWalrusId)

  return (
    <div className="game-player">
      <div className="game-container">
        {gameType === 0 ? (
          // SWF Flash Game
          <object
            data={gameUrl}
            type="application/x-shockwave-flash"
            width="800"
            height="600"
          >
            <param name="movie" value={gameUrl} />
            <param name="quality" value="high" />
            <param name="bgcolor" value="#ffffff" />
            <embed
              src={gameUrl}
              quality="high"
              bgcolor="#ffffff"
              width="800"
              height="600"
              type="application/x-shockwave-flash"
            />
          </object>
        ) : (
          // URL-based game
          <iframe
            src={gameUrl}
            width="800"
            height="600"
            frameBorder="0"
            allowFullScreen
          />
        )}
      </div>

      <div className="score-submission">
        <h4>Submit Your Score</h4>
        <input
          type="number"
          placeholder="Enter your score"
          value={gameScore}
          onChange={(e) => setGameScore(parseInt(e.target.value) || 0)}
          min="0"
        />
        <button
          onClick={handleScoreSubmit}
          disabled={isSubmitting || !currentAccount}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Score'}
        </button>
      </div>
    </div>
  )
}

export const GameCard: React.FC<{
  game: Game
  onPlay: (game: Game) => void
  onRate?: (gameId: string, rating: number) => void
}> = ({ game, onPlay, onRate }) => {
  const [rating, setRating] = useState(0)
  const [isRating, setIsRating] = useState(false)

  const posterUrl = getWalrusUrl(game.poster_walrus_id)
  const averageRating =
    game.rating_count === '0'
      ? 0
      : parseInt(game.rating_sum) / parseInt(game.rating_count)

  const handleRate = async () => {
    if (rating === 0) {
      alert('Please select a rating')
      return
    }

    setIsRating(true)
    try {
      await onRate?.(game.id, rating)
      alert('Rating submitted successfully!')
      setRating(0)
    } catch (error) {
      console.error('Rating failed:', error)
      alert('Failed to submit rating')
    } finally {
      setIsRating(false)
    }
  }

  return (
    <div className="game-card">
      <img
        src={posterUrl}
        alt={game.name}
        className="game-poster"
        onError={(e) => {
          e.currentTarget.src = '/placeholder-game.png' // fallback image
        }}
      />

      <div className="game-info">
        <h3>{game.name}</h3>
        <p>{game.description}</p>

        <div className="game-stats">
          <span>Plays: {game.play_count}</span>
          <span>Rating: {averageRating.toFixed(1)}/5</span>
          <span>High Score: {game.high_score}</span>
          {game.featured && <span className="featured">⭐ Featured</span>}
          {game.is_mobile_friendly && <span className="mobile">📱 Mobile</span>}
        </div>

        <div className="game-actions">
          <button onClick={() => onPlay(game)} className="play-button">
            Play Game
          </button>

          <div className="rating-section">
            <select
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
            >
              <option value={0}>Rate this game</option>
              <option value={1}>⭐ 1 Star</option>
              <option value={2}>⭐⭐ 2 Stars</option>
              <option value={3}>⭐⭐⭐ 3 Stars</option>
              <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
              <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
            </select>
            <button onClick={handleRate} disabled={isRating || rating === 0}>
              {isRating ? 'Rating...' : 'Rate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
