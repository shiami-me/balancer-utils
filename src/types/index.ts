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

export interface AddLiquidityResponse {
  approvals?: ApprovalData[];
  transaction: TransactionData;
  expectedBptOut: string;
  minBptOut: string;
}

export interface RemoveLiquidityResponse {
  approvals?: ApprovalData[];
  transaction: TransactionData;
  expectedAmountsOut: string[];
}

export interface SwapResponse {
  approvals?: ApprovalData[];
  transaction: TransactionData;
  expectedAmountOut: string;
  minAmountOut: string;
}
