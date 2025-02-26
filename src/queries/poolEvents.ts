import { BalancerApi, ChainId } from "@balancer/sdk";

const query = `
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

export const getTokenBySymbol = async (
  first: Number,
  skip: Number,
  user: string
) => {
  const balancerApi = new BalancerApi(
    "https://backend-v3.beets-ftm-node.com",
    ChainId.SONIC
  );
  const {
    data: { poolEvents },
  } = await balancerApi.balancerApiClient.fetch({
    query,
    variables: {
      first,
      skip,
      user,
      chains: ["SONIC"],
    },
  });
  return poolEvents;
};
