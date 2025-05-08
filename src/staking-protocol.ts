import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  HistoricalStats,
  ProtocolAction,
  RewardTick,
  StakingProtocolStats,
  User,
} from "../generated/schema";
import {
  Claim as ClaimEvent,
  Deposit as DepositEvent,
  InjectRewards as InjectRewardsEvent,
  Restaked as RestakedEvent,
  StakingSimple,
  Withdraw as WithdrawEvent,
} from "../generated/templates/StakingContract/StakingSimple";

export function handleDeposit(event: DepositEvent): void {
  const protocolStats = getProtocolStats(event.address.toHexString());

  const user = getUser(event.params.staker, protocolStats.protocol);
  user.staked = user.staked.plus(event.params.amount);

  const stakingContract = StakingSimple.bind(event.address);
  protocolStats.staked = stakingContract.staked();

  const action = createNewAction(
    event.transaction.hash.concatI32(event.transactionLogIndex.toI32()),
    "Deposit",
    event.params.amount,
    stakingContract.stakingToken().toHexString(),
    user.id,
    event.block.timestamp,
    user.protocol
  );

  const history = new HistoricalStats(0);
  history.protocol = protocolStats.protocol;
  history.stakers = stakingContract.getStakersCount();
  history.staked = protocolStats.staked;

  user.save();
  action.save();
  history.save();
  protocolStats.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  const protocolStats = getProtocolStats(event.address.toHexString());

  const user = getUser(event.params.staker, protocolStats.protocol);
  user.staked = user.staked.minus(event.params.amount);

  const stakingContract = StakingSimple.bind(event.address);
  protocolStats.staked = stakingContract.staked();

  const action = createNewAction(
    event.transaction.hash.concatI32(event.transactionLogIndex.toI32()),
    "Withdraw",
    event.params.amount,
    stakingContract.stakingToken().toHexString(),
    user.id,
    event.block.timestamp,
    user.protocol
  );

  const history = createNewHistory(
    protocolStats.protocol,
    stakingContract.getStakersCount(),
    protocolStats.staked
  );

  user.save();
  action.save();
  history.save();
  protocolStats.save();
}

export function handleRestaked(event: RestakedEvent): void {
  const protocolStats = getProtocolStats(event.address.toHexString());

  const user = getUser(event.params.staker, protocolStats.protocol);
  user.staked = user.staked.plus(event.params.amount);

  const stakingContract = StakingSimple.bind(event.address);
  protocolStats.staked = stakingContract.staked();

  const action = createNewAction(
    event.transaction.hash.concatI32(event.transactionLogIndex.toI32()),
    "Restake",
    event.params.amount,
    stakingContract.stakingToken().toHexString(),
    user.id,
    event.block.timestamp,
    user.protocol
  );

  const history = createNewHistory(
    protocolStats.protocol,
    stakingContract.getStakersCount(),
    protocolStats.staked
  );

  user.save();
  action.save();
  history.save();
  protocolStats.save();
}

export function handleClaim(event: ClaimEvent): void {
  const protocolStats = getProtocolStats(event.address.toHexString());
  protocolStats.claimed = protocolStats.claimed.plus(event.params.amount);

  const user = getUser(event.params.staker, protocolStats.protocol);
  user.claimed = user.claimed.plus(event.params.amount);

  const stakingContract = StakingSimple.bind(event.address);
  const action = createNewAction(
    event.transaction.hash.concatI32(event.transactionLogIndex.toI32()),
    "Claim",
    event.params.amount,
    stakingContract.rewardToken().toHexString(),
    user.id,
    event.block.timestamp,
    user.protocol
  );

  const history = createNewHistory(
    protocolStats.protocol,
    stakingContract.getStakersCount(),
    protocolStats.staked
  );

  user.save();
  action.save();
  history.save();
  protocolStats.save();
}

export function handleInjectRewards(event: InjectRewardsEvent): void {
  const protocolStats = getProtocolStats(event.address.toHexString());
  protocolStats.rewarded = protocolStats.rewarded.plus(
    event.params.amountGiven
  );

  const user = getUser(event.params.actor, protocolStats.protocol);

  const stakingContract = StakingSimple.bind(event.address);
  const action = createNewAction(
    event.transaction.hash.concatI32(event.transactionLogIndex.toI32()),
    "Inject",
    event.params.amountGiven,
    stakingContract.rewardToken().toHexString(),
    user.id,
    event.block.timestamp,
    user.protocol
  );

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
  user.save();
  action.save();
  protocolStats.save();
}

function getProtocolStats(address: string): StakingProtocolStats {
  let protocolStats = StakingProtocolStats.load(address);
  if (protocolStats === null) {
    protocolStats = new StakingProtocolStats(address);
    protocolStats.staked = BigInt.fromI32(0);
    protocolStats.claimed = BigInt.fromI32(0);
    protocolStats.stakers = BigInt.fromI32(0);
    protocolStats.rewarded = BigInt.fromI32(0);
    protocolStats.protocol = address;
  }
  return protocolStats;
}

function getUser(address: Address, protocol: string): User {
  // get user if exists
  const key = address.concat(Address.fromString(protocol));
  let user = User.load(key);
  if (user === null) {
    user = new User(key);
    user.active = true;
    user.protocol = protocol;
    user.address = address;
    user.claimed = BigInt.fromI32(0);
    user.staked = BigInt.fromI32(0);
  }
  return user;
}

function createNewAction(
  id: Bytes,
  type: string,
  amount: BigInt,
  token: string,
  user: Bytes,
  created: BigInt,
  protocol: string
): ProtocolAction {
  const action = new ProtocolAction(id);
  action.type = type;
  action.amount = amount;
  action.token = token;
  action.user = user;
  action.created = created;
  action.protocol = protocol;
  return action;
}

function createNewHistory(
  protocol: string,
  stakers: BigInt,
  staked: BigInt
): HistoricalStats {
  const entry = new HistoricalStats(0);
  entry.protocol = protocol;
  entry.stakers = stakers;
  entry.staked = staked;
  return entry;
}
