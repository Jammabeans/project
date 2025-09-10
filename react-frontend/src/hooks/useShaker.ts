import { useCallback, useEffect, useState } from 'react';
import { Contract } from 'ethers';
import { useWallet } from './useWallet';

const SHAKER_ABI = [
  'event RoundStarted(uint256 indexed roundId, uint256 indexed poolId, uint256 startTs, uint256 deadline, uint256 ticketPrice)',
  'event TicketBought(uint256 indexed roundId, address indexed buyer, uint256 amountPaid, uint256 newTicketPrice, uint256 deadline)',
  'event RoundFinalized(uint256 indexed roundId, address indexed winner, uint256 prizeBoxPortion, uint256 lpPortion, uint256 otherPortion)',
  'function nextRoundId() view returns (uint256)',
  'function rounds(uint256) view returns (uint256 roundId, uint256 poolId, uint256 startTs, uint256 deadline, address leader, uint256 pot, uint256 ticketCount, uint256 ticketPrice, bool finalized)',
];

type ShakerRound = {
  roundId: number;
  poolId: number;
  startTs: number;
  deadline: number;
  leader: string;
  pot: string;
  ticketCount: number;
  ticketPrice: string;
  finalized: boolean;
};

export default function useShaker(shakerAddress?: string | null) {
  const { provider } = useWallet();
  const effectiveAddress = shakerAddress ?? process.env.REACT_APP_SHAKER_ADDRESS ?? null;
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState<ShakerRound | null>(null);
  const [nextRoundId, setNextRoundId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestRound = useCallback(async (c: Contract) => {
    try {
      const next = await c.nextRoundId();
      const nextNum = Number(next?.toString?.() ?? next ?? 0);
      setNextRoundId(nextNum);
      if (nextNum === 0) {
        setRound(null);
        return;
      }
      const last = nextNum - 1;
      const r = await c.rounds(last);
      const mapped: ShakerRound = {
        roundId: Number(r.roundId?.toString?.() ?? r[0]),
        poolId: Number(r.poolId?.toString?.() ?? r[1]),
        startTs: Number(r.startTs?.toString?.() ?? r[2]),
        deadline: Number(r.deadline?.toString?.() ?? r[3]),
        leader: String(r.leader ?? r[4]),
        pot: String(r.pot?.toString?.() ?? r[5]),
        ticketCount: Number(r.ticketCount?.toString?.() ?? r[6]),
        ticketPrice: String(r.ticketPrice?.toString?.() ?? r[7]),
        finalized: Boolean(r.finalized ?? r[8]),
      };
      setRound(mapped);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  }, []);

  useEffect(() => {
    if (!provider || !effectiveAddress) {
      // clear
      setRound(null);
      setNextRoundId(null);
      return;
    }
    setLoading(true);
    const c = new Contract(effectiveAddress, SHAKER_ABI, provider);
    let mounted = true;

    (async () => {
      try {
        await fetchLatestRound(c);
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Subscribe to events for live updates
    const onRoundStarted = (roundId: any, poolId: any, startTs: any, deadline: any, ticketPrice: any) => {
      // when a round starts, fetch latest
      fetchLatestRound(c).catch(() => {});
    };
    const onTicketBought = (roundId: any, buyer: any, amountPaid: any, newTicketPrice: any, deadline: any) => {
      // partial update: refresh the round
      fetchLatestRound(c).catch(() => {});
    };
    const onRoundFinalized = (roundId: any, winner: any) => {
      fetchLatestRound(c).catch(() => {});
    };

    c.on('RoundStarted', onRoundStarted);
    c.on('TicketBought', onTicketBought);
    c.on('RoundFinalized', onRoundFinalized);

    return () => {
      mounted = false;
      try { c.removeListener('RoundStarted', onRoundStarted); } catch { /* ignore */ }
      try { c.removeListener('TicketBought', onTicketBought); } catch { /* ignore */ }
      try { c.removeListener('RoundFinalized', onRoundFinalized); } catch { /* ignore */ }
    };
  }, [provider, effectiveAddress, fetchLatestRound]);

  return {
    loading,
    round,
    nextRoundId,
    error,
    shakerAddress: effectiveAddress,
  } as const;
}