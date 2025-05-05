import { ByteArray, Bytes } from '@graphprotocol/graph-ts'
import {
  MemeMinted as MemeMintedEvent,
  Transfer as TransferEvent,
} from '../generated/MemeNFT/MemeNFT'
import { MemeNFT } from '../generated/schema'

export function handleMemeMinted(event: MemeMintedEvent): void {
  let entity = new MemeNFT(
    Bytes.fromByteArray(Bytes.fromBigInt(event.params.tokenId)),
  )

  entity.tokenId = event.params.tokenId
  entity.owner = event.params.owner
  entity.tokenURI = event.params.tokenURI

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = MemeNFT.load(
    Bytes.fromByteArray(Bytes.fromBigInt(event.params.tokenId)),
  )

  Bytes.fromI32
  Bytes.fromByteArray

  if (!entity) {
    return
  }

  entity.owner = event.params.to

  entity.save()
}
