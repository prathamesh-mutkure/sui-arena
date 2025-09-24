import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { GamepadIcon, User, Wallet } from 'lucide-react'
import { ConnectModal, useCurrentAccount } from '@mysten/dapp-kit'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const currentAccount = useCurrentAccount()
  const [open, setOpen] = useState(false)

  return (
    <>
      <ConnectModal
        trigger
        open={open}
        onOpenChange={(isOpen) => setOpen(isOpen)}
      />

      <nav className="navbar-pixel px-6 py-4 ">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="pixel-avatar w-10 h-10 bg-primary flex items-center justify-center">
              <GamepadIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Sui Arena</h1>
              <p className="text-xs text-muted-foreground">POWERED BY WALRUS</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="font-medium transition-colors text-foreground hover:text-primary"
              activeProps={{
                className: 'text-primary',
              }}
            >
              Games
            </Link>
            <Link
              to="/"
              className="font-medium transition-colors text-foreground hover:text-primary"
              activeProps={{
                className: 'text-primary',
              }}
            >
              Leaderboard
            </Link>
            <Link
              to="/"
              className="font-medium transition-colors text-foreground hover:text-primary"
              activeProps={{
                className: 'text-primary',
              }}
            >
              Tournaments
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="pixel-outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="cursor-pointer"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {currentAccount
                ? currentAccount.address.slice(0, 6) + '...'
                : 'Connect Wallet'}
            </Button>

            <Link to="/profile" className="">
              <Button variant="pixel" size="icon" className="cursor-pointer">
                <User className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
