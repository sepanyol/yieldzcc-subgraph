import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  afterAll,
  assert,
  beforeAll,
  clearStore,
  describe,
  log,
  test
} from "matchstick-as/assembly/index"
import { handleCreated } from "../src/staking-factory"
import { createCreatedEvent } from "./staking-factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let deployer = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let owner = Address.fromString("0x0000000000000000000000000000000000000001")
    let protocol = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let paid = BigInt.fromI32(234)
    let newCreatedEvent = createCreatedEvent(deployer, owner, protocol, paid)
    handleCreated(newCreatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("Created created and stored", () => {
    assert.entityCount("Created", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "Created",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "deployer",
      "0x0000000000000000000000000000000000000001",
      'invalid deployer field'
    )
    assert.fieldEquals(
      "Created",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "owner",
      "0x0000000000000000000000000000000000000001",
      'invalid owner field'
    )
    assert.fieldEquals(
      "Created",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "protocol",
      "0x0000000000000000000000000000000000000001",
      'invalid protocol field'
    )
    assert.fieldEquals(
      "Created",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "paid",
      "234",
      'invalid paid field'
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
