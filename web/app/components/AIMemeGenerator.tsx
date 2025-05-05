'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import toast from 'react-hot-toast'
import Image from 'next/image'

export function AIMemeGenerator() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [memeUrl, setMemeUrl] = useState<string | null>(null)

  const MAX_PROMPT_LENGTH = 500
  const MIN_PROMPT_LENGTH = 10

  const EXAMPLE_PROMPT =
    'Create a funny meme about programming where the code works perfectly in development but breaks in production. Make it relatable for developers who have experienced this common frustration.'

  // Handle prompt changes with length validation
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value
    if (input.length <= MAX_PROMPT_LENGTH) {
      setPrompt(input)
    }
  }

  const useExamplePrompt = () => {
    setPrompt(EXAMPLE_PROMPT)
  }

  const { address } = useAccount()

  const handleGenerateMeme = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    if (prompt.trim().length < MIN_PROMPT_LENGTH) {
      toast.error(`Prompt must be at least ${MIN_PROMPT_LENGTH} characters`)
      return
    }

    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsGenerating(true)
    setMemeUrl(null)
    const loadingToast = toast.loading(
      'AI is creating your meme and minting an NFT...',
    )

    try {
      const response = await fetch('/api/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          userAddress: address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate meme')
      }

      setResult(data)

      // Extract meme URL from the response if available
      if (data.memeUrl) {
        setMemeUrl(data.memeUrl)
      } else if (data.message) {
        // Try to extract URL from AI message
        const urlMatch = data.message.match(
          /(https?:\/\/api\.memegen\.link\/images\/[^\s"]+)/i,
        )
        if (urlMatch && urlMatch[1]) {
          setMemeUrl(urlMatch[1])
        }
      }

      toast.success('Your meme NFT has been created!')
    } catch (error) {
      console.error('Error:', error)
      toast.error(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    } finally {
      setIsGenerating(false)
      toast.dismiss(loadingToast)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Describe your meme
        </label>
        <div className="mb-2">
          <button
            onClick={useExamplePrompt}
            className="text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded hover:bg-gray-200"
            disabled={isGenerating}
          >
            Use example prompt
          </button>
        </div>
        <textarea
          id="prompt"
          value={prompt}
          onChange={handlePromptChange}
          placeholder="E.g., A cat programming a computer but looking very confused"
          className="w-full p-2 border border-gray-300 rounded h-24"
          disabled={isGenerating}
        />
        <div className="text-xs mt-1 text-right">
          <span
            className={
              prompt.trim().length < MIN_PROMPT_LENGTH && prompt.length > 0
                ? 'text-red-500'
                : 'text-gray-500'
            }
          >
            {prompt.length}/{MAX_PROMPT_LENGTH} characters
            {prompt.trim().length < MIN_PROMPT_LENGTH &&
              prompt.length > 0 &&
              ` (min ${MIN_PROMPT_LENGTH})`}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          For best results, be detailed and specific about the meme you want to
          create.
        </p>
      </div>

      <button
        onClick={handleGenerateMeme}
        disabled={
          !address ||
          !prompt.trim() ||
          prompt.trim().length < MIN_PROMPT_LENGTH ||
          isGenerating
        }
        className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isGenerating ? 'Generating...' : 'Generate & Mint Meme NFT'}
      </button>

      {memeUrl && (
        <div className="mt-6 p-2 border border-gray-200 rounded">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Generated Meme:
          </p>
          <div className="relative w-full h-64">
            <Image
              src={memeUrl}
              alt="Generated meme"
              fill
              style={{ objectFit: 'contain' }}
              className="rounded"
            />
          </div>
        </div>
      )}

      {result && result.message && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm font-medium text-gray-700">AI Response:</p>
          <p className="text-sm text-gray-600 mt-1">{result.message}</p>
        </div>
      )}

      {!address && (
        <div className="mt-4 p-3 bg-yellow-100 text-yellow-700 rounded">
          Please connect your wallet to generate and mint a meme NFT.
        </div>
      )}
    </div>
  )
}
