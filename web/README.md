## Setup Instructions

Follow these steps to set up the Meme Agent project locally:

### 1. Environment Setup

1. Rename `.env_exmaple` to `.env`:

   ```bash
   cp .env_exmaple .env
   ```

2. Configure your `.env` file with the following values:
   - `NEXT_PUBLIC_RPC_URL`: Your RPC URL for blockchain connection
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: The WalletConnect Project ID
   - `PRIVATE_KEY`: Your wallet private key for contract interactions
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google Generative AI API key for AI-powered meme generation
   - `NEXT_PUBLIC_GRAPH_URL`: The Graph API URL for querying NFT data

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

- `/app`: Next.js application code
- `/app/components`: React components
- `/app/lib`: Utility libraries
- `/app/api`: API endpoints
- `/contracts`: Smart contract code for NFT minting
- `/graph`: The Graph subgraph for indexing NFT data

## Technologies Used

- Next.js for frontend
- Google AI for natural language processing
- memegen.link API for meme generation
- WalletConnect and viem for blockchain interactions
- The Graph for indexed NFT data

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
