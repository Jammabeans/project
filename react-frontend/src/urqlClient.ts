import { createClient, cacheExchange, fetchExchange } from "urql";

const API_KEY = process.env.REACT_APP_GRAPH_API_KEY;
export const UNISWAP_V4_SUBGRAPH_URL = `https://gateway.thegraph.com/api/b824a4dba870fc445b37d5ee1abf9a79
/subgraphs/id/DiYPVdygkfjDWhbxGSqAQxwBKmfKnkWQojqeM2rkLb3G`;

export const urqlClient = createClient({
  url: UNISWAP_V4_SUBGRAPH_URL,
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    return {
      headers: {
        // If The Graph requires an Authorization header, add it here
        // Authorization: `Bearer ${API_KEY}`,
      },
    };
  },
});