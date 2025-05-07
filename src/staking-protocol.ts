import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { RewardTick, StakingProtocolStats } from "../generated/schema";
import {
  StakingSimple,
  Claim as ClaimEvent,
  Deposit as DepositEvent,
  InjectRewards as InjectRewardsEvent,
  Restaked as RestakedEvent,
  Withdraw as WithdrawEvent,
} from "../generated/templates/StakingContract/StakingSimple";

export function handleDeposit(event: DepositEvent): void {
  const staking = StakingSimple.bind(event.address);

  let protocolStats = StakingProtocolStats.load(event.address.toHexString());
  if (protocolStats === null) {
    protocolStats = new StakingProtocolStats(event.address.toHexString());
    protocolStats.staked = BigInt.fromI32(0);
  }

  protocolStats.staked = staking.staked();
  protocolStats.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  const staking = StakingSimple.bind(event.address);

  let protocolStats = StakingProtocolStats.load(event.address.toHexString());
  if (protocolStats === null) {
    protocolStats = new StakingProtocolStats(event.address.toHexString());
    protocolStats.staked = BigInt.fromI32(0);
  }

  protocolStats.staked = staking.staked();
  protocolStats.save();
}

export function handleRestaked(event: RestakedEvent): void {
  const staking = StakingSimple.bind(event.address);

  let protocolStats = StakingProtocolStats.load(event.address.toHexString());
  if (protocolStats === null) {
    protocolStats = new StakingProtocolStats(event.address.toHexString());
    protocolStats.staked = BigInt.fromI32(0);
  }

  protocolStats.staked = staking.staked();
  protocolStats.save();
}

export function handleClaim(event: ClaimEvent): void {
  let protocolStats = StakingProtocolStats.load(event.address.toHexString());
  if (protocolStats === null) {
    protocolStats = new StakingProtocolStats(event.address.toHexString());
    protocolStats.claimed = BigInt.fromI32(0);
  }
  protocolStats.claimed = protocolStats.claimed.plus(event.params.amount);
  protocolStats.save();
}

export function handleInjectRewards(event: InjectRewardsEvent): void {
  const staking = StakingSimple.bind(event.address);

  let protocolStats = StakingProtocolStats.load(event.address.toHexString());
  if (protocolStats === null) {
    protocolStats = new StakingProtocolStats(event.address.toHexString());
    protocolStats.rewarded = BigInt.fromI32(0);
  }
  protocolStats.rewarded = staking.rewarded(staking.rewardToken());
  protocolStats.staked = event.params.amountStaked;

  // add reward tick
  const tick = new RewardTick(event.block.timestamp.toI64());
  tick.address = event.address;
  tick.amount = event.params.amountGiven;
  tick.staked = event.params.amountStaked;
  tick.relative = tick.amount
    .toBigDecimal()
    .div(tick.staked.toBigDecimal())
    .times(BigDecimal.fromString("100"));
  tick.save();

  protocolStats.save();
}
