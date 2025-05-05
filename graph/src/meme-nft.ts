import { Bytes } from '@graphprotocol/graph-ts'
import {
  MemeMinted as MemeMintedEvent,
  Transfer as TransferEvent,
} from '../generated/MemeNFT/MemeNFT'
import { MemeNFT } from '../generated/schema'

export function handleMemeMinted(event: MemeMintedEvent): void {
  let entity = new MemeNFT(
    Bytes.fromHexString(event.params.tokenId.toHexString()),
  )

  entity.tokenId = event.params.tokenId
  entity.owner = event.params.owner
  entity.tokenURI = event.params.tokenURI

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = MemeNFT.load(
    Bytes.fromHexString(event.params.tokenId.toHexString()),
  )

  if (!entity) {
    return
  }

  entity.owner = event.params.to

  entity.save()
}
