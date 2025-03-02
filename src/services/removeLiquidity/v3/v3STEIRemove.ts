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
  PriceImpact,
} from "@balancer/sdk";
import { createWalletClient, http, publicActions, walletActions } from "viem";
import { sonic } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { checkSingleTokenBalance } from '../../../utils/balanceCheck';

export async function getSTEIRemoveLiquidityTransaction(
  bptIn: InputAmount,
  tokenOut: Address,
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

    // Check BPT balance first
    await checkSingleTokenBalance(client, userAddress, bptIn);

    const balancerApi = new BalancerApi("https://backend-v3.beets-ftm-node.com", chainId);
    const poolState = await balancerApi.pools.fetchPoolState(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state");
    }

    // Verify token is in pool
    const tokenInPool = poolState.tokens.some(
      token => token.address.toLowerCase() === tokenOut.toLowerCase()
    );
    
    if (!tokenInPool) {
      throw new Error("Token not found in pool");
    }

    const slippage = Slippage.fromPercentage(`${parseFloat(slippageStr)}`);

    const removeLiquidityInput: RemoveLiquidityInput = {
      bptIn,
      tokenOut,
      chainId,
      rpcUrl: RPC_URL,
      kind: RemoveLiquidityKind.SingleTokenExactIn,
    };
    const priceImpact = await PriceImpact.removeLiquidity(
      removeLiquidityInput,
      poolState
    );

    if (priceImpact.percentage > 5) {
      throw new Error(
        `High price impact: ${priceImpact.percentage.toFixed(2)}%`
      );
    }
    const removeLiquidity = new RemoveLiquidity();
    const queryOutput = await removeLiquidity.query(removeLiquidityInput, poolState);

    const permit = await PermitHelper.signRemoveLiquidityApproval({
      ...queryOutput,
      slippage,
      client,
      owner: account.address,
    });

    const call = removeLiquidity.buildCallWithPermit(
      { ...queryOutput, slippage },
      permit
    );

    return {
      transaction: {
        to: call.to,
        data: call.callData,
        value: call.value ?? 0,
      },
      expectedAmountOut: queryOutput.amountsOut.filter(amount => 
        amount.token.address.toLowerCase() === tokenOut.toLowerCase()
      )[0].amount.toString(),
      tokenOut,
      poolAddress: poolState.address,
      priceImpact: priceImpact.percentage.toFixed(2),
    };
  } catch (error) {
    throw error;
  }
}
