'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface MemeNFT {
  id: string
  tokenId: string
  owner: string
  tokenURI: string
}

export function MemeNFTGallery() {
  const [nfts, setNfts] = useState<MemeNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNFTs() {
      try {
        // This is a mock implementation - in a real app, you would use a GraphQL client
        // like Apollo or urql to execute the query against your GraphQL endpoint
        const mockData = {
          data: {
            memeNFTs: [
              {
                id: '0x00',
                tokenId: '0',
                owner: '0xc1a6a1daa5a1ac828b6a5ad1c59bc4bbf7be6723',
                tokenURI:
                  'https://api.memegen.link/images/woman-cat/My_Code/Production_Environment.png',
              },
              {
                id: '0x01',
                tokenId: '1',
                owner: '0xc1a6a1daa5a1ac828b6a5ad1c59bc4bbf7be6723',
                tokenURI:
                  'https://api.memegen.link/images/woman-cat/My_Code/Production_Environment.png',
              },
              {
                id: '0x02',
                tokenId: '2',
                owner: '0xc1a6a1daa5a1ac828b6a5ad1c59bc4bbf7be6723',
                tokenURI:
                  'https://api.memegen.link/images/drake/Code_working_perfectly_in_development/Code_breaking_in_production.png',
              },
            ],
          },
        }

        setNfts(mockData.data.memeNFTs)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching NFTs:', err)
        setError('Failed to load NFTs. Please try again later.')
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [])

  // Function to truncate Ethereum addresses
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4,
    )}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        No meme NFTs found. Create your first one!
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Minted Meme NFTs</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft) => (
          <div
            key={nft.id}
            className="group relative bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="relative aspect-square w-full">
              <Image
                src={nft.tokenURI}
                alt={`Meme NFT #${nft.tokenId}`}
                fill
                className="object-contain p-2"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>

            {/* Overlay that appears on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex flex-col justify-end transition-all duration-300 opacity-0 group-hover:opacity-100">
              <div className="p-4 text-white">
                <div className="font-semibold text-lg">Meme #{nft.tokenId}</div>
                <div className="text-sm opacity-80">
                  Owner: {truncateAddress(nft.owner)}
                </div>
                <div className="mt-2 flex gap-2">
                  <a
                    href={nft.tokenURI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-white"
                  >
                    View
                  </a>
                  <button
                    className="text-xs bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white"
                    onClick={() => window.open(nft.tokenURI, '_blank')}
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
