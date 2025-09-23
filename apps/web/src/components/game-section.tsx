import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GameCard } from './game-card'
import { Button } from '@/components/ui/button'

interface Game {
  id: string
  title: string
  category: string
  players: number
  highScore: number
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
  trending?: boolean
  imageUrl?: string
}

interface GameSectionProps {
  title: string
  games: Array<Game>
}

export function GameSection({ title, games }: GameSectionProps) {
  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">{title}</h2>
          <div className="flex space-x-2">
            <Button variant="pixel-outline" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="pixel-outline" size="icon">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Games Grid - Horizontal Scroll */}
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-6 min-w-max">
            {games.map((game) => (
              <GameCard
                key={game.id}
                title={game.title}
                category={game.category}
                players={game.players}
                highScore={game.highScore}
                difficulty={game.difficulty}
                trending={game.trending}
                imageUrl={game.imageUrl}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
