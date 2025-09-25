export const GamingPlatform: React.FC = () => {
  const [currentView, setCurrentView] = useState<
    'games' | 'upload' | 'profile'
  >('games')
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [platformStats, setPlatformStats] = useState({
    totalGames: 0,
    totalUsers: 0,
    uploadFee: '0',
  })

  const currentAccount = useCurrentAccount()
  const { rateGame, getPlatformStats } = usePlatformOperations()

  useEffect(() => {
    if (currentAccount) {
      loadPlatformStats()
      // Load games from your indexer or events
    }
  }, [currentAccount])

  const loadPlatformStats = async () => {
    try {
      const stats = await getPlatformStats()
      setPlatformStats(stats)
    } catch (error) {
      console.error('Failed to load platform stats:', error)
    }
  }

  const handlePlayGame = (game: Game) => {
    setSelectedGame(game)
  }

  const handleGameComplete = (score: number) => {
    console.log(`Game completed with score: ${score}`)
    // Optionally refresh games list or user stats
  }

  const handleRateGame = async (gameId: string, rating: number) => {
    await rateGame(gameId, rating)
  }

  return (
    <div className="gaming-platform">
      <header className="platform-header">
        <h1>🎮 Sui Gaming Arena</h1>

        <nav>
          <button
            className={currentView === 'games' ? 'active' : ''}
            onClick={() => setCurrentView('games')}
          >
            Games ({platformStats.totalGames})
          </button>
          <button
            className={currentView === 'upload' ? 'active' : ''}
            onClick={() => setCurrentView('upload')}
          >
            Upload Game
          </button>
          <button
            className={currentView === 'profile' ? 'active' : ''}
            onClick={() => setCurrentView('profile')}
          >
            Profile
          </button>
        </nav>

        <div className="wallet-section">
          <WalletConnection />
        </div>
      </header>

      <main className="platform-content">
        {!currentAccount ? (
          <div className="welcome-section">
            <h2>Welcome to Sui Gaming Arena</h2>
            <p>Connect your wallet to start playing and uploading games!</p>
            <div className="platform-stats">
              <p>Total Games: {platformStats.totalGames}</p>
              <p>Total Users: {platformStats.totalUsers}</p>
            </div>
          </div>
        ) : selectedGame ? (
          <div>
            <button onClick={() => setSelectedGame(null)}>
              ← Back to Games
            </button>
            <h2>Playing: {selectedGame.name}</h2>
            <GamePlayer
              gameId={selectedGame.id}
              gameFileWalrusId={selectedGame.game_file_walrus_id}
              gameType={selectedGame.game_type}
              onGameComplete={handleGameComplete}
            />
          </div>
        ) : currentView === 'games' ? (
          <div className="games-section">
            <h2>Available Games</h2>
            <div className="games-grid">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPlay={handlePlayGame}
                  onRate={handleRateGame}
                />
              ))}
            </div>
          </div>
        ) : currentView === 'upload' ? (
          <div className="upload-section">
            <UserRegistration onRegistered={() => {}} />
            <GameUploadForm />
          </div>
        ) : (
          <UserDashboard />
        )}
      </main>
    </div>
  )
}

// Helper functions and constants
export function getWalrusUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR_URL}/v1/${blobId}`
}

export function validateGameFile(file: File, gameType: number): boolean {
  if (gameType === 0) {
    // SWF file
    return (
      file.type === 'application/x-shockwave-flash' ||
      file.name.endsWith('.swf')
    )
  }
  return true
}

export const GAME_CATEGORIES = {
  FEATURED: 0,
  ACTION: 1,
  ADVENTURE: 2,
  ARCADE: 3,
  PUZZLE: 4,
  STRATEGY: 5,
  SPORTS: 6,
  RACING: 7,
  SIMULATION: 8,
  CASINO: 9,
  OTHER: 10,
} as const

export const GAME_TYPES = {
  SWF: 0,
  URL: 1,
} as const

export const ACHIEVEMENT_RARITIES = {
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3,
} as const
