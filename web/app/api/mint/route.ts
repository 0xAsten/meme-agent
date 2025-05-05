import { generateText, tool } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { soneium } from 'wagmi/chains'
import { generateMemeUrl } from '../../utils/genMemeUrl'
import templatesData from '../../lib/templates.json'

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

// Define a list of popular meme template IDs to use as fallback
const POPULAR_TEMPLATE_IDS = [
  'drake',
  'doge',
  'fry',
  'fine',
  'woman-cat',
  'distracted',
  'success',
  'rollsafe',
  'kermit',
  'spiderman',
  'buzz',
]

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

    // Create a list of all template IDs with their names for the LLM
    const templatesList = MEME_TEMPLATES.map(
      (template) =>
        `${template.id}: ${template.name}${
          template.keywords?.length ? ` (${template.keywords.join(', ')})` : ''
        }`,
    ).join('\n')

    let generatedMemeUrl: string | null = null

    const { text } = await generateText({
      model: google('models/gemini-2.0-flash-exp'),
      maxSteps: 5,
      tools: {
        listTemplates: tool({
          description: 'List available meme templates',
          parameters: z.object({
            searchQuery: z
              .string()
              .describe(
                'Optional search term to filter templates by name or keywords',
              )
              .optional(),
            limit: z
              .number()
              .describe('Optional limit for number of templates to return')
              .optional(),
          }),
          execute: async ({ searchQuery = '', limit = 10 }) => {
            // Filter templates based on search query
            let filteredTemplates = MEME_TEMPLATES

            if (searchQuery) {
              const query = searchQuery.toLowerCase()
              filteredTemplates = filteredTemplates.filter(
                (template) =>
                  template.name.toLowerCase().includes(query) ||
                  (template.keywords &&
                    template.keywords.some((keyword: string) =>
                      keyword.toLowerCase().includes(query),
                    )),
              )
            }

            // Check if we have any results after filtering
            if (filteredTemplates.length === 0) {
              console.log(
                `No templates found for query: "${searchQuery}". Using popular templates as fallback.`,
              )

              // If no matches found, suggest popular templates and provide better feedback
              const popularTemplates = MEME_TEMPLATES.filter((template) =>
                POPULAR_TEMPLATE_IDS.includes(template.id),
              )

              return {
                templates: popularTemplates.map((template) => ({
                  id: template.id,
                  name: template.name,
                  keywords: template.keywords || [],
                  lines: template.lines || 2,
                  overlays: template.overlays || 0,
                  styles: template.styles || [],
                  blank: template.blank,
                  example: template.example,
                })),
                totalCount: popularTemplates.length,
                message: `No templates found for "${searchQuery}". Here are some popular templates instead. You can also try a different search term or select directly from the full list of available templates.`,
              }
            }

            // Apply limit
            if (limit && limit > 0) {
              filteredTemplates = filteredTemplates.slice(0, limit)
            }

            return {
              templates: filteredTemplates.map((template) => ({
                id: template.id,
                name: template.name,
                keywords: template.keywords || [],
                lines: template.lines || 2, // Default to 2 lines if not specified
                overlays: template.overlays || 0,
                styles: template.styles || [],
                blank: template.blank,
                example: template.example,
              })),
              totalCount: filteredTemplates.length,
            }
          },
        }),

        generateMeme: tool({
          description: 'Generate a meme based on user prompt',
          parameters: z.object({
            templateId: z
              .string()
              .describe('ID of the meme template (e.g., "drake", "doge")'),
            topText: z
              .string()
              .describe('Text for the top of the meme')
              .optional(),
            bottomText: z
              .string()
              .describe('Text for the bottom of the meme')
              .optional(),
          }),
          execute: async ({ templateId, topText = '', bottomText = '' }) => {
            // Verify that the template exists
            const templateExists = MEME_TEMPLATES.some(
              (t) => t.id === templateId,
            )

            // If template doesn't exist, use a default template
            if (!templateExists) {
              console.log(
                `Template ID "${templateId}" not found. Using "drake" template as fallback.`,
              )
              templateId = 'drake'
            }

            // Generate meme URL
            const memeUrl = generateMemeUrl(templateId, topText, bottomText)
            console.log(`Generated meme URL: ${memeUrl}`)
            generatedMemeUrl = memeUrl
            return { memeUrl, templateId, topText, bottomText }
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
      prompt: `Based on this prompt: "${prompt}", please generate a creative and funny meme. First, review the available meme templates by using the listTemplates tool. Then select an appropriate template and create funny text for the top and bottom of the meme. Once the meme is generated, mint it as an NFT for user address: ${userAddress}.

Available templates:
${templatesList}

Instructions:
1. You can directly choose a template from the list above based on the user's prompt.
2. If you need more information about specific templates, use the listTemplates tool with a search query.
3. When selecting a template, consider the theme and context of the user's prompt.
4. For templates with 2 lines, provide both topText and bottomText. Some templates may have different requirements.
5. After generating the meme, proceed with minting it as an NFT.
`,
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
