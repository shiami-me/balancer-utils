import { config } from "dotenv";
import {
  AddLiquidityKind,
  AddLiquidity,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  PERMIT2,
  PriceImpact,
  RemoveLiquidityInput,
  RemoveLiquidityKind,
  RemoveLiquidity,
  PermitHelper,
} from "@balancer/sdk";
import {
  createWalletClient,
  http,
  parseUnits,
  Address,
  createPublicClient,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sonic } from "viem/chains";

config();

const RPC_URL: string = process.env.RPC_URL!;
const PRIVATE_KEY: string = process.env.PRIVATE_KEY!;

if (!RPC_URL || !PRIVATE_KEY) {
  throw new Error("Missing RPC_URL or PRIVATE_KEY in environment variables.");
}

const client = createWalletClient({
  chain: sonic,
  transport: http(RPC_URL),
}).extend(publicActions);

const publicClient = createPublicClient({
  chain: sonic,
  transport: http(RPC_URL),
});

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

// User-defined values
const chainId: ChainId = ChainId.SONIC;
const poolId: string = "0xd5ab187442998f1a62ea58133a03050691a0c280";
const amountsOut: InputAmount[] = [
  {
    address: "0xD31E89Ffb929b38bA60D1c7dBeB68c7712EAAb0a" as Address,
    decimals: 18,
    rawAmount: BigInt(40000000000),
  },
];
const slippage: Slippage = Slippage.fromPercentage("3");

const main = async () => {
  try {
    const balancerApi = new BalancerApi(
      "https://backend-v3.beets-ftm-node.com",
      chainId
    );
    const poolState = await balancerApi.pools.fetchPoolState(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state");
    }
    const bptIn = {
      address: poolState.address as Address,
      decimals: 18,
      rawAmount: BigInt(10000000),
    
    }
    const removeLiquidityInput: RemoveLiquidityInput = {
      bptIn,
      tokenOut: "0xD31E89Ffb929b38bA60D1c7dBeB68c7712EAAb0a" as Address,
      chainId,
      rpcUrl: RPC_URL,
      kind: RemoveLiquidityKind.SingleTokenExactIn,
    };

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


    try {
      const priceImpact = await PriceImpact.removeLiquidity(
        removeLiquidityInput,
        poolState
      );
      console.log(`Price Impact: ${priceImpact.percentage.toFixed(4)}%`);

      // If price impact is very high, it might cause issues
      if (priceImpact.percentage > 5) {
        console.warn(
          "Warning: High price impact detected. This might cause transaction to fail."
        );
      }
    } catch (error) {
      console.warn("Could not calculate price impact:", error);
    }


    console.log('\nWith slippage applied:');
    console.log(`Max BPT In: ${call.maxBptIn.amount}`);
    console.table({
      tokensOut: call.minAmountsOut.map((a) => a.token.address),
      minAmountsOut: call.minAmountsOut.map((a) => a.amount),
    });

    const txHash = await client.sendTransaction({
      account,
      data: call.callData,
      to: call.to,
      value: call.value ?? 0,
    });

    console.log(`Transaction Hash: ${txHash}`);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    if (receipt.status === "success") {
      const bptBalance = await publicClient.readContract({
        address: poolState.address,
        abi: [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "balanceOf",
        args: [account.address],
      });

      console.log(`\nTransaction Successful!`);
      console.log(`BPT Balance: ${bptBalance.toString()}`);
      console.log(`Pool Address: ${poolState.address}`);
    } else {
      console.error("Transaction failed!");
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

main().then(() => process.exit(0));
