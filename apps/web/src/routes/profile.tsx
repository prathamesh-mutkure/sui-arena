import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { Award, Calendar, Gamepad2, Star, Target, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type UserProfile, usePlatformOperations } from '@/lib/sui-client'
import { generateUsername } from 'unique-username-generator'

export const Route = createFileRoute('/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  const currentAccount = useCurrentAccount()
  const { getUserProfile } = usePlatformOperations()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const achievements = [
    {
      id: 1,
      name: 'Early Adopter',
      description: 'Joined during beta',
      rarity: 'legendary',
      icon: Calendar,
    },
    {
      id: 2,
      name: 'Over Achiever',
      description: 'Completed 100 games',
      rarity: 'epic',
      icon: Trophy,
    },
    {
      id: 3,
      name: 'Speed Demon',
      description: 'Set 10 speed records',
      rarity: 'rare',
      icon: Target,
    },
    {
      id: 4,
      name: 'Social Gamer',
      description: 'Played with 50+ friends',
      rarity: 'rare',
      icon: Gamepad2,
    },
  ]

  const getRarityBadgeClass = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'badge-legendary'
      case 'epic':
        return 'badge-epic'
      case 'rare':
        return 'badge-rare'
      default:
        return 'badge-rare'
    }
  }

  async function _getUserProfile(userAddress: string) {
    const user = await getUserProfile(userAddress)
    setUserProfile(user)

    console.log(user)
  }

  useEffect(() => {
    if (!currentAccount?.address) {
      return
    }

    _getUserProfile(currentAccount.address)
  }, [currentAccount?.address])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="pixel-card p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="pixel-avatar w-32 h-32 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-4xl font-bold text-white">G</span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {userProfile ? generateUsername() : '-'}
              </h1>
              <p className="text-muted-foreground mb-4">
                Elite Arcade Champion
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="pixel-card p-4 bg-primary/10 border-primary">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {userProfile?.total_score ?? '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Score
                  </div>
                </div>
                <div className="pixel-card p-4 bg-secondary/10 border-secondary">
                  <div className="text-2xl font-bold text-secondary mb-1">
                    {userProfile?.games_played ?? '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Games Played
                  </div>
                </div>
                <div className="pixel-card p-4 bg-success/10 border-success">
                  <div className="text-2xl font-bold text-success mb-1">
                    {userProfile?.games_uploaded ?? '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Games Uploaded
                  </div>
                </div>
                <div className="pixel-card p-4 bg-warning/10 border-warning">
                  <div className="text-2xl font-bold text-warning mb-1">
                    {userProfile?.reputation_score ?? '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Reputation Score
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="pixel" className="flex-1">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Challenge Friend
                </Button>
                <Button variant="pixel-outline" className="flex-1">
                  <Star className="w-4 h-4 mr-2" />
                  Share Profile
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="pixel-card p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Award className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Achievements</h2>
            <span className="badge-rare">{achievements.length} Unlocked</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="pixel-card p-6 bg-muted/30 border-muted hover:border-primary transition-colors"
              >
                <div className="flex items-start space-x-4">
                  <div className="pixel-card bg-primary p-3">
                    <achievement.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-bold text-foreground">
                        {achievement.name}
                      </h3>
                      <span className={getRarityBadgeClass(achievement.rarity)}>
                        {achievement.rarity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Achievement Progress */}
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Next Goals
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Master Strategist
                </span>
                <span className="text-sm font-medium">
                  8/10 Strategy Games Won
                </span>
              </div>
              <div className="w-full bg-muted pixel-card h-3">
                <div className="bg-primary h-full pixel-card w-4/5"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
