import {
  AddLiquidityInput,
  AddLiquidityKind,
  AddLiquidity,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  PERMIT2,
  Address,
} from "@balancer/sdk";
import { createWalletClient, http, publicActions, walletActions } from "viem";
import { sonic } from "viem/chains";
import { AddLiquidityResponse } from "../../../types";
import { checkSingleTokenBalance } from "../../../utils/balanceCheck";

export async function getProportionalAddLiquidityTransaction(
  referenceAmount: InputAmount,
  poolId: string,
  slippageStr: string,
  userAddress: Address,
): Promise<AddLiquidityResponse> {
  const chainId = ChainId.SONIC;
  const RPC_URL = process.env.RPC_URL!;

  const client = createWalletClient({
    chain: sonic,
    transport: http(RPC_URL),
  }).extend(walletActions).extend(publicActions);

  // Check balance for reference token
  await checkSingleTokenBalance(client, userAddress, referenceAmount);

  const balancerApi = new BalancerApi(
    "https://backend-v3.beets-ftm-node.com",
    chainId
  );

  const poolState = await balancerApi.pools.fetchPoolState(poolId);
  if (!poolState) {
    throw new Error("Failed to fetch pool state");
  }

  const slippage = Slippage.fromPercentage(`${parseFloat(slippageStr)}`);

  const addLiquidityInput: AddLiquidityInput = {
    referenceAmount,
    chainId,
    rpcUrl: RPC_URL,
    kind: AddLiquidityKind.Proportional,
  };

  const addLiquidity = new AddLiquidity();
  const queryOutput = await addLiquidity.query(addLiquidityInput, poolState);

  const approvals = queryOutput.amountsIn.map((amountIn) => ({
    token: amountIn.token.address,
    spender: PERMIT2[chainId],
    amount: amountIn.amount,
  }));

  return {
    approvals,
    expectedBptOut: queryOutput.bptOut.amount.toString(),
    tokens: queryOutput.amountsIn.map((amount) => ({
      address: amount.token.address,
      amount: amount.amount.toString(),
    })),
    poolAddress: poolState.address,
    permitData: {
      queryOutput,
      slippage,
    }
  };
}
