import { config } from "dotenv";
import {
  AddLiquidityInput,
  AddLiquidityKind,
  AddLiquidityBoostedV3,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  Permit2Helper,
  PERMIT2,
  PriceImpact,
  AddLiquidityBoostedProportionalInput,
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
}).extend(publicActions);

const publicClient = createPublicClient({
  chain: sonic,
  transport: http(RPC_URL),
});
// Create account from private key
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

// User-defined values
const chainId: ChainId = ChainId.SONIC;
const poolId: string = "0xd5ab187442998f1a62ea58133a03050691a0c280";

// Reduced amounts - try with smaller amounts to test the functionality
const amountsIn: InputAmount[] = [
  {
    address: "0x541fd749419ca806a8bc7da8ac23d346f2df8b77" as Address,
    decimals: 18,
    rawAmount: BigInt(40000000000), // 0.1 DAI instead of 1
  }
];

const tokensIn: Address[] = ["0x541fd749419ca806a8bc7da8ac23d346f2df8b77", "0xcc0966d8418d412c599a6421b760a847eb169a8c" ]

// Increased slippage for testing
const slippage: Slippage = Slippage.fromPercentage("3"); // 3% instead of 1%

const main = async () => {
  try {
    const balancerApi = new BalancerApi(
      "https://backend-v3.beets-ftm-node.com",
      chainId
    );
    const poolState = await balancerApi.boostedPools.fetchPoolStateWithUnderlyings(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state");
    }
    console.log(poolState.tokens)
    // Approve the permit2 contract as spender of tokens
    for (const token of amountsIn) {
      const approveHash = await client.writeContract({
        account,
        address: token.address,
        abi: [{
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }],
        functionName: "approve",
        args: [PERMIT2[chainId], token.rawAmount]
      });
      console.log(`Approved token ${token.address}, hash: ${approveHash}`);
    }

    const addLiquidityInput: AddLiquidityBoostedProportionalInput= {
      referenceAmount: amountsIn[0],
      chainId,
      rpcUrl: RPC_URL,
      kind: AddLiquidityKind.Proportional,
      tokensIn
    };

    const addLiquidity = new AddLiquidityBoostedV3();
    const queryOutput = await addLiquidity.query(addLiquidityInput, poolState);

    console.log(`Expected BPT Out: ${queryOutput.bptOut.amount.toString()}`);

    const permit2 = await Permit2Helper.signAddLiquidityBoostedApproval({
      ...queryOutput,
      slippage,
      client: client.extend(publicActions),
      owner: account.address,
    });

    const call = addLiquidity.buildCallWithPermit2({ ...queryOutput, slippage }, permit2);

    console.log(`Min BPT Out: ${call.minBptOut.amount.toString()}`);

    const txHash = await client.sendTransaction({
      account,
      data: call.callData,
      to: call.to,
      value: call.value ?? 0,
    });

    console.log(`Transaction Hash: ${txHash}`);

    // Wait for transaction confirmation and check result
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`Transaction status: ${receipt.status}`);

    if (receipt.status === "success") {
      // Get BPT token address from pool state
      const bptAddress = poolState.address;
      
      // Check BPT balance
      const bptBalance = await publicClient.readContract({
        address: bptAddress,
        abi: [{
          inputs: [{ name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ type: "uint256" }],
          stateMutability: "view",
          type: "function"
        }],
        functionName: "balanceOf",
        args: [account.address]
      });

      console.log(`\nTransaction Successful!`);
      console.log(`BPT Balance: ${bptBalance.toString()}`);
      console.log(`Pool Address: ${bptAddress}`);
    } else {
      console.error("Transaction failed!");
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

main().then(() => process.exit(0));
