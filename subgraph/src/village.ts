// src/mappings/village.ts
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  CharacterAdded,
  CharacterSold,
  VillageMetadataUpdated,
  VillageOwnershipTransferred,
} from "../generated/templates/Village/Village";
import { Village, Character } from "../generated/schema";

export function handleCharacterAdded(event: CharacterAdded): void {
  const villageAddr = event.params.village; // indexed address(this)
  let village = Village.load(villageAddr);

  if (village == null) {
    return;
  }

  // Create Character entity keyed by its contract address
  const charAddr = event.params.characterAddress;
  let character = Character.load(charAddr);

  if (character == null) {
    character = new Character(charAddr);
    character.characterAddress = charAddr;
    character.characterId = event.params.characterId;
    character.name = event.params.name;
    character.symbol = event.params.symbol;
    character.charMetadata = event.params.charMetadata;

    // Convert Address[] -> Bytes[]
    const parentsBytes = event.params.parents.map<Bytes>(
      (a: Address): Bytes => a as Bytes
    );
    character.parents = parentsBytes;

    character.village = village.id;

    // At creation, current owner is the current village owner
    character.currentOwner = village.owner;
    character.createdAt = event.params.timestamp;
    character.lastSoldAt = null; // Initialize as null
  } else {
    // If this ever re-emits, keep immutable-ish fields intact; no-op
  }

  // bump village counters + updatedAt
  village.charactersCount = village.charactersCount.plus(BigInt.fromI32(1));
  village.updatedAt = event.params.timestamp;

  character.save();
  village.save();
}

export function handleCharacterSold(event: CharacterSold): void {
  const charAddr = event.params.characterAddress;

  let character = Character.load(charAddr);
  if (character == null) {
    // Defensive: if a sale happens before we saw CharacterAdded (reorg / partial sync)
    character = new Character(charAddr);
    character.characterAddress = charAddr;
    character.characterId = event.params.characterId;
    character.name = "Unknown"; // Set default values
    character.symbol = "UNK";
    character.charMetadata = "";
    character.parents = [];
    // Set village to the event address (the Village contract)
    character.village = event.address;
    character.currentOwner = event.params.to;
    character.createdAt = event.params.timestamp;
  }

  character.currentOwner = event.params.to;
  character.lastSoldAt = event.params.timestamp;
  character.save();
}

export function handleVillageMetadataUpdated(
  event: VillageMetadataUpdated
): void {
  let village = Village.load(event.params.villageAddress);
  if (village == null) {
    return;
  }

  village.metadataURI = event.params.newMetadataURI;
  village.updatedAt = event.params.timestamp;
  village.save();
}

export function handleVillageOwnershipTransferred(
  event: VillageOwnershipTransferred
): void {
  let village = Village.load(event.params.villageAddress);
  if (village == null) {
    return;
  }

  village.owner = event.params.newOwner;
  village.updatedAt = event.params.timestamp;
  village.save();
}
