'use client'

import { ConnectKitButton } from 'connectkit'
import { AIMemeGenerator } from './components/AIMemeGenerator'
import { MemeNFTGallery } from './components/MemeNFTGallery'

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meme NFT AI Agent</h1>
        <ConnectKitButton />
      </div>

      <div className="flex flex-col gap-8">
        <AIMemeGenerator />
        <MemeNFTGallery />
      </div>
    </div>
  )
}
