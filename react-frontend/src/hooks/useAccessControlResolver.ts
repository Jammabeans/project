import { useCallback, useState } from "react";
import { Contract } from "ethers";

const ZERO = "0x0000000000000000000000000000000000000000";

/**
 * Lightweight resolver that probes an AccessControl-like contract for known getter names.
 * Returns a map of discovered addresses plus an array of other addresses found from any address[] returns.
 *
 * Usage:
 *  const { addresses, others, resolve, loading, error } = useAccessControlResolver(provider, accessControlAddress);
 *  await resolve();
 *
 * This is intentionally defensive: it attempts many candidate view function names and swallows errors.
 */

type ResolvedMap = Record<string, string>;

const CANDIDATE_ADDRESS_GETTERS: Array<{ name: string; key: string }> = [
  // master control variants
  { name: "masterControl", key: "masterControl" },
  { name: "getMasterControl", key: "masterControl" },
  { name: "master_controller", key: "masterControl" },
  { name: "master", key: "masterControl" },
  { name: "master_addr", key: "masterControl" },
  { name: "masterControlAddress", key: "masterControl" },

  // pool / manager variants
  { name: "poolManager", key: "poolManager" },
  { name: "getPoolManager", key: "poolManager" },
  { name: "manager", key: "poolManager" },
  { name: "managerAddress", key: "poolManager" },

  // pool launch pad variants
  { name: "poolLaunchPad", key: "poolLaunchPad" },
  { name: "getPoolLaunchPad", key: "poolLaunchPad" },
  { name: "pool_launch_pad", key: "poolLaunchPad" },
  { name: "poolLaunchpad", key: "poolLaunchPad" },
  { name: "launchPad", key: "poolLaunchPad" },

  // create2 factory variants
  { name: "create2Factory", key: "create2Factory" },
  { name: "getCreate2Factory", key: "create2Factory" },
  { name: "factory", key: "create2Factory" },
  { name: "create2FactoryAddress", key: "create2Factory" },
  { name: "createFactory", key: "create2Factory" },

  // fee / revenue / collector variants
  { name: "feeCollector", key: "feeCollector" },
  { name: "getFeeCollector", key: "feeCollector" },
  { name: "feeCollectorAddress", key: "feeCollector" },

  // gas bank
  { name: "gasBank", key: "gasBank" },
  { name: "getGasBank", key: "gasBank" },
  { name: "gasBankAddress", key: "gasBank" },

  // degen / prize addresses
  { name: "degenPool", key: "degenPool" },
  { name: "degenPoolAddress", key: "degenPool" },
  { name: "prizeBox", key: "prizeBox" },
  { name: "prizeBoxAddress", key: "prizeBox" },

  // settings / share splitter / bonding / shaker / points / bids
  { name: "settings", key: "settings" },
  { name: "settingsAddress", key: "settings" },
  { name: "shareSplitter", key: "shareSplitter" },
  { name: "shareSplitterAddress", key: "shareSplitter" },
  { name: "bonding", key: "bonding" },
  { name: "bondingAddress", key: "bonding" },
  { name: "shaker", key: "shaker" },
  { name: "shakerAddress", key: "shaker" },
  { name: "pointsCommand", key: "pointsCommand" },
  { name: "pointsCommandAddress", key: "pointsCommand" },
  { name: "bidManager", key: "bidManager" },
  { name: "bidManagerAddress", key: "bidManager" },

  // access control registry
  { name: "accessControl", key: "accessControl" },
  { name: "getAccessControl", key: "accessControl" },
  { name: "access_control", key: "accessControl" },

  // other likely single-address getters used in registries
  { name: "poolFactory", key: "poolFactory" },
  { name: "admin", key: "admin" },
  { name: "governance", key: "governance" }
];

// Common ABI fragments for a single-address getter and an address array getter
const ADDRESS_GETTER_ABI = ["function dummy() view returns (address)"];
const ADDRESS_ARRAY_GETTER_ABI = ["function dummy() view returns (address[])"];

/**
 * Probes AccessControl for addresses using a provider.
 * Returns { addresses, others } where addresses is a map of known keys and others is a list of extra discovered addresses.
 */
