import { newMockEvent } from "matchstick-as";
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts";
import { Created as CreatedEvent } from "../generated/Staking_Factory_Simple/StakingFactory";

export function createCreatedEvent(
  deployer: Address,
  owner: Address,
  protocol: Address,
  paid: BigInt
): CreatedEvent {
  let createdEvent = changetype<CreatedEvent>(newMockEvent());

  createdEvent.parameters = new Array();

  createdEvent.parameters.push(
    new ethereum.EventParam("deployer", ethereum.Value.fromAddress(deployer))
  );
  createdEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  );
  createdEvent.parameters.push(
    new ethereum.EventParam("protocol", ethereum.Value.fromAddress(protocol))
  );
  createdEvent.parameters.push(
    new ethereum.EventParam("paid", ethereum.Value.fromUnsignedBigInt(paid))
  );

  return createdEvent;
}
