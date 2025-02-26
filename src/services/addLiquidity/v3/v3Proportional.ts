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
  Address,
} from "@balancer/sdk";
import { createWalletClient, http, publicActions, walletActions, createPublicClient } from "viem";
import { sonic } from "viem/chains";
import { AddLiquidityResponse } from "../../../types";
import { privateKeyToAccount } from "viem/accounts";
import { checkSingleTokenBalance } from "../../../utils/balanceCheck";

export async function getProportionalAddLiquidityTransaction(
  referenceAmount: InputAmount,
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

  const approvals = queryOutput.amountsIn.map((amountIn) => ({
    token: amountIn.token.address,
    spender: PERMIT2[chainId],
    amount: amountIn.amount,
  }));

  return {
    approvals,
    transaction: {
      to: call.to,
      data: call.callData,
      value: call.value ?? 0,
    },
    expectedBptOut: queryOutput.bptOut.amount.toString(),
    minBptOut: call.minBptOut.amount.toString(),
  };
}
