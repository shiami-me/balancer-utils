import { BalancerApi, ChainId } from "@balancer/sdk";

const query = `
    query GetTokenBySymbol($chains: [GqlChain!]) {
        tokenGetTokens(chains: $chains) {
            address
            chain
            name
            symbol
            underlyingTokenAddress
            isErc4626
        }
    }
`;

export const getTokenBySymbol = async (symbol: string) => {
  const balancerApi = new BalancerApi(
    "https://backend-v3.beets-ftm-node.com",
    ChainId.SONIC
  );
  const {
    data: { tokenGetTokens },
  } = await balancerApi.balancerApiClient.fetch({
    query,
    variables: {
      chains: ["SONIC"],
    },
  });
  return (
    tokenGetTokens.find((token: any) => token.symbol === symbol) ||
    tokenGetTokens.find((token: any) => token.name === symbol)
  );
};
