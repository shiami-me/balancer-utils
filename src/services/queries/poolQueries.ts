import { BalancerApi, ChainId } from "@balancer/sdk";

const poolEventsQuery = `
    query PoolEvents($first: Int, $skip: Int, $user: String!, $chains: [GqlChain]) {
        poolEvents(first: $first, skip: $skip, where: { userAddress: $user, chainIn: $chains }) {
            chain,
            id,
            poolId,
            sender,
            timestamp,
            tx,
            type,
            valueUSD
        }
    }
`;

/**
 * Get pool events for a specific user
 * @param first Maximum number of events to return
 * @param skip Number of events to skip
 * @param user User address
 * @returns Array of pool events
 */
export const getUserPoolEvents = async (
  first: number,
  skip: number,
  user: string
) => {
  const balancerApi = new BalancerApi(
    "https://backend-v3.beets-ftm-node.com",
    ChainId.SONIC
  );

  const {
    data: { poolEvents },
  } = await balancerApi.balancerApiClient.fetch({
    query: poolEventsQuery,
    variables: {
      first,
      skip,
      user,
      chains: ["SONIC"],
    },
  });

  return poolEvents;
};

/**
 * Get pool information by ID
 * @param poolId The ID of the pool to query
 * @returns Pool information
 */
export const getPoolById = async (poolId: string, userAddress: string) => {
  const poolQuery = `
    query GetPool($id: String!, $chain: GqlChain, $userAddress: String) {
      poolGetPool(id: $id, chain: $chain, userAddress: $userAddress) {
        id
        address
        name
    		protocolVersion
    		type
    		categories
    		userBalance {
          totalBalanceUsd
          walletBalanceUsd
          stakedBalances {
            stakingType
            balanceUsd
          }
        }
    		dynamicData {
          aprItems {
            apr
            rewardTokenSymbol
            rewardTokenSymbol
            type
          }
          totalLiquidity
          totalShares
          totalSupply
          volume24h
          yieldCapture24h
          fees24h
        }
        poolTokens {
          address
          symbol
          weight
          decimals
          balanceUSD
          logoURI
          underlyingToken {
            address
            symbol
            decimals
            
          }
        }
      }
    }
  `;

  const balancerApi = new BalancerApi(
    "https://backend-v3.beets-ftm-node.com",
    ChainId.SONIC
  );

  const {
    data: { poolGetPool },
  } = await balancerApi.balancerApiClient.fetch({
    query: poolQuery,
    variables: {
      id: poolId,
      chain: "SONIC",
      userAddress: userAddress ? userAddress : undefined,
    },
  });

  return poolGetPool;
};

const poolsQuery = `
query GetPools($first: Int, $orderBy: GqlPoolOrderBy, $orderDirection: GqlPoolOrderDirection, $skip: Int, $textSearch: String, $userAddress: String) {
    poolGetPools(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      textSearch: $textSearch
      where: {chainIn: SONIC, userAddress: $userAddress}
    ) {
      id
      address
      chain
      name
      symbol
    	protocolVersion
    	type
      userBalance {
        totalBalanceUsd
      }
    	dynamicData {
        totalLiquidity,
        volume24h,
        yieldCapture24h
      }
      poolTokens {
        id
        address
        symbol
        decimals
        name
        logoURI
        underlyingToken {
          address
          symbol
          name
          decimals
        }
      }
    }
  }
`;

export const getPools = async (
  first: number | undefined,
  orderBy:
    | "apr"
    | "fees24h"
    | "totalLiquidity"
    | "volume24h"
    | "totalShares"
    | "userBalanceUsd"
    | undefined,
  orderDirection: "asc" | "desc" | undefined,
  skip: number | undefined,
  textSearch: string | undefined,
  userAddress: string | undefined
) => {
  const balancerApi = new BalancerApi(
    "https://backend-v3.beets-ftm-node.com",
    ChainId.SONIC
  );
  const {
    data: { poolGetPools },
  } = await balancerApi.balancerApiClient.fetch({
    query: poolsQuery,
    variables: {
      first,
      orderBy,
      orderDirection,
      skip,
      textSearch,
      userAddress,
    },
  });

  return poolGetPools;
};
