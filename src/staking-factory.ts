import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  StakingProtocol,
  StakingProtocolStats,
  Token,
} from "../generated/schema";
import { Created as CreatedEvent } from "../generated/Staking_Factory_Simple/StakingFactory";
import { StakingContract as StakingContractTemplate } from "../generated/templates";
import { StakingSimple } from "../generated/templates/StakingContract/StakingSimple";
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "./common/helpers/erc20";

export function handleNewProtocol(event: CreatedEvent): void {
  let protocolStats = StakingProtocolStats.load(
    event.params.protocol.toHexString()
  );
  if (protocolStats === null) {
    protocolStats = new StakingProtocolStats(
      event.params.protocol.toHexString()
    );
    protocolStats.claimed = BigInt.fromI32(0);
    protocolStats.rewarded = BigInt.fromI32(0);
    protocolStats.staked = BigInt.fromI32(0);
  }

  // fetch tokens
  const protocolContract = StakingSimple.bind(event.params.protocol);

  const stakingTokenAddress = protocolContract.stakingToken();
  let stakingToken = Token.load(stakingTokenAddress.toHexString());
  if (stakingToken === null) {
    stakingToken = new Token(stakingTokenAddress.toHexString());
    stakingToken.address = stakingTokenAddress;
    stakingToken.decimals = fetchTokenDecimals(stakingTokenAddress).toI64();
    stakingToken.name = fetchTokenName(stakingTokenAddress);
    stakingToken.symbol = fetchTokenSymbol(stakingTokenAddress);
    stakingToken.save();
  }

  const rewardTokenAddress = protocolContract.rewardToken();
  let rewardToken = Token.load(rewardTokenAddress.toHexString());
  if (rewardToken === null) {
    rewardToken = new Token(rewardTokenAddress.toHexString());
    rewardToken.address = rewardTokenAddress;
    rewardToken.decimals = fetchTokenDecimals(rewardTokenAddress).toI64();
    rewardToken.name = fetchTokenName(rewardTokenAddress);
    rewardToken.symbol = fetchTokenSymbol(rewardTokenAddress);
    rewardToken.save();
  }

  let protocol = StakingProtocol.load(event.params.protocol.toHexString());
  if (protocol === null) {
    protocol = new StakingProtocol(event.params.protocol.toHexString());
    protocol.address = event.params.protocol;
    protocol.deployer = event.params.deployer;
    protocol.owner = event.params.owner;

    // assign tokens
    protocol.stakingToken = stakingToken.id;
    protocol.rewardToken = rewardToken.id;

    // connect with stats
    protocolStats.protocol = protocol.id;

    if (
      event.address.equals(
        Address.fromString("0xc91661d9cEA9B8db82Ea3331C58282ECD745054e")
      )
    ) {
      protocol.type = "Simple";
    }

    if (
      event.address.equals(
        Address.fromString("0x58Eb3b718152f5d41eafe413605923A23A286D92")
      )
    ) {
      protocol.type = "TimeLock";
    }

    if (
      event.address.equals(
        Address.fromString("0xF6f4e7D85A348869DD055Bad98C476C3a1eaaAc5")
      )
    ) {
      protocol.type = "OverTimeReward";
    }

    if (
      event.address.equals(
        Address.fromString("0x36712Af1af9b3e5037eFCe322188B895f3c49219")
      )
    ) {
      protocol.type = "CustomReward";
    }

    if (
      event.address.equals(
        Address.fromString("0xc7269a040609680bEd6e9b3bddf0fa2fA530881c")
      )
    ) {
      protocol.type = "ActionFees";
    }
  }

  StakingContractTemplate.create(event.params.protocol);

  stakingToken.save();
  rewardToken.save();
  protocolStats.save();
  protocol.save();
}
