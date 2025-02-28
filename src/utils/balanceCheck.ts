import { Address, PublicClient } from 'viem';
import { InputAmount } from '@balancer/sdk';

const balanceAbi = [{
  inputs: [{ name: "account", type: "address" }],
  name: "balanceOf",
  outputs: [{ type: "uint256" }],
  stateMutability: "view",
  type: "function"
}] as const;

export async function getSingleTokenBalance(
  client: PublicClient,
  userAddress: Address,
  token: InputAmount
): Promise<bigint> {
  return client.readContract({
    address: token.address,
    abi: balanceAbi,
    functionName: "balanceOf",
    args: [userAddress]
  });
}

export async function checkSingleTokenBalance(
  client: PublicClient,
  userAddress: Address,
  token: InputAmount
): Promise<void> {
  const balance = await getSingleTokenBalance(client, userAddress, token);

  if (balance < token.rawAmount) {
    throw new Error(`Insufficient balance for token ${token.address}. Required: ${token.rawAmount.toString()}, Have: ${balance.toString()}`);
  }
}

export async function checkMultipleTokenBalances(
  client: PublicClient,
  userAddress: Address,
  tokens: InputAmount[]
): Promise<void> {
  for (const token of tokens) {
    await checkSingleTokenBalance(client, userAddress, token);
  }
}

export async function checkNativeTokenBalance(
  client: PublicClient,
  userAddress: Address,
  amount: string
) {
  const balance = await client.getBalance({ address: userAddress });

  if (balance < BigInt(amount)) {
    throw new Error(
      `Insufficient SONIC balance. Required: ${amount}, Available: ${balance.toString()}`
    );
  }
}
