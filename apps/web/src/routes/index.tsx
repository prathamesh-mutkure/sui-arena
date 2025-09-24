import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { GameSection } from '@/components/game-section'
import { sampleGames } from '@/lib/games'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const categorizedGames = {
    featured: sampleGames.filter((game) => game.featured),
    arcade: sampleGames.filter((game) => game.categories.includes('arcade')),
    mobile: sampleGames.filter((game) => game.isMobileFriendly),
    partner: sampleGames.filter((game) => game.categories.includes('partner')),
    racing: sampleGames.filter((game) => game.categories.includes('racing')),
    action: sampleGames.filter((game) => game.categories.includes('action')),
    adventure: sampleGames.filter((game) =>
      game.categories.includes('adventure'),
    ),
    puzzle: sampleGames.filter((game) => game.categories.includes('puzzle')),
    strategy: sampleGames.filter((game) =>
      game.categories.includes('strategy'),
    ),
    sports: sampleGames.filter((game) => game.categories.includes('sports')),
    simulation: sampleGames.filter((game) =>
      game.categories.includes('simulation'),
    ),
    casino: sampleGames.filter((game) => game.categories.includes('casino')),
    other: sampleGames.filter((game) => game.categories.includes('other')),
  }

  return (
    <div className="">
      <HeroSection />

      {categorizedGames.featured.length > 0 && (
        <GameSection title="Featured Games" games={categorizedGames.featured} />
      )}

      {categorizedGames.partner.length > 0 && (
        <GameSection title="Partner Games" games={categorizedGames.partner} />
      )}

      {categorizedGames.mobile.length > 0 && (
        <GameSection title="Mobile Friendly" games={categorizedGames.mobile} />
      )}

      {Object.entries(categorizedGames).map(
        ([category, categoryGames], index) => {
          // Skip featured category as it's already shown and empty categories
          if (
            category === 'featured' ||
            category === 'partner games' ||
            category == 'mobile' ||
            categoryGames.length === 0
          )
            return null

          return (
            <GameSection
              key={index}
              title={category.charAt(0).toUpperCase() + category.slice(1)}
              games={categoryGames}
            />
          )
        },
      )}
    </div>
  )
}
