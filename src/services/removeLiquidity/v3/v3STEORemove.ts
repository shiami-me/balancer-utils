import {
  RemoveLiquidityInput,
  RemoveLiquidityKind,
  RemoveLiquidity,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  Address,
  PermitHelper,
} from "@balancer/sdk";
import { createWalletClient, http, publicActions, walletActions } from "viem";
import { sonic } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { checkSingleTokenBalance } from '../../../utils/balanceCheck';

export async function getSTEORemoveLiquidityTransaction(
  amountOut: InputAmount,
  poolId: string,
  slippageStr: string,
  userAddress: Address
) {
  try {
    const chainId = ChainId.SONIC;
    const RPC_URL = process.env.RPC_URL!;
    const PRIVATE_KEY = process.env.PRIVATE_KEY!;

    const client = createWalletClient({
      chain: sonic,
      transport: http(RPC_URL),
    }).extend(walletActions).extend(publicActions);

    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

    const balancerApi = new BalancerApi("https://backend-v3.beets-ftm-node.com", chainId);
    const poolState = await balancerApi.pools.fetchPoolState(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state");
    }

    const slippage = Slippage.fromPercentage(`${parseFloat(slippageStr)}`);

    const removeLiquidityInput: RemoveLiquidityInput = {
      amountOut,
      chainId,
      rpcUrl: RPC_URL,
      kind: RemoveLiquidityKind.SingleTokenExactOut,
    };

    const removeLiquidity = new RemoveLiquidity();
    const queryOutput = await removeLiquidity.query(removeLiquidityInput, poolState);

    // Check BPT balance after we know how much is needed
    await checkSingleTokenBalance(client, userAddress, {
      address: poolState.address,
      rawAmount: queryOutput.bptIn.amount,
      decimals: 18, // BPT tokens always have 18 decimals
    });

    const permit2 = await PermitHelper.signRemoveLiquidityApproval({
      ...queryOutput,
      slippage,
      client,
      owner: account.address,
    });

    const call = removeLiquidity.buildCallWithPermit(
      { ...queryOutput, slippage },
      permit2
    );

    return {
      transaction: {
        to: call.to,
        data: call.callData,
        value: call.value ?? 0,
      },
      bptIn: queryOutput.bptIn.amount.toString(),
      maxBptIn: call.maxBptIn.amount.toString(),
      tokenOut: amountOut.address
    };
  } catch (error) {
    throw error;
  }
}
