import { Play, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="hero-gradient relative py-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
            Welcome to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-primary-light">
              Sui Arena
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            The ultimate blockchain gaming platform where players compete, earn,
            and build their gaming legacy on Walrus & Sui.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="pixel" size="lg" className="text-lg px-8 py-4">
              <Play className="w-5 h-5 mr-2" />
              Start Playing
            </Button>
            <Button
              variant="pixel-outline"
              size="lg"
              className="text-lg px-8 py-4 bg-white/10 border-white text-white"
            >
              <Trophy className="w-5 h-5 mr-2" />
              View Leaderboard
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="pixel-card bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <div className="text-3xl font-bold text-white mb-2">10,000+</div>
              <div className="text-white/80">Active Players</div>
            </div>
            <div className="pixel-card bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <div className="text-3xl font-bold text-white mb-2">25</div>
              <div className="text-white/80">Gaming Titles</div>
            </div>
            <div className="pixel-card bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <div className="text-3xl font-bold text-white mb-2">$500K+</div>
              <div className="text-white/80">Prize Pool</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-white/10 pixel-card"></div>
      <div className="absolute bottom-20 right-10 w-12 h-12 bg-white/10 pixel-card"></div>
      <div className="absolute top-1/2 left-20 w-8 h-8 bg-white/10 pixel-card"></div>
    </section>
  )
}
