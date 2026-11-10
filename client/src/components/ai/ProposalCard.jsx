import React from 'react';
import { useUIStore } from '../../stores/useUIStore.js';
import { useAIStore } from '../../stores/useAIStore.js';
import { GitCompare, Check, X, FilePlus, FileEdit, AlertCircle } from 'lucide-react';

export function ProposalCard({ proposal }) {
  const { openModal } = useUIStore();
  const { acceptProposal, rejectProposal } = useAIStore();

  const isPending = proposal.status === 'pending';
  const isAccepted = proposal.status === 'accepted';
  const isRejected = proposal.status === 'rejected';
  const isStale = proposal.status === 'stale';

  const handleOpenDiff = () => {
    openModal('diff', {
      proposal,
      onAccept: acceptProposal,
      onReject: rejectProposal,
    });
  };

  return (
    <div className={`rounded-lg border p-3 text-xs transition my-2 ${
      isAccepted
        ? 'bg-emerald-950/20 border-emerald-500/40'
        : isRejected
        ? 'bg-red-950/20 border-red-500/30 opacity-70'
        : isStale
        ? 'bg-amber-950/20 border-amber-500/40'
        : 'bg-black/30 border-vscode-dark-border hover:border-[#007acc]/60'
    }`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
          {proposal.type === 'create' ? (
            <FilePlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <FileEdit className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          )}
          <span className="font-semibold text-white truncate">{proposal.path}</span>
        </div>

        {/* Status Badge */}
        <div>
          {isAccepted && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
              Accepted
            </span>
          )}
          {isRejected && (
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-semibold">
              Rejected
            </span>
          )}
          {isStale && (
            <span title="File has changed since this proposal was generated" className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
              <AlertCircle className="w-3 h-3" />
              <span>Stale</span>
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      <p className="text-gray-300 text-[11px] mb-2 leading-relaxed">
        {proposal.summary || (proposal.type === 'create' ? 'Create new file' : 'Proposed changes')}
      </p>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <button
          onClick={handleOpenDiff}
          className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline text-[11px]"
        >
          <GitCompare className="w-3 h-3" />
          <span>Review Diff</span>
        </button>

        {isPending && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => rejectProposal(proposal.id)}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-[10px] transition"
            >
              Reject
            </button>
            <button
              onClick={() => acceptProposal(proposal.id)}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[10px] transition"
            >
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
