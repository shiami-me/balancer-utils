import {
  AddLiquidityInput,
  AddLiquidityKind,
  AddLiquidity,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  PriceImpact,
} from "@balancer/sdk";
import { createPublicClient, http, Address } from "viem";
import { sonic } from "viem/chains";
import { checkMultipleTokenBalances } from '../../../utils/balanceCheck';

const client = createPublicClient({
  chain: sonic,
  transport: http(process.env.RPC_URL),
});

export async function getUnbalancedV2AddLiquidityTransaction(
  amountsIn: InputAmount[],
  poolId: string,
  slippage: `${number}`,
  userAddress: Address
) {
  try {
    // Check balances first
    await checkMultipleTokenBalances(client, userAddress, amountsIn);

    const chainId = ChainId.SONIC;
    const balancerApi = new BalancerApi("https://backend-v3.beets-ftm-node.com", chainId);
    const poolState = await balancerApi.pools.fetchPoolState(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state");
    }

    // Verify tokens are in pool
    const userTokenAddresses = amountsIn.map(input => input.address.toLowerCase());
    const poolTokenAddresses = poolState.tokens.map(token => token.address.toLowerCase());
    
    const allTokensInPool = userTokenAddresses.every(address => 
      poolTokenAddresses.includes(address));
    
    if (!allTokensInPool) {
      throw new Error("Not all tokens are in the pool");
    }

    const addLiquidityInput: AddLiquidityInput = {
      amountsIn,
      chainId,
      rpcUrl: process.env.RPC_URL!,
      kind: AddLiquidityKind.Unbalanced,
    };

    // Check price impact
    const priceImpact = await PriceImpact.addLiquidityUnbalanced(
      addLiquidityInput,
      poolState
    );
    
    if (priceImpact.percentage > 5) {
      throw new Error(`High price impact: ${priceImpact.percentage.toFixed(2)}%`);
    }

    const addLiquidity = new AddLiquidity();
    const queryOutput = await addLiquidity.query(addLiquidityInput, poolState);

    const call = addLiquidity.buildCall({
      ...queryOutput,
      slippage: Slippage.fromPercentage(slippage),
      chainId,
      wethIsEth: true,
      sender: userAddress,
      recipient: userAddress,
      fromInternalBalance: false
    });

    return {
      call,
      priceImpact: priceImpact.percentage,
      expectedBptOut: queryOutput.bptOut.amount.toString(),
      poolAddress: poolState.address,
      tokens: queryOutput.amountsIn.map(amount => ({
        address: amount.token.address,
        amount: amount.amount.toString()
      })),
      approvals: queryOutput.amountsIn.map(amount => ({
        token: amount.token.address,
        spender: poolState.address,
        amount: amount.amount
      }))
    };
  } catch (error) {
    throw error;
  }
}
