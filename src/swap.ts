import { config } from "dotenv";
import {
  SwapKind,
  Swap,
  Slippage,
  Permit2Helper,
  PERMIT2,
  BalancerApi,
  TokenAmount,
  Token,
  ChainId,
} from "@balancer/sdk";
import {
  createWalletClient,
  http,
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
const tokenInAddress = "0xd31e89ffb929b38ba60d1c7dbeb68c7712eaab0a" as Address;
const tokenOutAddress = "0xa28d4dbcc90c849e3249d642f356d85296a12954" as Address;

const main = async () => {
  try {
    // Create token instances
    const tokenIn = new Token(chainId, tokenInAddress, 18, "TokenIn");
    const tokenOut = new Token(chainId, tokenOutAddress, 18, "TokenOut");
    const swapKind = SwapKind.GivenIn;
    const swapAmount = TokenAmount.fromHumanAmount(tokenIn, "0.000001");
    const slippage = Slippage.fromPercentage("1");

    // Check token balance
    const balance = await publicClient.readContract({
      address: tokenInAddress,
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

    if (balance < swapAmount.amount) {
      throw new Error(
        `Insufficient balance. Have: ${balance.toString()}, Need: ${swapAmount.amount.toString()}`
      );
    }

    // Approve Permit2
    const approveHash = await client.writeContract({
      account,
      address: tokenInAddress,
      abi: [
        {
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          name: "approve",
          outputs: [{ type: "bool" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      functionName: "approve",
      args: [PERMIT2[chainId], swapAmount.amount],
    });
    console.log(`Approved token for Permit2, hash: ${approveHash}`);

    // Use API and SOR to fetch best paths
    const balancerApi = new BalancerApi(
      "https://backend-v3.beets-ftm-node.com",
      chainId
    );
    const paths = await balancerApi.sorSwapPaths.fetchSorSwapPaths({
      chainId,
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      swapKind,
      swapAmount,
    });

    const swap = new Swap({ chainId, paths, swapKind });
    const queryOutput = await swap.query(RPC_URL);

    console.log("\nSwap Details:");
    if (queryOutput.swapKind === SwapKind.GivenIn) {
      console.table([
        {
          Type: "Given Token In",
          Address: swap.inputAmount.token.address,
          Amount: swap.inputAmount.amount,
        },
      ]);
    } else {
      console.table([
        {
          Type: "Expected Amount In",
          Address: swap.outputAmount.token.address,
          Amount: swap.outputAmount.amount,
        },
      ]);
    }

    const permit2 = await Permit2Helper.signSwapApproval({
      queryOutput,
      slippage,
      client,
      owner: account.address,
    });

    const call = swap.buildCallWithPermit2({ queryOutput, slippage }, permit2);

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
      const newBalance = await publicClient.readContract({
        address: tokenOutAddress,
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
      console.log(`Token Out Balance: ${newBalance.toString()}`);
    } else {
      console.error("Transaction failed!");
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

main().then(() => process.exit(0));
