import { request, gql } from 'graphql-request'

// Define MemeNFT interface
export interface MemeNFT {
  id: string
  tokenId: string
  owner: string
  tokenURI: string
}

// Define GraphQL response type
export interface GraphQLResponse {
  memeNFTs: MemeNFT[]
}

// GraphQL query for fetching meme NFTs
export const GET_MEME_NFTS = gql`
  query GetMemeNFTs($first: Int!, $skip: Int) {
    memeNFTs(
      first: $first
      skip: $skip
      orderBy: tokenId
      orderDirection: desc
    ) {
      id
      tokenId
      owner
      tokenURI
    }
  }
`

// The Graph API endpoint from environment variable
const GRAPH_API_URL =
  process.env.NEXT_PUBLIC_GRAPH_API_URL ||
  'https://api.studio.thegraph.com/query/61864/soneium-meme-agent/version/latest'

// Authorization token for The Graph API (if required)
const GRAPH_API_TOKEN = process.env.NEXT_PUBLIC_GRAPH_API_TOKEN || ''

// Headers for Graph API requests
const headers: Record<string, string> = GRAPH_API_TOKEN
  ? { Authorization: `Bearer ${GRAPH_API_TOKEN}` }
  : {}

// Function to fetch meme NFTs with pagination support
export async function fetchMemeNFTs(
  limit: number = 20,
  skip: number = 0,
): Promise<MemeNFT[]> {
  try {
    const data = await request<GraphQLResponse>(
      GRAPH_API_URL,
      GET_MEME_NFTS,
      {
        first: limit,
        skip: skip,
      },
      headers,
    )

    return data.memeNFTs
  } catch (error) {
    console.error('Error fetching meme NFTs:', error)
    throw error
  }
}
