import {
  RemoveLiquidityInput,
  RemoveLiquidityKind,
  RemoveLiquidity,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  Address,
} from "@balancer/sdk";
import { createWalletClient, http, publicActions, walletActions } from "viem";
import { sonic } from "viem/chains";
import { checkSingleTokenBalance } from '../../../utils/balanceCheck';

export async function getProportionalRemoveLiquidityTransaction(
  bptIn: InputAmount,
  poolId: string,
  slippageStr: string,
  userAddress: Address
) {
  try {
    const chainId = ChainId.SONIC;
    const RPC_URL = process.env.RPC_URL!;

    const client = createWalletClient({
      chain: sonic,
      transport: http(RPC_URL),
    }).extend(walletActions).extend(publicActions);

    // Check BPT balance
    await checkSingleTokenBalance(client, userAddress, bptIn);

    const balancerApi = new BalancerApi("https://backend-v3.beets-ftm-node.com", chainId);
    const poolState = await balancerApi.pools.fetchPoolState(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state");
    }

    const slippage = Slippage.fromPercentage(`${parseFloat(slippageStr)}`);

    const removeLiquidityInput: RemoveLiquidityInput = {
      bptIn,
      chainId,
      rpcUrl: RPC_URL,
      kind: RemoveLiquidityKind.Proportional,
    };

    const removeLiquidity = new RemoveLiquidity();
    const queryOutput = await removeLiquidity.query(removeLiquidityInput, poolState);

    return {
      expectedAmountsOut: queryOutput.amountsOut.map(amount => ({
        address: amount.token.address,
        amount: amount.amount.toString()
      })),
      poolAddress: poolState.address,
      priceImpact: 0,
      permitData: {
        queryOutput,
        slippage,
      }
    };
  } catch (error) {
    throw error;
  }
}
