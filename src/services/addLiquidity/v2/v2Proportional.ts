import {
  AddLiquidityInput,
  AddLiquidityKind,
  AddLiquidity,
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

export async function getProportionalV2AddLiquidityTransaction(
  referenceAmount: InputAmount,
  poolId: string,
  slippage: `${number}`,
  userAddress: Address
) {
  try {
    // Check balance of reference token
    await checkSingleTokenBalance(client, userAddress, referenceAmount);

    const chainId = ChainId.SONIC;
    const balancerApi = new BalancerApi("https://backend-v3.beets-ftm-node.com", chainId);
    const poolState = await balancerApi.pools.fetchPoolState(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state");
    }

    const addLiquidityInput: AddLiquidityInput = {
      referenceAmount,
      chainId,
      rpcUrl: process.env.RPC_URL!,
      kind: AddLiquidityKind.Proportional,
    };

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
