import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import { VillageCreated } from "../generated/VillageFactory/VillageFactory"

export function createVillageCreatedEvent(
  villageId: BigInt,
  creator: Address,
  villageAddress: Address,
  metadataURI: string,
  timestamp: BigInt
): VillageCreated {
  let villageCreatedEvent = changetype<VillageCreated>(newMockEvent())

  villageCreatedEvent.parameters = new Array()

  villageCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "villageId",
      ethereum.Value.fromUnsignedBigInt(villageId)
    )
  )
  villageCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  villageCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "villageAddress",
      ethereum.Value.fromAddress(villageAddress)
    )
  )
  villageCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "metadataURI",
      ethereum.Value.fromString(metadataURI)
    )
  )
  villageCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return villageCreatedEvent
}
