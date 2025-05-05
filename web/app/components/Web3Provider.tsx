'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { soneium } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'

// Create a client
const queryClient = new QueryClient()

const config = createConfig(
  getDefaultConfig({
    chains: [soneium],
    transports: {
      [soneium.id]: http(`${process.env.NEXT_PUBLIC_RPC_URL}`),
    },

    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',

    appName: 'MEME Agent',

    // Optional App Info
    appDescription: 'MEME Agent',
  }),
)

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
