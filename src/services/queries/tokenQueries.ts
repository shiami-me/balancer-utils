import { BalancerApi, ChainId } from "@balancer/sdk";

const tokenBySymbolQuery = `
    query GetTokenBySymbol($chains: [GqlChain!]) {
        tokenGetTokens(chains: $chains) {
            address
            chain
            name
            symbol
            underlyingTokenAddress
            isErc4626
            decimals
        }
    }
`;

/**
 * Get token information by symbol or name
 * @param symbol Token symbol or name to search for
 * @returns Token information or undefined if not found
 */
export const getTokenBySymbol = async (symbol: string) => {
  const balancerApi = new BalancerApi(
    "https://backend-v3.beets-ftm-node.com",
    ChainId.SONIC
  );
  
  const {
    data: { tokenGetTokens },
  } = await balancerApi.balancerApiClient.fetch({
    query: tokenBySymbolQuery,
    variables: {
      chains: ["SONIC"],
    },
  });
  
  return (
    tokenGetTokens.find((token: any) => token.symbol === symbol) ||
    tokenGetTokens.find((token: any) => token.name === symbol)
  );
};

/**
 * Get token information by address
 * @param address Token address to search for
 * @returns Token information or undefined if not found
 */
export const getTokenByAddress = async (address: string) => {
  const balancerApi = new BalancerApi(
    "https://backend-v3.beets-ftm-node.com",
    ChainId.SONIC
  );
  
  const {
    data: { tokenGetTokens },
  } = await balancerApi.balancerApiClient.fetch({
    query: tokenBySymbolQuery,
    variables: {
      chains: ["SONIC"],
    },
  });
  
  return tokenGetTokens.find((token: any) => token.address.toLowerCase() === address.toLowerCase());
};
