import { Address } from 'viem';

export interface TransactionData {
  to: Address;
  data: string;
  value: bigint;
}

export interface ApprovalData {
  token: Address;
  spender: Address;
  amount: bigint;
}

export interface TokenAmountData {
  address: Address;
  amount: string;
}

export interface AddLiquidityResponse {
  approvals?: ApprovalData[];
  transaction: TransactionData;
  expectedBptOut: string;
  minBptOut: string;
  tokens: TokenAmountData[];
  priceImpact?: string;
}

export interface RemoveLiquidityResponse {
  // Transaction data
  transaction: TransactionData;
  
  // BPT information (for single token exact out and unbalanced)
  bptIn?: string;
  maxBptIn?: string;
  
  // Output tokens information
  expectedAmountsOut?: TokenAmountData[];   // For proportional removals
  tokenOut?: Address;                        // For single token removals
  expectedAmountOut?: string;                // For single token exact in
  
  // Additional metadata
  poolAddress?: Address;                     // Pool contract address
  priceImpact?: string | number;             // Price impact as percentage
}

export interface SwapResponse {
  approvals?: ApprovalData[];
  transaction: TransactionData;
  expectedAmountOut: string;
  minAmountOut: string;
}
