import { config } from "dotenv";
import {
  AddLiquidityInput,
  AddLiquidityKind,
  AddLiquidity,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  PriceImpact,
  PERMIT2,
} from "@balancer/sdk";
import { 
  createWalletClient, 
  http, 
  parseEther, 
  Address,
  createPublicClient,
  publicActions,
  walletActions,
} from "viem";
import { sonic } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

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
}).extend(publicActions).extend(walletActions)

// Create account from private key
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

// User-defined values
const chainId: ChainId = ChainId.SONIC;
const poolId: string = "0x374641076b68371e69d03c417dac3e5f236c32fa000000000000000000000006";

// Reduced amounts - try with smaller amounts to test the functionality
const amountsIn: InputAmount[] = [
  {
    address: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38" as Address,
    decimals: 18,
    rawAmount: parseEther("10"), // 0.1 BAO instead of 1
  },
  {
    address: "0xe5da20f15420ad15de0fa650600afc998bbe3955" as Address,
    decimals: 18,
    rawAmount: parseEther("0"), // 0.1 stS instead of 1
  },
];

// Increased slippage for testing
const slippage: Slippage = Slippage.fromPercentage("0.5"); // 3% instead of 1%

const main = async () => {
  try {
    // Initialize Balancer API
    const balancerApi = new BalancerApi("https://backend-v3.beets-ftm-node.com", chainId);
    const poolState = await balancerApi.pools.fetchPoolState(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state. Pool may not exist.");
    }

    console.log("Pool Information:");
    console.log(`Pool ID: ${poolId}`);
    console.log(`Pool Tokens: ${poolState.tokens.map(t => t.address).join(', ')}`);
    
    // Ensure our tokens are in the pool
    const userTokenAddresses = amountsIn.map(input => input.address.toLowerCase());
    const poolTokenAddresses = poolState.tokens.map(token => token.address.toLowerCase());
    
    const allTokensInPool = userTokenAddresses.every(address => 
      poolTokenAddresses.includes(address));
    
    if (!allTokensInPool) {
      console.error("Not all tokens are in the pool! Check token addresses.");
      console.log("User tokens:", userTokenAddresses);
      console.log("Pool tokens:", poolTokenAddresses);
      return;
    }

    // Construct AddLiquidityInput
    const addLiquidityInput: AddLiquidityInput = {
      amountsIn,
      chainId,
      rpcUrl: RPC_URL,
      kind: AddLiquidityKind.Unbalanced, // Try with AllowPoolRebalancing if available
    };

    // Calculate price impact
    try {
      const priceImpact = await PriceImpact.addLiquidityUnbalanced(
        addLiquidityInput,
        poolState
      );
      console.log(`Price Impact: ${priceImpact.percentage.toFixed(4)}%`);
      
      // If price impact is very high, it might cause issues
      if (priceImpact.percentage > 5) {
        console.warn("Warning: High price impact detected. This might cause transaction to fail.");
      }
    } catch (error) {
      console.warn("Could not calculate price impact:", error);
    }

    // Query expected BPT output
    const addLiquidity = new AddLiquidity();
    const queryOutput = await addLiquidity.query(addLiquidityInput, poolState);

    console.log(`Expected BPT Out: ${queryOutput.bptOut.amount.toString()}`);
    console.log(`Protocol Version: ${queryOutput.protocolVersion}`);
    console.log(`Tokens In:`);
    queryOutput.amountsIn.forEach(amount => {
      console.log(`- ${amount.token.address}: ${amount.amount.toString()}`);
    });

    // Build transaction call without permit2
    const call = addLiquidity.buildCall({
      ...queryOutput,
      slippage,
      chainId,
      wethIsEth: true,
      sender: account.address as Address,
      recipient: account.address as Address,
      fromInternalBalance: false
    });

    console.log(`Min BPT Out: ${call.minBptOut.amount.toString()}`);
    console.log(`Transaction to: ${call.to}`);
    console.log(`Transaction value: ${call.value}`);

    // Approve tokens directly for the Vault
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
        args: [call.to, token.rawAmount]
      });
      console.log(`Approved token ${token.address}, hash: ${approveHash}`);
    }


    const txHash = await client.sendTransaction({
      account,
      data: call.callData,
      to: call.to,
      value: call.value ?? 0,
    });

    console.log(`Transaction Hash: ${txHash}`);

    const receipt = await client.waitForTransactionReceipt({ hash: txHash });
    
    if (receipt.status === "success") {
      const bptBalance = await client.readContract({
        address: poolState.address,
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
      console.log(`Pool Address: ${poolState.address}`);
    } else {
      console.error("Transaction failed!");
    }

  } catch (error) {
    console.error("Error:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      
      // Try to extract more information about BAL#103
      if (error.message.includes("BAL#103")) {
        console.error(`
        BAL#103 typically means one of:
        - Token ratio is outside allowed bounds
        - Pool limits exceeded
        - Incorrect tokens for this pool
        - Missing approvals for tokens
        - Pool is in a state that does not allow joins
        `);
      }
    }
  }
};

main();