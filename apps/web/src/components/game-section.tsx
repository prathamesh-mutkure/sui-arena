import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GameCard } from './game-card'
import { Button } from '@/components/ui/button'

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
                gameId={game.id}
                title={game.name}
                category={game.categories[0]}
                players={10}
                highScore={100}
                difficulty="Medium"
                trending={false}
                imageUrl={game.poster}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
