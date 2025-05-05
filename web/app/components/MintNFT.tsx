'use client'

import { useState, useEffect } from 'react'
import {
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
} from 'wagmi'
import toast from 'react-hot-toast'

const NFT_CONTRACT_ADDRESS = '0x0Eb5E44Da15d0D0ae51B5E2d24f5489FDf0EC7B0'
const NFT_CONTRACT_ABI = [
  {
    type: 'function',
    name: 'mintMeme',
    inputs: [
      { name: 'tokenURI', type: 'string', internalType: 'string' },
      { name: 'to', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
]

export function MintNFT() {
  const [tokenURI, setTokenURI] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null)

  const { address } = useAccount()
  const { data: hash, writeContract, error, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  // Handle error notifications
  useEffect(() => {
    if (error) {
      toast.error(`Transaction failed: ${error.message}`)
    }
  }, [error])

  // Handle success notifications
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success('Successfully minted your NFT!')
    }
  }, [isConfirmed, hash])

  const handleMint = async () => {
    if (!tokenURI || !address) return

    try {
      setIsLoading(true)
      toast.loading('Preparing transaction...', { id: 'mint-tx' })

      writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_CONTRACT_ABI,
        functionName: 'mintMeme',
        args: [tokenURI, address],
      })
    } catch (err) {
      console.error('Mint error:', err)
      toast.error(
        `Mint failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    } finally {
      setIsLoading(false)
      toast.dismiss('mint-tx')
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Mint Your NFT</h2>

      <div className="mb-4">
        <label
          htmlFor="tokenURI"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Token URI (metadata URL)
        </label>
        <input
          id="tokenURI"
          type="text"
          value={tokenURI}
          onChange={(e) => setTokenURI(e.target.value)}
          placeholder="ipfs://..."
          className="w-full p-2 border border-gray-300 rounded"
          disabled={isPending || isConfirming}
        />
      </div>

      <button
        onClick={handleMint}
        disabled={!address || !tokenURI || isPending || isConfirming}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isPending ? 'Preparing...' : isConfirming ? 'Minting...' : 'Mint NFT'}
      </button>

      {!address && (
        <div className="mt-4 p-3 bg-yellow-100 text-yellow-700 rounded">
          Please connect your wallet to mint an NFT.
        </div>
      )}
    </div>
  )
}
