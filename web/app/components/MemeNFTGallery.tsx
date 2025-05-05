'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { MemeNFT, fetchMemeNFTs } from '../lib/graphql'

// Helper function to fix meme URLs by replacing // with _ but keeping https://
const fixMemeUrl = (url: string) => {
  // Split the URL into protocol and rest
  const [protocol, ...rest] = url.split('://')

  // Join the rest and replace any remaining double slashes with /_/
  const fixedRest = rest.join('://').replace(/\/\//g, '/_/')

  // Rejoin with the protocol
  return `${protocol}://${fixedRest}`
}

export function MemeNFTGallery() {
  const [nfts, setNfts] = useState<MemeNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newNftIds, setNewNftIds] = useState<Set<string>>(new Set())
  const previousNftIdsRef = useRef<Set<string>>(new Set())

  // Poll for new NFTs every 2 seconds
  const POLLING_INTERVAL = 2000

  const fetchNFTs = async () => {
    try {
      setLoading((prevLoading) => (nfts.length === 0 ? true : prevLoading))

      // Use the fetchMemeNFTs utility function
      const memeNFTs = await fetchMemeNFTs(100)

      // Check for new NFTs
      if (previousNftIdsRef.current.size > 0) {
        const newTokenIds = new Set<string>()

        // Find NFTs that weren't in the previous set
        memeNFTs.forEach((nft) => {
          if (!previousNftIdsRef.current.has(nft.tokenId)) {
            newTokenIds.add(nft.tokenId)
          }
        })

        if (newTokenIds.size > 0) {
          setNewNftIds(newTokenIds)
          console.log('New NFTs:', newTokenIds)
          // Clear the highlight after 5 seconds
          setTimeout(() => {
            setNewNftIds(new Set())
          }, 5000)
        }
      }

      // Update reference with current NFT IDs for next comparison
      previousNftIdsRef.current = new Set(memeNFTs.map((nft) => nft.tokenId))
      setNfts(memeNFTs)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching NFTs:', err)
      setError('Failed to load NFTs. Please try again later.')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchNFTs()

    // Set up polling
    const intervalId = setInterval(fetchNFTs, POLLING_INTERVAL)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  // Function to truncate Ethereum addresses
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4,
    )}`
  }

  if (loading && nfts.length === 0) {
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
                isNew={newNftIds.has(nft.tokenId)}
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
                isNew={newNftIds.has(nft.tokenId)}
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
                isNew={newNftIds.has(nft.tokenId)}
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
                isNew={newNftIds.has(nft.tokenId)}
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
  isNew = false,
}: {
  nft: MemeNFT
  truncateAddress: (address: string) => string
  isNew?: boolean
}) {
  // Fix the tokenURI if it contains double slashes
  const fixedTokenURI = fixMemeUrl(nft.tokenURI)

  return (
    <div
      className={`group relative bg-gray-100 overflow-hidden transition-all duration-300 ${
        isNew ? 'ring-4 ring-purple-500 animate-pulse' : ''
      }`}
    >
      <div className="w-full">
        <Image
          src={fixedTokenURI}
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
              href={fixedTokenURI}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-0.5 rounded text-white"
            >
              View
            </a>
            <button
              className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-0.5 rounded text-white"
              onClick={() => window.open(fixedTokenURI, '_blank')}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* "New" badge for newly minted NFTs */}
      {isNew && (
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
          NEW
        </div>
      )}
    </div>
  )
}
