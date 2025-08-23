import { VillageCreated as VillageCreatedEvent } from "../generated/VillageFactory/VillageFactory";
import { Village } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import { Village as VillageTemplate } from "../generated/templates";

export function handleVillageCreated(event: VillageCreatedEvent): void {
  const villageAddr = event.params.villageAddress;

  // Use the village contract address as the stable entity ID
  let village = new Village(villageAddr);
  village.villageId = event.params.villageId; // BigInt
  village.creator = event.params.creator; // Bytes
  village.owner = event.params.creator; // initial owner == creator
  village.metadataURI = event.params.metadataURI; // String
  village.createdAt = event.params.timestamp; // BigInt
  village.updatedAt = event.params.timestamp; // BigInt
  village.charactersCount = BigInt.fromI32(0); // start at 0

  village.save();

  VillageTemplate.create(villageAddr);
}
