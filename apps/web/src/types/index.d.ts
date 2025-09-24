type TGameCategory =
  | 'featured'
  | 'action'
  | 'adventure'
  | 'arcade'
  | 'puzzle'
  | 'strategy'
  | 'sports'
  | 'racing'
  | 'simulation'
  | 'casino'
  | 'partner'
  | 'other'

type Game = {
  id: string
  name: string
  poster: string
  flashFile: string
  categories: Array<TGameCategory>
  description: string
  featured?: boolean
  isMobileFriendly: boolean
  type: 'flash' | 'iframe'
}
