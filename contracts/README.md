## Deployy and verify contract

```
forge script script/DeployMemeNFT.s.sol:DeployMemeNFT \
    --account deployer-account-name \
    --broadcast \
    --rpc-url $RPC_URL \
    --verify \
    --verifier blockscout \
    --verifier-url $BLOCKSCOUT_URL

MemeNFT deployed to: 0x0Eb5E44Da15d0D0ae51B5E2d24f5489FDf0EC7B0
```
