'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { MemeNFT, fetchMemeNFTs } from '../lib/graphql'
import { MEMEGEN_API_BASE } from '../utils/genMemeUrl'

export function MemeNFTGallery() {
  const [nfts, setNfts] = useState<MemeNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [newNftIds, setNewNftIds] = useState<Set<string>>(new Set())
  const previousNftIdsRef = useRef<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Poll for new NFTs every 2 seconds (increased from 2 seconds)
  const POLLING_INTERVAL = 2000
  const ITEMS_PER_PAGE = 10

  const fetchNFTs = async (pageNumber = 1, isInitialLoad = false) => {
    console.log('Fetching NFTs for page:', pageNumber)
    try {
      if (isInitialLoad) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      // Use the fetchMemeNFTs utility function with pagination
      const memeNFTs = await fetchMemeNFTs(
        ITEMS_PER_PAGE,
        (pageNumber - 1) * ITEMS_PER_PAGE,
      )

      // Check if images are accessible
      const checkImageAccessible = async (url: string): Promise<boolean> => {
        try {
          const response = await fetch(url, { method: 'HEAD' })
          return response.ok
        } catch (error) {
          console.error('Error checking image accessibility:', error)
          return false
        }
      }

      // Filter NFTs that have a valid image URL and are accessible
      const filteredMemeNFTsPromises = memeNFTs
        .filter((nft) => nft.tokenURI.includes(MEMEGEN_API_BASE))
        .map(async (nft) => {
          const isAccessible = await checkImageAccessible(nft.tokenURI)
          return { nft, isAccessible }
        })

      const accessibilityResults = await Promise.all(filteredMemeNFTsPromises)
      const filteredMemeNFTs = accessibilityResults
        .filter((result) => result.isAccessible)
        .map((result) => result.nft)

      // If we got fewer items than requested, there are no more items to load
      if (memeNFTs.length < ITEMS_PER_PAGE) {
        console.log('No more items to load')
        setHasMore(false)
      }

      // Check for new NFTs only on polling, not when loading more pages
      if (isInitialLoad) {
        if (previousNftIdsRef.current.size > 0) {
          const newTokenIds = new Set<string>()

          // Find NFTs that weren't in the previous set
          filteredMemeNFTs.forEach((nft) => {
            if (!previousNftIdsRef.current.has(nft.tokenId)) {
              newTokenIds.add(nft.tokenId)
              setNfts((prev) => [nft, ...prev])
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
        } else {
          setNfts(filteredMemeNFTs)
        }

        previousNftIdsRef.current = new Set(
          filteredMemeNFTs.map((nft) => nft.tokenId),
        )
      } else {
        // Append new NFTs to existing list
        setNfts((prev) => [...prev, ...filteredMemeNFTs])
      }

      setLoading(false)
      setLoadingMore(false)
    } catch (err) {
      console.error('Error fetching NFTs:', err)
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Function to load more NFTs
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchNFTs(nextPage, false)
    }
  }, [page, loadingMore, hasMore])

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    // Only set up the observer after the component has fully rendered and nfts exist
    if (loadMoreRef.current && hasMore && nfts.length > 0) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !loadingMore) {
            loadMore()
          }
        },
        { threshold: 0.1 },
      )

      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore, loadingMore, hasMore, nfts.length])

  useEffect(() => {
    // Initial fetch
    fetchNFTs(1, true)

    // Set up polling for new NFTs (first page only)
    const intervalId = setInterval(() => fetchNFTs(1, true), POLLING_INTERVAL)

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

      {/* Loading indicator for infinite scroll */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex justify-center items-center p-4 mt-2"
        >
          {loadingMore ? (
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
          ) : (
            <div className="h-6 w-6"></div> // Empty div to ensure the ref is always attached to something visible
          )}
        </div>
      )}
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
  const nftTokenURI = nft.tokenURI
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className={`group relative bg-gray-100 overflow-hidden transition-all duration-300 ${
        isNew ? 'ring-4 ring-purple-500 animate-pulse' : ''
      }`}
    >
      <div className="w-full">
        {!imageLoaded && !imageError && (
          <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
            <div className="w-8 h-8 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
          </div>
        )}
        {!imageError ? (
          <Image
            src={nftTokenURI}
            alt={`Meme NFT #${nft.tokenId}`}
            width={400}
            height={400}
            quality={75}
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            loading={parseInt(nft.tokenId) < 5 ? undefined : 'lazy'}
            className={`w-full h-auto ${
              !imageLoaded ? 'invisible absolute' : ''
            }`}
            priority={parseInt(nft.tokenId) < 5}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="w-full aspect-square bg-gray-300 flex items-center justify-center text-gray-500 text-sm">
            Failed to load image
          </div>
        )}
      </div>

      {/* Overlay that appears on hover */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 flex flex-col justify-end transition-all duration-300 opacity-0 group-hover:opacity-100">
        <div className="p-2 text-white">
          <div className="font-semibold text-sm">#{nft.tokenId}</div>
          <div className="text-xs opacity-80">{truncateAddress(nft.owner)}</div>
          <div className="mt-1 flex gap-1">
            <a
              href={nftTokenURI}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-0.5 rounded text-white"
            >
              View
            </a>
            <button
              className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-0.5 rounded text-white"
              onClick={() => window.open(nftTokenURI, '_blank')}
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
