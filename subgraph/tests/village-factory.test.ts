import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { VillageCreated } from "../generated/schema"
import { VillageCreated as VillageCreatedEvent } from "../generated/VillageFactory/VillageFactory"
import { handleVillageCreated } from "../src/village-factory"
import { createVillageCreatedEvent } from "./village-factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let villageId = BigInt.fromI32(234)
    let creator = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let villageAddress = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let metadataURI = "Example string value"
    let timestamp = BigInt.fromI32(234)
    let newVillageCreatedEvent = createVillageCreatedEvent(
      villageId,
      creator,
      villageAddress,
      metadataURI,
      timestamp
    )
    handleVillageCreated(newVillageCreatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("VillageCreated created and stored", () => {
    assert.entityCount("VillageCreated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "VillageCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "villageId",
      "234"
    )
    assert.fieldEquals(
      "VillageCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "creator",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "VillageCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "villageAddress",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "VillageCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "metadataURI",
      "Example string value"
    )
    assert.fieldEquals(
      "VillageCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "timestamp",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
