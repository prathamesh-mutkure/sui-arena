import { create } from 'zustand'
import { sampleGames } from '@/lib/games'

export type GameState = {
  games: Array<Game>
  selectedGame: Game | null
}

export type GameActions = {
  addGame: (game: Game) => void
  removeGame: (id: string) => void
  updateGame: (id: string, updatedGame: Partial<Game>) => void
  selectGame: (id: string) => void
  clearSelectedGame: () => void
}

export type GameStore = GameState & GameActions

const useGameStore = create<GameStore>((set) => ({
  games: [...sampleGames],
  selectedGame: null,

  addGame: (game) =>
    set((state) => ({
      games: [...state.games, game],
    })),

  removeGame: (id) =>
    set((state) => ({
      games: state.games.filter((game) => game.id !== id),
      selectedGame: state.selectedGame?.id === id ? null : state.selectedGame,
    })),

  updateGame: (id, updatedGame) =>
    set((state) => ({
      games: state.games.map((game) =>
        game.id === id ? { ...game, ...updatedGame } : game,
      ),
      selectedGame:
        state.selectedGame?.id === id
          ? { ...state.selectedGame, ...updatedGame }
          : state.selectedGame,
    })),

  // TODO: ID type
  selectGame: (id) =>
    set((state) => ({
      selectedGame: state.games.find((game) => game.id == id) || null,
    })),

  clearSelectedGame: () =>
    set(() => ({
      selectedGame: null,
    })),
}))

export default useGameStore
