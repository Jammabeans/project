import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, setPools } from "../store";
import { useQuery } from "urql";

const TOP_POOLS_QUERY = `
  query TopPools {
    pools(
      first: 20,
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

const MostLiquidPools: React.FC = () => {
  const dispatch = useDispatch();
  const [result] = useQuery({
    query: TOP_POOLS_QUERY,
    variables: {},
    pause: false,
  });

  const { data, fetching, error: queryError } = result;

  // Cache pools in Redux after fetch
  useEffect(() => {
    if (data && data.pools) {
      dispatch(setPools(data.pools));
    }
  }, [data, dispatch]);

  // Debug: log the query result
  if (data) {
    // eslint-disable-next-line no-console
    console.log("Top pools result:", data);
  }

  return (
    <div
      style={{
        background: "#263238",
        border: "2px solid #00bcd4",
        borderRadius: 8,
        padding: "1.2rem 1.5rem",
        marginBottom: 24,
        color: "#fff",
        textAlign: "center",
        fontWeight: 700,
        fontSize: "1.1em",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        alignItems: "center",
        maxWidth: 420,
        margin: "0 auto"
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "1.2em", marginBottom: 8 }}>
        Top 20 Most Liquid Pools
      </div>
      {fetching && (
        <div style={{ color: "#aaa", fontWeight: 500, marginTop: 12 }}>
          Loading pools...
        </div>
      )}
      {queryError && (
        <div style={{ color: "#ff5252", fontWeight: 500, marginTop: 8 }}>
          {queryError.message}
        </div>
      )}
      {data && data.pools && data.pools.length === 0 && (
        <div style={{ color: "#aaa", fontWeight: 500, marginTop: 12 }}>
          No pools found.
        </div>
      )}
      {data && data.pools && data.pools.length > 0 && (
        <div style={{ width: "100%", marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: "#00bcd4" }}>Most Liquid Pools:</div>
          {data.pools.map((pool: any) => (
            <div
              key={pool.id}
              style={{
                background: "#181c24",
                border: "1.5px solid #00bcd4",
                borderRadius: 6,
                padding: "0.7em 1em",
                marginBottom: 8,
                cursor: "pointer",
                color: "#fff",
                textAlign: "left"
              }}
              // TODO: Add onClick to select pool
            >
              Pool: {pool.token0.symbol} / {pool.token1.symbol} @ {pool.feeTier}
              <div style={{ fontWeight: 400, fontSize: "0.95em", color: "#aaa" }}>
                Liquidity: {pool.liquidity}
              </div>
              <div style={{ fontWeight: 400, fontSize: "0.95em", color: "#aaa" }}>
                Pool ID: {pool.id}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ color: "#aaa", fontWeight: 400, fontSize: "0.95em", marginTop: 12 }}>
        (Showing top 20 by liquidity. Live from subgraph, cached in Redux.)
      </div>
    </div>
  );
};

export default MostLiquidPools;