export async function fetchAddressesFromAccessControl(
  provider: any,
  accessControlAddress: string
): Promise<{ addresses: ResolvedMap; others: string[] }> {
  const addresses: ResolvedMap = {};
  const others: string[] = [];

  if (!provider || !accessControlAddress) {
    return { addresses, others };
  }

  // Ensure contract exists at address
  try {
    const code = await provider.getCode(accessControlAddress);
    if (!code || code === "0x") {
      throw new Error("no-code-at-address");
    }
  } catch (err) {
    // no code or RPC error
    return { addresses, others };
  }

  // helper to try a call with a minimal ABI; we create a Contract wrapper per candidate
  async function tryAddressCall(fnName: string): Promise<string | null> {
    try {
      // Create a contract with a single (dummy) ABI but call by function fragment string
      // Use a minimal ABI that we override by calling the function selector by name.
      const c = new Contract(accessControlAddress, [`function ${fnName}() view returns (address)`], provider);
      const result = await c[fnName]();
      if (result && typeof result === "string" && result !== "0x0000000000000000000000000000000000000000") {
        return result;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async function tryAddressArrayCall(fnName: string): Promise<string[] | null> {
    try {
      const c = new Contract(accessControlAddress, [`function ${fnName}() view returns (address[])`], provider);
      const result: string[] = await c[fnName]();
      if (Array.isArray(result) && result.length) {
        return result.filter((a) => a && a !== "0x0000000000000000000000000000000000000000");
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // 1) Try common single-address getters
  for (const candidate of CANDIDATE_ADDRESS_GETTERS) {
    const res = await tryAddressCall(candidate.name);
    if (res) {
      // if key already set, push duplicate into others
      if (!addresses[candidate.key]) {
        addresses[candidate.key] = res;
      } else if (!others.includes(res)) {
        others.push(res);
      }
    }
  }

  // 2) Try some generic names that may return address[] of core addresses
  const arrayCandidates = [
    "getAllAddresses",
    "allAddresses",
    "getAddresses",
    "addresses",
    "members",
    "getMembers",
    "getRoleAddresses",
    "getAll",
    "registryAddresses",
    "listedAddresses",
    "getMembersByRole",
    "getAllContracts",
    "listAddresses",
    "all",
    "contracts",
    "registeredContracts",
    "list",
    "listAll"
  ];
  for (const name of arrayCandidates) {
    const arr = await tryAddressArrayCall(name);
    if (arr && arr.length) {
      for (const a of arr) {
        if (!Object.values(addresses).includes(a) && !others.includes(a)) others.push(a);
      }
    }
  }

  // 3) Attempt to read well-known registry getters that may exist in AccessControl implementations
  const fallbackCandidates: Array<{ fn: string; key?: string }> = [
    { fn: "getPoolLaunchPad", key: "poolLaunchPad" },
    { fn: "poolLaunchPad", key: "poolLaunchPad" },
    { fn: "getMasterControl", key: "masterControl" },
    { fn: "masterControl", key: "masterControl" },
    { fn: "create2Factory", key: "create2Factory" },
    { fn: "getCreate2Factory", key: "create2Factory" }
  ];

  for (const cnd of fallbackCandidates) {
    if (!cnd.key || !addresses[cnd.key]) {
      const r = await tryAddressCall(cnd.fn);
      if (r) {
        if (!cnd.key) {
          if (!others.includes(r)) others.push(r);
        } else {
          addresses[cnd.key] = r;
        }
      }
    }
  }

  // 4) As a last resort, attempt to call a variety of indexed getters like getAddress(uint256), addresses(uint256), get(uint256)
  // We'll try indices 0..49 and a set of candidate numeric accessor names.
  const NUMERIC_GETTERS = [
    "getAddress",
    "addresses",
    "getAddr",
    "get",
    "registry",
    "memberAt",
    "members",
    "addressAt",
    "at",
    "getAddressAt",
    "addrAt"
  ];
  for (const fn of NUMERIC_GETTERS) {
    for (let i = 0; i < 50; i++) {
      try {
        const c = new Contract(accessControlAddress, [`function ${fn}(uint256) view returns (address)`], provider as any);
        let r: string | null = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          r = (await (c as any)[fn](i)) ?? null;
        } catch {
          // index not present or function not present; try next index/function
          continue;
        }
        if (r && r !== ZERO) {
          if (!Object.values(addresses).includes(r) && !others.includes(r)) others.push(r);
        }
      } catch {
        // function not present or fatal; move to next candidate getter
        break;
      }
    }
  }

  // debug summary before returning
  try {
    // Log discovered values for quick debugging in dev console
    // eslint-disable-next-line no-console
    console.debug("fetchAddressesFromAccessControl: summary", { accessControlAddress, addresses, others });
  } catch (e) {
    // ignore
  }

  return { addresses, others };
}

/**
 * React hook wrapper around fetchAddressesFromAccessControl.
 * - provider: ethers provider (required for on-chain calls)
 * - accessControlAddress: address of the AccessControl contract to probe
 *
 * Returns: { addresses, others, loading, error, resolve }
 */
export function useAccessControlResolver(
  provider?: any,
  accessControlAddress?: string
) {
  const [addresses, setAddresses] = useState<ResolvedMap>({});
  const [others, setOthers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resolve = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!provider || !accessControlAddress) {
        setAddresses({});
        setOthers([]);
        setLoading(false);
        console.debug("ACR: missing provider or accessControlAddress", { provider: !!provider, accessControlAddress });
        return { addresses: {}, others: [] };
      }

      console.debug("ACR: resolving for", accessControlAddress);
      const res = await fetchAddressesFromAccessControl(provider, accessControlAddress);
      setAddresses(res.addresses);
      setOthers(res.others);
      console.debug("ACR: resolved", { accessControlAddress, addresses: res.addresses, others: res.others });
      setLoading(false);
      return res;
    } catch (err: any) {
      setError(err);
      setLoading(false);
      console.error("ACR: resolve error", err);
      return { addresses: {}, others: [] };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, accessControlAddress]);

  return {
    addresses,
    others,
    loading,
    error,
    resolve
  };
}

export default useAccessControlResolver;
// Ensure this file is treated as a module under --isolatedModules
export {};