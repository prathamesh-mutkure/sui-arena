import { createFileRoute } from '@tanstack/react-router'
import { GameUploadForm } from '@/components/game-upload-form'

export const Route = createFileRoute('/game/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <GameUploadForm />
    </>
  )
}
