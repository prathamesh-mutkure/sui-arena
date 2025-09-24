import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanstackDevtools } from '@tanstack/react-devtools'
import { getFullnodeUrl } from '@mysten/sui/client'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import * as TanStackQueryProvider from '../integrations/tanstack-query/root-provider.tsx'

import type { QueryClient } from '@tanstack/react-query'
import { Navbar } from '@/components/navbar'

interface MyRouterContext {
  queryClient: QueryClient
}

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()

const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
        <SuiClientProvider networks={networks} defaultNetwork="devnet">
          <WalletProvider>
            <div className="min-h-screen bg-background">
              <Navbar />

              <Outlet />

              <TanstackDevtools
                config={{
                  position: 'bottom-left',
                }}
                plugins={[
                  {
                    name: 'Tanstack Router',
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                  TanStackQueryDevtools,
                ]}
              />
            </div>
          </WalletProvider>
        </SuiClientProvider>
      </TanStackQueryProvider.Provider>
    </>
  ),
})
