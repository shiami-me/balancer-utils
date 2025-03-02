import {
  AddLiquidityInput,
  AddLiquidityKind,
  AddLiquidity,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  Permit2Helper,
  PERMIT2,
  PriceImpact,
  Address,
} from "@balancer/sdk";
import { createWalletClient, http, publicActions, walletActions } from "viem";
import { sonic } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { checkSingleTokenBalance } from "../../../utils/balanceCheck";
import { AddLiquidityResponse } from "../../../types";

export async function getSingleTokenAddLiquidityTransaction(
  bptOut: InputAmount,
  tokenIn: Address,
  poolId: string,
  slippageStr: string,
  userAddress: Address,
): Promise<AddLiquidityResponse> {
  const chainId = ChainId.SONIC;
  const RPC_URL = process.env.RPC_URL!;
  const PRIVATE_KEY = process.env.PRIVATE_KEY!;

  const client = createWalletClient({
    chain: sonic,
    transport: http(RPC_URL),
  }).extend(walletActions).extend(publicActions);

  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

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
    bptOut,
    tokenIn,
    chainId,
    rpcUrl: RPC_URL,
    kind: AddLiquidityKind.SingleToken,
  };

  // Check price impact
  try {
    const priceImpact = await PriceImpact.addLiquiditySingleToken(
      addLiquidityInput,
      poolState
    );
    if (priceImpact.percentage > 5) {
      throw new Error(`High price impact detected: ${priceImpact.percentage.toFixed(2)}%`);
    }
  } catch (error) {
    console.warn("Price impact check failed:", error);
  }

  const addLiquidity = new AddLiquidity();
  const queryOutput = await addLiquidity.query(addLiquidityInput, poolState);

  const priceImpact = await PriceImpact.addLiquiditySingleToken(
    addLiquidityInput,
    poolState
  );

  if (priceImpact.percentage > 5) {
    throw new Error(
      `High price impact: ${priceImpact.percentage.toFixed(2)}%`
    );
  }

  // Check balance after we know how much we need
  await checkSingleTokenBalance(client, userAddress, {
    address: tokenIn,
    rawAmount: queryOutput.amountsIn[0].amount,
    decimals: queryOutput.amountsIn[0].token.decimals,
  });

  const permit2 = await Permit2Helper.signAddLiquidityApproval({
    ...queryOutput,
    slippage,
    client,
    owner: account.address,
  });

  const call = addLiquidity.buildCallWithPermit2(
    { ...queryOutput, slippage },
    permit2
  );

  const approvals = [{
    token: tokenIn,
    spender: PERMIT2[chainId],
    amount: queryOutput.amountsIn[0].amount,
  }];

  return {
    approvals,
    transaction: {
      to: call.to,
      data: call.callData,
      value: call.value ?? 0,
    },
    expectedBptOut: queryOutput.bptOut.amount.toString(),
    minBptOut: call.minBptOut.amount.toString(),
    tokens: queryOutput.amountsIn.map((amount) => ({
      address: amount.token.address,
      amount: amount.amount.toString(),
    })),
    priceImpact: priceImpact.percentage.toFixed(2),
  };
}
