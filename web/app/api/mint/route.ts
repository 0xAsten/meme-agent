import { generateText, tool } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { soneium } from 'wagmi/chains'
import templatesData from '../../lib/templates.json'
import { MEMEGEN_API_BASE, generateMemeUrl } from '../../utils/genMemeUrl'

// Define the template interface to match the structure in templates.json
interface MemeTemplate {
  id: string
  name: string
  lines?: number
  overlays?: number
  styles?: string[]
  blank?: string
  example?: {
    text: string[]
    url: string
  }
  source?: string | null
  keywords?: string[]
  _self?: string
}

// Use the imported JSON directly
const MEME_TEMPLATES = templatesData as MemeTemplate[]

const PRIVATE_KEY = process.env.PRIVATE_KEY || ''
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || ''
const CONTRACT_ADDRESS = '0x0Eb5E44Da15d0D0ae51B5E2d24f5489FDf0EC7B0'

const MemeNFTAbi = parseAbi([
  'function mintMeme(string memory tokenURI, address to) public returns (uint256)',
])

// Setup blockchain clients
const account = PRIVATE_KEY
  ? privateKeyToAccount(PRIVATE_KEY as `0x${string}`)
  : null
const publicClient = createPublicClient({
  chain: soneium,
  transport: http(RPC_URL),
})

const walletClient = account
  ? createWalletClient({
      account,
      chain: soneium,
      transport: http(RPC_URL),
    })
  : null

