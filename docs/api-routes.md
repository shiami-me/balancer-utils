# Balancer API Routes Documentation

## Add Liquidity Routes

### V3 Routes

#### 1. Add Boosted Unbalanced Liquidity (V3)
- **Endpoint**: `POST /api/add-liquidity/v3/boosted/unbalanced`
- **Body**:
  ```json
  {
    "amountsIn": [
      {
        "address": string,    // Token address
        "rawAmount": string,  // Raw amount in wei (string to handle large integers)
        "decimals": number    // Token decimals 
      }
    ],
    "poolId": string,
    "slippage": string,       // Percentage as string, e.g. "0.5"
    "userAddress": string     // User wallet address
  }
  ```

#### 2. Add Boosted Proportional Liquidity (V3)
- **Endpoint**: `POST /api/add-liquidity/v3/boosted/proportional`
- **Body**:
  ```json
  {
    "referenceAmount": {
      "address": string,     // Token address for reference
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals
    },
    "tokensIn": string[],    // Array of token addresses to use
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

#### 3. Add Unbalanced Liquidity (V3)
- **Endpoint**: `POST /api/add-liquidity/v3/unbalanced`
- **Body**:
  ```json
  {
    "amountsIn": [
      {
        "address": string,    // Token address
        "rawAmount": string,  // Raw amount in wei (string to handle large integers)
        "decimals": number    // Token decimals
      }
    ],
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

#### 4. Add Proportional Liquidity (V3)
- **Endpoint**: `POST /api/add-liquidity/v3/proportional`
- **Body**:
  ```json
  {
    "referenceAmount": {
      "address": string,     // Token address for reference
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals
    },
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5" 
    "userAddress": string    // User wallet address
  }
  ```

#### 5. Add Single Token Liquidity (V3)
- **Endpoint**: `POST /api/add-liquidity/v3/single-token`
- **Body**:
  ```json
  {
    "bptOut": {
      "address": string,     // BPT token address (pool address)
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals (typically 18)
    },
    "tokenIn": string,       // Token address to provide
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

### V2 Routes

#### 1. Add Unbalanced Liquidity (V2)
- **Endpoint**: `POST /api/add-liquidity/v2/unbalanced`
- **Body**:
  ```json
  {
    "amountsIn": [
      {
        "address": string,    // Token address
        "rawAmount": string,  // Raw amount in wei (string to handle large integers)
        "decimals": number    // Token decimals
      }
    ],
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

#### 2. Add Proportional Liquidity (V2)
- **Endpoint**: `POST /api/add-liquidity/v2/proportional`
- **Body**:
  ```json
  {
    "referenceAmount": {
      "address": string,     // Token address for reference
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals
    },
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

#### 3. Add Single Token Liquidity (V2)
- **Endpoint**: `POST /api/add-liquidity/v2/single-token`
- **Body**:
  ```json
  {
    "bptOut": {
      "address": string,     // BPT token address (pool address)
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals (typically 18)
    },
    "tokenIn": string,       // Token address to provide
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

## Remove Liquidity Routes

### V3 Routes

#### 1. Remove Single Token Exact Out (V3)
- **Endpoint**: `POST /api/remove-liquidity/v3/single-token-exact-out`
- **Body**:
  ```json
  {
    "amountOut": {
      "address": string,     // Token address to receive
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals
    },
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

#### 2. Remove Single Token Exact In (V3)
- **Endpoint**: `POST /api/remove-liquidity/v3/single-token-exact-in`
- **Body**:
  ```json
  {
    "bptIn": {
      "address": string,     // BPT token address (pool address)
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals (typically 18)
    },
    "tokenOut": string,      // Token address to receive
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

#### 3. Remove Proportional Liquidity (V3)
- **Endpoint**: `POST /api/remove-liquidity/v3/proportional`
- **Body**:
  ```json
  {
    "bptIn": {
      "address": string,     // BPT token address (pool address)
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals (typically 18)
    },
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

#### 4. Remove Boosted Proportional Liquidity (V3)
- **Endpoint**: `POST /api/remove-liquidity/v3/boosted/proportional`
- **Body**:
  ```json
  {
    "bptIn": {
      "address": string,     // BPT token address (pool address)
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals (typically 18)
    },
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

### V2 Routes

#### 1. Remove Single Token Exact Out (V2)
- **Endpoint**: `POST /api/remove-liquidity/v2/single-token-exact-out`
- **Body**:
  ```json
  {
    "amountOut": {
      "address": string,     // Token address to receive
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals
    },
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

#### 2. Remove Single Token Exact In (V2)
- **Endpoint**: `POST /api/remove-liquidity/v2/single-token-exact-in`
- **Body**:
  ```json
  {
    "bptIn": {
      "address": string,     // BPT token address (pool address)
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals (typically 18)
    },
    "tokenOut": string,      // Token address to receive
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

#### 3. Remove Proportional Liquidity (V2)
- **Endpoint**: `POST /api/remove-liquidity/v2/proportional`
- **Body**:
  ```json
  {
    "bptIn": {
      "address": string,     // BPT token address (pool address)
      "rawAmount": string,   // Raw amount in wei (string to handle large integers)
      "decimals": number     // Token decimals (typically 18)
    },
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

#### 4. Remove Unbalanced Liquidity (V2)
- **Endpoint**: `POST /api/remove-liquidity/v2/unbalanced`
- **Body**:
  ```json
  {
    "amountsOut": [
      {
        "address": string,    // Token address
        "rawAmount": string,  // Raw amount in wei (string to handle large integers)
        "decimals": number    // Token decimals
      }
    ],
    "poolId": string,
    "slippage": string,      // Percentage as string, e.g. "0.5"
    "userAddress": string    // User wallet address
  }
  ```

## Swap Routes

#### Swap Tokens
- **Endpoint**: `POST /api/swap`
- **Body**:
  ```json
  {
    "tokenIn": string,       // Can be token symbol, name, or address
    "tokenOut": string,      // Can be token symbol, name, or address
    "poolId": string,        // (Optional) Specific pool to use for the swap
    "slippage": string,      // Percentage as string, e.g. "0.5", defaults to "0.5"
    "userAddress": string    // User wallet address
  }
  ```

- **Response**:
  ```json
  {
    "transaction": {
      "to": string,           // Contract address
      "data": string,         // Transaction data
      "value": string         // ETH value in wei (if applicable)
    },
    "approvals": [            // Tokens that need approval
      {
        "token": string,      // Token address
        "spender": string,    // Spender address (usually Permit2)
        "amount": string      // Amount to approve
      }
    ]
  }
  ```

## Query Routes

### Token Queries

#### 1. Get Token by Symbol
- **Endpoint**: `GET /api/queries/token/symbol/:symbol`
- **Parameters**:
  - `symbol` (path parameter): Token symbol or name

#### 2. Get Token by Address
- **Endpoint**: `GET /api/queries/token/address/:address`
- **Parameters**:
  - `address` (path parameter): Token contract address

### Pool Queries

#### 1. Get Pool Events for User
- **Endpoint**: `GET /api/queries/pool/events/:userAddress`
- **Parameters**:
  - `userAddress` (path parameter): User wallet address
  - `first` (query parameter, optional): Maximum number of events to return, default: 10
  - `skip` (query parameter, optional): Number of events to skip, default: 0

#### 2. Get Pool by ID
- **Endpoint**: `GET /api/queries/pool/:poolId`
- **Parameters**:
  - `poolId` (path parameter): Pool ID

#### 3. Get All Pools
- **Endpoint**: `GET /api/queries/pools`
- **Parameters(optional)**:
  - `userAddress` (query parameter): User wallet address
  - `first` (query parameter, optional): Maximum number of pools to return
  - `orderBy` (query parameter, optional): Sort field - options: "apr", "fees24h", "totalLiquidity", "volume24h", "totalShares", "userBalanceUsd", default: "apr"
  - `orderDirection` (query parameter, optional): Sort direction - options: "asc", "desc", default: "desc"
  - `skip` (query parameter, optional): Number of pools to skip, default: 0
  - `textSearch` (query parameter, optional): Text to search for in pool name/symbol, default: ""

## Staking Routes

#### 1. Stake SONIC
- **Endpoint**: `POST /api/stake/deposit`
- **Body**:
  ```json
  {
    "amount": string,       // Amount of SONIC to stake in wei (string to handle large integers)
    "userAddress": string   // User wallet address
  }
  ```

#### 2. Undelegate From Pool
- **Endpoint**: `POST /api/stake/undelegate`
- **Body**:
  ```json
  {
    "amountShares": string, // Amount of shares to undelegate in wei (string to handle large integers)
    "userAddress": string   // User wallet address
  }
  ```

#### 3. Withdraw
- **Endpoint**: `POST /api/stake/withdraw`
- **Body**:
  ```json
  {
    "withdrawId": string,   // ID of the withdrawal request (from undelegate)
  }
  ```

## Common Response Format

All endpoints return either:

### Success Response
```json
{
  // Transaction data specific to the operation
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

Status codes:
- `200`: Success
- `400`: Invalid request or insufficient balance
- `500`: Internal server error
