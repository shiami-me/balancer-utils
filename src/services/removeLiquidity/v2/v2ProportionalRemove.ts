import {
  RemoveLiquidityInput,
  RemoveLiquidityKind,
  RemoveLiquidity,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
} from "@balancer/sdk";
import { createPublicClient, http, Address } from "viem";
import { sonic } from "viem/chains";
import { checkSingleTokenBalance } from '../../../utils/balanceCheck';

const client = createPublicClient({
  chain: sonic,
  transport: http(process.env.RPC_URL),
});

export async function getProportionalV2RemoveLiquidityTransaction(
  bptIn: InputAmount,
  poolId: string,
  slippage: `${number}`,
  userAddress: Address
) {
  try {
    // Check BPT balance
    await checkSingleTokenBalance(client, userAddress, bptIn);

    const chainId = ChainId.SONIC;
    const balancerApi = new BalancerApi("https://backend-v3.beets-ftm-node.com", chainId);
    const poolState = await balancerApi.pools.fetchPoolState(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state");
    }

    const removeLiquidityInput: RemoveLiquidityInput = {
      bptIn,
      chainId,
      rpcUrl: process.env.RPC_URL!,
      kind: RemoveLiquidityKind.Proportional,
    };

    const removeLiquidity = new RemoveLiquidity();
    const queryOutput = await removeLiquidity.query(removeLiquidityInput, poolState);

    const call = removeLiquidity.buildCall({
      ...queryOutput,
      slippage: Slippage.fromPercentage(slippage),
      chainId,
      sender: userAddress,
      recipient: userAddress,
      toInternalBalance: false
    });

    return {
      call,
      expectedAmountsOut: queryOutput.amountsOut.map(amount => ({
        address: amount.token.address,
        amount: amount.amount.toString()
      })),
      poolAddress: poolState.address,
      approvals: [{
        token: bptIn.address,
        spender: poolState.address,
        amount: bptIn.rawAmount
      }]
    };
  } catch (error) {
    throw error;
  }
}