export async function POST(req: Request) {
  try {
    const { prompt, userAddress } = await req.json()

    if (!prompt || !userAddress) {
      return NextResponse.json(
        { message: 'Missing required parameters: prompt and userAddress' },
        { status: 400 },
      )
    }

    // Create a list of all template IDs with their names, lines, and example for the LLM
    const templatesList = MEME_TEMPLATES.map((template) => {
      const exampleText = template.example?.text || []
      return `{id: ${template.id}, name: ${template.name}, lines: ${
        template.lines || 2
      }, example: ${JSON.stringify(exampleText)}}`
    })

    let generatedMemeUrl: string | null = null

    const { text } = await generateText({
      model: google('models/gemini-2.0-flash-lite'),
      temperature: 1,
      maxSteps: 5,
      tools: {
        generateMeme: tool({
          description: 'Generate a meme based on user prompt',
          parameters: z.object({
            templateId: z.string().describe('ID of the meme template'),
            textLines: z
              .array(z.string())
              .describe(
                'Array of text lines for the meme, matching the template line requirements',
              ),
          }),
          execute: async ({ templateId, textLines }) => {
            // Verify that the template exists
            const template = MEME_TEMPLATES.find((t) => t.id === templateId)

            // If template doesn't exist, use a default template
            if (!template) {
              console.log(
                `Template ID "${templateId}" not found. Using a random template as fallback.`,
              )
              // random template
              const randomTemplate =
                MEME_TEMPLATES[
                  Math.floor(Math.random() * MEME_TEMPLATES.length)
                ]
              templateId = randomTemplate.id

              // Adjust textLines length to match the template if needed
              const requiredLines = randomTemplate.lines || 2
              if (textLines.length !== requiredLines) {
                // Fill with empty strings if not enough lines
                while (textLines.length < requiredLines) {
                  textLines.push('')
                }
                // Trim if too many lines
                if (textLines.length > requiredLines) {
                  textLines = textLines.slice(0, requiredLines)
                }
              }
            } else {
              // Adjust textLines to match the template's required number of lines
              const requiredLines = template.lines || 2
              if (textLines.length !== requiredLines) {
                console.log(
                  `Adjusting text lines from ${textLines.length} to ${requiredLines} lines`,
                )
                // Fill with empty strings if not enough lines
                while (textLines.length < requiredLines) {
                  textLines.push('')
                }
                // Trim if too many lines
                if (textLines.length > requiredLines) {
                  textLines = textLines.slice(0, requiredLines)
                }
              }
            }

            // Generate meme URL with all text lines
            const memeUrl = generateMemeUrl(templateId, textLines)

            console.log(`Generated meme URL: ${memeUrl}`)
            generatedMemeUrl = memeUrl
            return { memeUrl, templateId, textLines }
          },
        }),

        mintMemeNFT: tool({
          description: 'Mint a generated meme as an NFT',
          parameters: z.object({
            memeUrl: z.string().describe('URL of the generated meme'),
            toAddress: z.string().describe('Address to mint the NFT to'),
          }),
          execute: async ({ memeUrl, toAddress }) => {
            console.log(
              `Minting NFT with URL: ${memeUrl} to address: ${toAddress}`,
            )

            // check if the memeUrl is valid
            // if it is a memeGen url, check if it is valid
            if (memeUrl.startsWith(MEMEGEN_API_BASE)) {
              const response = await fetch(memeUrl)
              if (!response.ok) {
                throw new Error('Invalid meme URL, please try again.')
              }
            } else {
              throw new Error('Invalid meme URL, please try again.')
            }

            if (!walletClient) {
              throw new Error(
                'Wallet client not configured. Missing PRIVATE_KEY.',
              )
            }

            try {
              // Call the mintMeme function on the smart contract
              const hash = await walletClient.writeContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: MemeNFTAbi,
                functionName: 'mintMeme',
                args: [memeUrl, toAddress as `0x${string}`],
              })

              console.log(`Transaction hash: ${hash}`)

              // Wait for transaction confirmation
              const receipt = await publicClient.waitForTransactionReceipt({
                hash,
              })
              console.log(
                `Transaction confirmed in block ${receipt.blockNumber}`,
              )

              return {
                success: true,
                transactionHash: hash,
                blockNumber:
                  Number(receipt.blockNumber) || String(receipt.blockNumber),
                memeUrl,
              }
            } catch (error) {
              console.error('Error minting NFT:', error)
              throw new Error(`Failed to mint NFT: ${(error as Error).message}`)
            }
          },
        }),
      },
      prompt: `Based on this prompt: "${prompt}", please generate a creative and funny meme. I'll help you select the most appropriate meme template and create text that fits well with both the template and the user's prompt.

Instructions:
1. Carefully analyze the user's prompt for specific emotions, situations, or cultural references.
2. Choose a meme template that best matches the theme, tone, and context of the prompt.
3. When selecting a template, use the "id" field from the template list as your templateId parameter.
4. Pay attention to the "lines" field which indicates how many text lines the template supports.
5. Study the "example" field to understand how the template is typically used - this contains sample text that works well with this template.
6. Avoid repeatedly using the same templates - diversity in template selection is important.
7. Create relevant and witty text lines for the meme that connects well with both the template's intended use and the user's request.
8. Provide exactly the right number of text lines for the chosen template.

Here are all available templates:
${templatesList}

After selecting a template, generate a meme with appropriate text lines (exactly matching the number of lines required by the template) that creates humor while staying relevant to the prompt. Then mint it as an NFT for user address: ${userAddress}.`,
      onStepFinish({ toolResults }) {
        console.log('Tool results:', toolResults)
        // Try to extract meme URL from tool results if not already captured
        if (!generatedMemeUrl && Array.isArray(toolResults)) {
          for (const result of toolResults) {
            // Check if this is a generateMeme result
            if (
              'toolName' in result &&
              result.toolName === 'generateMeme' &&
              'result' in result &&
              result.result &&
              typeof result.result === 'object' &&
              'memeUrl' in result.result
            ) {
              generatedMemeUrl = result.result.memeUrl as string
              break
            }
          }
        }
      },
    })

    return NextResponse.json({
      message: text,
      success: true,
      userPrompt: prompt,
      userAddress,
      memeUrl: generatedMemeUrl,
    })
  } catch (error) {
    console.error('NFT Minting error:', error)
    return NextResponse.json(
      { message: 'Error minting NFT', error: (error as Error).message },
      { status: 500 },
    )
  }
}
