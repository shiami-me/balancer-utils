import {
  RemoveLiquidityInput,
  RemoveLiquidityKind,
  RemoveLiquidityBoostedV3,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  Address,
  PermitHelper,
  RemoveLiquidityBoostedProportionalInput,
} from "@balancer/sdk";
import { createWalletClient, http, publicActions, walletActions } from "viem";
import { sonic } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { checkSingleTokenBalance } from '../../../utils/balanceCheck';

export async function getBoostedProportionalRemoveLiquidityTransaction(
  bptIn: InputAmount,
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
    const poolState = await balancerApi.boostedPools.fetchPoolStateWithUnderlyings(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state");
    }

    const slippage = Slippage.fromPercentage(`${parseFloat(slippageStr)}`);

    const removeLiquidityInput: RemoveLiquidityBoostedProportionalInput = {
      bptIn,
      chainId,
      tokensOut: poolState.tokens.map(token => token.address),
      rpcUrl: RPC_URL,
      kind: RemoveLiquidityKind.Proportional,
    };

    const removeLiquidity = new RemoveLiquidityBoostedV3();
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
      expectedAmountsOut: queryOutput.amountsOut.map(amount => ({
        address: amount.token.address,
        amount: amount.amount.toString()
      })),
      poolAddress: poolState.address
    };
  } catch (error) {
    throw error;
  }
}
