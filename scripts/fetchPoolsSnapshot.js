const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../react-frontend/.env') });

const API_KEY = process.env.REACT_APP_GRAPH_API_KEY;
const SUBGRAPH_URL = `https://gateway.thegraph.com/api/${API_KEY}/subgraphs/id/DiYPVdygkfjDWhbxGSqAQxwBKmfKnkWQojqeM2rkLb3G`;

const QUERY = `
  query Pools($first: Int!, $skip: Int!) {
    pools(
      first: $first,
      skip: $skip,
      orderBy: liquidity,
      orderDirection: desc
    ) {
      id
      feeTier
      liquidity
      token0 { id symbol }
      token1 { id symbol }
    }
  }
`;

async function fetchPoolsBatch(first, skip) {
  const res = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: QUERY,
      variables: { first, skip }
    }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL errors:', json.errors);
    process.exit(1);
  }
  return json.data.pools;
}

async function main() {
  const allPools = [];
  const batchSize = 1000;
  let skip = 0;
  while (true) {
    console.log(`Fetching pools ${skip} to ${skip + batchSize - 1}...`);
    const batch = await fetchPoolsBatch(batchSize, skip);
    allPools.push(...batch);
    if (batch.length < batchSize) break;
    skip += batchSize;
  }
  const outPath = path.join(__dirname, '../pool-snapshot.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify(allPools, null, 2)
  );
  console.log(`Saved ${allPools.length} pools to ${outPath}`);
}

main();