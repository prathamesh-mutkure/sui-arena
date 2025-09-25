import { Star, TrendingUp, Users, Zap } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

interface GameCardProps {
  title: string
  category: string
  players: number
  highScore: number
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
  trending?: boolean
  imageUrl?: string
  gameId: string
}

export function GameCard({
  title,
  category,
  players,
  highScore,
  difficulty,
  trending = false,
  imageUrl,
  gameId,
}: GameCardProps) {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-success'
      case 'Medium':
        return 'bg-warning'
      case 'Hard':
        return 'bg-destructive'
      case 'Expert':
        return 'bg-epic'
      default:
        return 'bg-muted'
    }
  }

  return (
    <div className="pixel-card-game p-6 bg-card min-w-[300px] relative group max-w-full">
      {trending && (
        <div className="absolute top-4 right-4 flex items-center space-x-1 badge-legendary">
          <TrendingUp className="w-3 h-3" />
          <span>Trending</span>
        </div>
      )}

      {/* Game Image Placeholder */}
      <div className="pixel-card bg-muted mb-4 h-32 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Zap className="w-12 h-12 text-muted-foreground" />
        )}
      </div>

      {/* Game Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            {category}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-primary" />
            <span>{players.toLocaleString()} players</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-warning" />
            <span>{highScore.toLocaleString()} high score</span>
          </div>
        </div>

        {/* Difficulty Badge */}
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center px-3 py-1 text-xs font-bold text-white ${getDifficultyColor(difficulty)} pixel-card`}
          >
            {difficulty}
          </div>
          <Link to="/game/$gameId" params={{ gameId }}>
            <Button variant="pixel" size="sm">
              Play Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
