import { Address, PublicClient } from 'viem';
import { InputAmount } from '@balancer/sdk';

const balanceAbi = [{
  inputs: [{ name: "account", type: "address" }],
  name: "balanceOf",
  outputs: [{ type: "uint256" }],
  stateMutability: "view",
  type: "function"
}] as const;

export async function checkSingleTokenBalance(
  client: PublicClient,
  userAddress: Address,
  token: InputAmount
): Promise<void> {
  const balance = await client.readContract({
    address: token.address,
    abi: balanceAbi,
    functionName: "balanceOf",
    args: [userAddress]
  });

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
