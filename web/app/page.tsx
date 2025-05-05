'use client'

import { ConnectKitButton } from 'connectkit'
import { MintNFT } from './components/MintNFT'

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">NFT Minting App</h1>
        <ConnectKitButton />
      </div>

      <MintNFT />
    </div>
  )
}
