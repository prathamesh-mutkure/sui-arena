import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { GameSection } from '@/components/game-section'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const arcadeGames = [
    {
      id: '1',
      title: 'Pixel Warrior',
      category: 'Action',
      players: 2840,
      highScore: 45200,
      difficulty: 'Medium' as const,
      trending: true,
    },
    {
      id: '2',
      title: 'Crypto Tetris',
      category: 'Puzzle',
      players: 5120,
      highScore: 89750,
      difficulty: 'Easy' as const,
    },
    {
      id: '3',
      title: 'Block Runner',
      category: 'Endless',
      players: 1890,
      highScore: 12340,
      difficulty: 'Hard' as const,
    },
    {
      id: '4',
      title: 'Sui Shooter',
      category: 'Arcade',
      players: 3456,
      highScore: 67890,
      difficulty: 'Expert' as const,
      trending: true,
    },
  ]

  const racingGames = [
    {
      id: '5',
      title: 'Blockchain Racers',
      category: 'Racing',
      players: 4200,
      highScore: 156780,
      difficulty: 'Medium' as const,
    },
    {
      id: '6',
      title: 'Neon Highway',
      category: 'Racing',
      players: 2890,
      highScore: 89320,
      difficulty: 'Hard' as const,
    },
    {
      id: '7',
      title: 'Pixel Drift',
      category: 'Racing',
      players: 1560,
      highScore: 45670,
      difficulty: 'Easy' as const,
      trending: true,
    },
  ]

  const mobileGames = [
    {
      id: '8',
      title: 'Tap Master',
      category: 'Mobile',
      players: 8920,
      highScore: 234560,
      difficulty: 'Easy' as const,
    },
    {
      id: '9',
      title: 'Swipe Quest',
      category: 'Mobile',
      players: 5670,
      highScore: 145230,
      difficulty: 'Medium' as const,
    },
    {
      id: '10',
      title: 'Touch Arena',
      category: 'Mobile',
      players: 3450,
      highScore: 78910,
      difficulty: 'Hard' as const,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <GameSection title="🕹️ Arcade Classics" games={arcadeGames} />
      <GameSection title="🏎️ Racing Games" games={racingGames} />
      <GameSection title="📱 Mobile Games" games={mobileGames} />
    </div>
  )
}
