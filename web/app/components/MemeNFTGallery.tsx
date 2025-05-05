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
                  'https://api.memegen.link/images/drake/Code_working_perfectly_in_development/Code_breaking_in_production.png',
              },
              {
                id: '0x02',
                tokenId: '2',
                owner: '0xc1a6a1daa5a1ac828b6a5ad1c59bc4bbf7be6723',
                tokenURI:
                  'https://api.memegen.link/images/fine/When_your_code_works/But_you_have_no_idea_why.png',
              },
              {
                id: '0x03',
                tokenId: '3',
                owner: '0x7f5a6a1daa5a1ac828b6a5ad1c59bc4bbf7be9087',
                tokenURI:
                  'https://api.memegen.link/images/afraid/CSS/is_coming.png',
              },
              {
                id: '0x04',
                tokenId: '4',
                owner: '0x7f5a6a1daa5a1ac828b6a5ad1c59bc4bbf7be9087',
                tokenURI:
                  'https://api.memegen.link/images/doge/such_code/much_wow.png',
              },
              {
                id: '0x05',
                tokenId: '5',
                owner: '0x5c2b6a1daa5a1ac828b6a5ad1c59bc4bbf7be1234',
                tokenURI:
                  'https://api.memegen.link/images/success/finally/fixed_that_bug.png',
              },
              {
                id: '0x06',
                tokenId: '6',
                owner: '0x5c2b6a1daa5a1ac828b6a5ad1c59bc4bbf7be1234',
                tokenURI:
                  'https://api.memegen.link/images/disaster-girl/git_merge/git_push_--force.png',
              },
              {
                id: '0x07',
                tokenId: '7',
                owner: '0x821a6a1daa5a1ac828b6a5ad1c59bc4bbf7be4567',
                tokenURI:
                  'https://api.memegen.link/images/morpheus/what_if_I_told_you/your_code_doesn%27t_work.png',
              },
              {
                id: '0x08',
                tokenId: '8',
                owner: '0x821a6a1daa5a1ac828b6a5ad1c59bc4bbf7be4567',
                tokenURI:
                  'https://api.memegen.link/images/patrick/lets_take_all_the_bugs/and_push_them_to_production.png',
              },
              {
                id: '0x09',
                tokenId: '9',
                owner: '0x918a6a1daa5a1ac828b6a5ad1c59bc4bbf7be8765',
                tokenURI:
                  'https://api.memegen.link/images/yodawg/yo_dawg_i_heard_you_like_bugs/so_I_put_bugs_in_your_fixes_so_you_can_debug_while_you_debug.png',
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

  // Function to split NFTs into columns for masonry layout
  const getColumnNFTs = (columnCount: number) => {
    const columns = Array.from({ length: columnCount }, () => [] as MemeNFT[])

    nfts.forEach((nft, index) => {
      const columnIndex = index % columnCount
      columns[columnIndex].push(nft)
    })

    return columns
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-3">
      {/* Mobile: 2 columns */}
      <div className="grid grid-cols-2 gap-[2px] sm:hidden">
        {getColumnNFTs(2).map((column, columnIndex) => (
          <div
            key={`column-${columnIndex}`}
            className="flex flex-col gap-[2px]"
          >
            {column.map((nft) => (
              <MemeNFTCard
                key={nft.id}
                nft={nft}
                truncateAddress={truncateAddress}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Tablet: 3 columns */}
      <div className="hidden sm:grid sm:grid-cols-3 md:hidden gap-[2px]">
        {getColumnNFTs(3).map((column, columnIndex) => (
          <div
            key={`column-${columnIndex}`}
            className="flex flex-col gap-[2px]"
          >
            {column.map((nft) => (
              <MemeNFTCard
                key={nft.id}
                nft={nft}
                truncateAddress={truncateAddress}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Medium desktop: 4 columns */}
      <div className="hidden md:grid md:grid-cols-4 lg:hidden gap-[2px]">
        {getColumnNFTs(4).map((column, columnIndex) => (
          <div
            key={`column-${columnIndex}`}
            className="flex flex-col gap-[2px]"
          >
            {column.map((nft) => (
              <MemeNFTCard
                key={nft.id}
                nft={nft}
                truncateAddress={truncateAddress}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Large desktop: 5 columns */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-[2px]">
        {getColumnNFTs(5).map((column, columnIndex) => (
          <div
            key={`column-${columnIndex}`}
            className="flex flex-col gap-[2px]"
          >
            {column.map((nft) => (
              <MemeNFTCard
                key={nft.id}
                nft={nft}
                truncateAddress={truncateAddress}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Extracted card component for reuse
function MemeNFTCard({
  nft,
  truncateAddress,
}: {
  nft: MemeNFT
  truncateAddress: (address: string) => string
}) {
  return (
    <div className="group relative bg-gray-100 overflow-hidden">
      <div className="w-full">
        <Image
          src={nft.tokenURI}
          alt={`Meme NFT #${nft.tokenId}`}
          width={500}
          height={500}
          unoptimized
          className="w-full h-auto"
          priority={parseInt(nft.tokenId) < 5}
        />
      </div>

      {/* Overlay that appears on hover */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 flex flex-col justify-end transition-all duration-300 opacity-0 group-hover:opacity-100">
        <div className="p-2 text-white">
          <div className="font-semibold text-sm">#{nft.tokenId}</div>
          <div className="text-xs opacity-80">{truncateAddress(nft.owner)}</div>
          <div className="mt-1 flex gap-1">
            <a
              href={nft.tokenURI}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-0.5 rounded text-white"
            >
              View
            </a>
            <button
              className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-0.5 rounded text-white"
              onClick={() => window.open(nft.tokenURI, '_blank')}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
