import { VillageCreated as VillageCreatedEvent } from "../generated/VillageFactory/VillageFactory"
import { VillageCreated } from "../generated/schema"

export function handleVillageCreated(event: VillageCreatedEvent): void {
  let entity = new VillageCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.villageId = event.params.villageId
  entity.creator = event.params.creator
  entity.villageAddress = event.params.villageAddress
  entity.metadataURI = event.params.metadataURI
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
