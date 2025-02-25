import { config } from "dotenv";
import {
  RemoveLiquidity,
  RemoveLiquidityInput,
  RemoveLiquidityKind,
  ChainId,
  BalancerApi,
  Slippage,
} from "@balancer/sdk";
import {
  createWalletClient,
  http,
  Address,
  parseEther,
  publicActions,
  walletActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sonic } from "viem/chains";

// Load environment variables
config();

const RPC_URL: string = process.env.RPC_URL!;
const PRIVATE_KEY: string = process.env.PRIVATE_KEY!;

if (!RPC_URL || !PRIVATE_KEY) {
  throw new Error("Missing RPC_URL or PRIVATE_KEY in environment variables.");
}

// Initialize Viem client
const client = createWalletClient({
  chain: sonic,
  transport: http(RPC_URL),
})
  .extend(publicActions)
  .extend(walletActions);

// Create account from private key
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

// User-defined values
const chainId: ChainId = ChainId.SONIC;
const poolId: string =
  "0x374641076b68371e69d03c417dac3e5f236c32fa000000000000000000000006";
const bptAmountOut = parseEther("1"); // Amount of BPT to remove (adjust as needed)
const slippage = Slippage.fromPercentage("0.5"); // 0.5% slippage

const main = async () => {
  try {
    // Initialize Balancer API
    const balancerApi = new BalancerApi(
      "https://backend-v3.beets-ftm-node.com",
      chainId
    );
    const poolState = await balancerApi.pools.fetchPoolState(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state. Pool may not exist.");
    }

    console.log("Pool Information:");
    console.log(`Pool ID: ${poolId}`);
    console.log(
      `Pool Tokens: ${poolState.tokens.map((t) => t.address).join(", ")}`
    );

    // Check BPT balance before proceeding
    const bptBalance = await client.readContract({
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

    console.log(`Current BPT Balance: ${bptBalance.toString()}`);

    if (bptBalance < bptAmountOut) {
      throw new Error(
        `Insufficient BPT balance. Have: ${bptBalance.toString()}, Need: ${bptAmountOut.toString()}`
      );
    }

    // Construct RemoveLiquidityInput with required fields
    const removeLiquidityInput: RemoveLiquidityInput = {
      chainId,
      rpcUrl: RPC_URL,
      bptIn: {
        address: poolState.address,
        decimals: 18,
        rawAmount: parseEther("1"),
      },
      kind: RemoveLiquidityKind.Proportional,
    };

    // Query expected output tokens
    const removeLiquidity = new RemoveLiquidity();
    const queryOutput = await removeLiquidity.query(
      removeLiquidityInput,
      poolState
    );

    console.log(`Expected Tokens Out:`);
    queryOutput.amountsOut.forEach((amount) => {
      console.log(`- ${amount.token.address}: ${amount.amount.toString()}`);
    });

    // Build transaction call
    const call = removeLiquidity.buildCall({
      ...queryOutput,
      slippage,
      chainId,
      sender: account.address as Address,
      recipient: account.address as Address,
      toInternalBalance: false,
    });

    console.log(`Transaction to: ${call.to}`);
    console.log(`Transaction value: ${call.value}`);

    // Send transaction
    const txHash = await client.sendTransaction({
      account,
      data: call.callData,
      to: call.to,
      value: call.value ?? 0,
    });

    console.log(`Transaction Hash: ${txHash}`);

    // Add transaction receipt check
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === "success") {
      // Check new BPT balance
      const newBptBalance = await client.readContract({
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
      console.log(`Previous BPT Balance: ${bptBalance.toString()}`);
      console.log(`New BPT Balance: ${newBptBalance.toString()}`);
      console.log(`BPT Removed: ${(bptBalance - newBptBalance).toString()}`);
    } else {
      console.error("Transaction failed!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

main();
