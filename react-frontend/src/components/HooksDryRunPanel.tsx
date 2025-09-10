import React, { useMemo, useState } from 'react';
import useCommandFees from '../hooks/useCommandFees';

type CommandDraft = {
  target: string;
  selector: string; // bytes4 or string
  callType?: number;
  feeBips?: number;
};

type Props = {
  existingTargetFees: Record<string, number | null> | null;
  existingLocks: Record<string, boolean> | null; // keyed by "target:selector"
  onValidate?: (valid: boolean) => void;
};

/**
 * HooksDryRunPanel
 * - Simple dry-run preview where admins paste/enter a draft Command[] JSON.
 * - Computes per-target fee preview by calling COMMAND_FEE_BIPS on draft targets (uses useCommandFees).
 * - Shows fee delta vs existing target fees and flags locked commands.
 *
 * This is a read-only simulation UI — it does not submit transactions.
 */
const container: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  background: '#0e0f12',
  borderRadius: 8,
  border: '1px solid #222',
  color: '#ddd',
};

const inputStyle: React.CSSProperties = { width: '100%', minHeight: 88, padding: 8, background: '#0b0b0d', color: '#eee', borderRadius: 6, border: '1px solid #222' };

export default function HooksDryRunPanel({ existingTargetFees, existingLocks, onValidate }: Props) {
  const [draftText, setDraftText] = useState<string>('[\n  { "target": "0x...", "selector": "0x...", "callType": 0 }\n]');
  // Parsed commands
  const parsed: CommandDraft[] = useMemo(() => {
    try {
      const p = JSON.parse(draftText);
      if (Array.isArray(p)) {
        return p.map((c: any) => ({
          target: String(c.target ?? '').trim(),
          selector: String(c.selector ?? '').trim(),
          callType: c.callType,
          feeBips: c.feeBips,
        })).filter((c: CommandDraft) => !!c.target);
      }
    } catch {
      // ignore parse errors
    }
    return [];
  }, [draftText]);

  const draftTargets = useMemo(() => Array.from(new Set(parsed.map(p => p.target.toLowerCase()).filter(Boolean))), [parsed]);

  // Fetch fee bips for draft targets
  const { fees: draftFees, loading: draftFeesLoading, error: draftFeesError, refetch: refetchDraftFees } = useCommandFees(draftTargets, { pollIntervalMs: null });

  // Compute aggregate fee numbers
  const existingTotal = useMemo(() => {
    if (!existingTargetFees) return null;
    // sum unique existing fees (treat null as 0) — use explicit loop to satisfy strict null checks
    let sum = 0;
    for (const v of Object.values(existingTargetFees)) {
      sum += Number(v ?? 0) || 0;
    }
    return sum;
  }, [existingTargetFees]);
 
  const draftTotal = useMemo(() => {
    if (!draftFees) return null;
    let sum = 0;
    for (const v of Object.values(draftFees)) {
      sum += Number(v ?? 0) || 0;
    }
    return sum;
  }, [draftFees]);

  const delta = (existingTotal == null || draftTotal == null) ? null : Number(draftTotal) - Number(existingTotal);

  // Locked commands found in the draft
  const lockedInDraft = useMemo(() => {
    if (!existingLocks || parsed.length === 0) return [];
    return parsed.filter(c => {
      const key = `${c.target}:${c.selector}`;
      return !!existingLocks[key];
    });
  }, [existingLocks, parsed]);

  // Inform parent about validation status (simple: parse ok and no locked commands)
  const isValid = parsed.length > 0 && lockedInDraft.length === 0;
  React.useEffect(() => {
    onValidate && onValidate(isValid);
  }, [isValid, onValidate]);

  return (
    <div style={container}>
      <h4 style={{ marginTop: 0 }}>Dry-run Preview</h4>
      <div style={{ marginBottom: 8 }}>
        Paste a draft Command[] (JSON). Each command should include at least: target, selector. Example:
      </div>
      <textarea
        style={inputStyle}
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        aria-label="Draft commands JSON"
      />
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => refetchDraftFees()} disabled={draftFeesLoading} style={{ padding: '0.4em 0.8em', borderRadius: 6, background: '#1976d2', color: '#fff' }}>
          {draftFeesLoading ? 'Refreshing fees...' : 'Refresh Draft Fees'}
        </button>
        {draftFeesError && <span style={{ color: '#ff6b6b' }}>{String(draftFeesError)}</span>}
        <div style={{ marginLeft: 'auto', color: '#999', fontSize: '0.9em' }}>
          Parsed commands: <strong style={{ color: '#fff' }}>{parsed.length}</strong>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9em', color: '#bbb' }}>Draft Targets & Fees</div>
            <ul style={{ marginTop: 8 }}>
              {draftTargets.length === 0 && <li style={{ color: '#777' }}>No targets detected</li>}
              {draftTargets.map((t) => (
                <li key={t} style={{ color: '#ddd', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span><code style={{ color: '#9ad' }}>{t}</code></span>
                  <span style={{ color: '#ccc' }}>{draftFees && draftFees[t] != null ? String(draftFees[t]) : <span style={{ color: '#777' }}>n/a</span>}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ width: 220 }}>
            <div style={{ fontSize: '0.9em', color: '#bbb' }}>Fee Summary</div>
            <div style={{ marginTop: 8, color: '#fff' }}>
              <div>Existing sum: <strong style={{ float: 'right' }}>{existingTotal == null ? 'n/a' : existingTotal}</strong></div>
              <div>Draft sum: <strong style={{ float: 'right' }}>{draftTotal == null ? 'n/a' : draftTotal}</strong></div>
              <div style={{ borderTop: '1px solid #222', marginTop: 8, paddingTop: 8 }}>
                Delta: <strong style={{ float: 'right', color: delta != null ? (delta > 0 ? '#ffb86b' : delta < 0 ? '#7ee787' : '#ddd') : '#777' }}>{delta == null ? 'n/a' : `${delta >= 0 ? '+' : ''}${delta}`}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: '0.9em', color: '#bbb' }}>Validation</div>
        <div style={{ marginTop: 8 }}>
          {lockedInDraft.length > 0 ? (
            <div style={{ color: '#ff8b8b' }}>
              Locked commands detected ({lockedInDraft.length}) — these cannot be removed for this pool. See below for details.
            </div>
          ) : (
            <div style={{ color: isValid ? '#7ee787' : '#777' }}>
              {isValid ? 'Draft looks valid (no locked commands detected).' : 'Draft requires review.'}
            </div>
          )}
        </div>

        {lockedInDraft.length > 0 && (
          <ul style={{ marginTop: 8 }}>
            {lockedInDraft.map((c, i) => (
              <li key={`${c.target}-${c.selector}-${i}`} style={{ color: '#ffb3b3' }}>
                Locked: <code>{c.target}</code> selector <code>{c.selector}</code>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}