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
