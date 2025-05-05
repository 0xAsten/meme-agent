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
  query GetMemeNFTs($first: Int!) {
    memeNFTs(first: $first, orderBy: tokenId, orderDirection: desc) {
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

// Function to fetch meme NFTs
export async function fetchMemeNFTs(limit: number = 100): Promise<MemeNFT[]> {
  try {
    const data = await request<GraphQLResponse>(GRAPH_API_URL, GET_MEME_NFTS, {
      first: limit,
    })

    return data.memeNFTs
  } catch (error) {
    console.error('Error fetching meme NFTs:', error)
    throw error
  }
}
