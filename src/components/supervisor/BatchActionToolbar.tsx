import React from 'react';
import { motion } from 'motion/react';
import { BatchActionType } from '../../hooks/useBatchActions';

interface BatchActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onExecuteAction: (action: BatchActionType) => void;
  onClearSelection: () => void;
}

export const BatchActionToolbar: React.FC<BatchActionToolbarProps> = ({
  selectedCount,
  totalCount,
  isAllSelected,
  onToggleSelectAll,
  onExecuteAction,
  onClearSelection,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="w-full mb-4 p-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-wrap items-center justify-between gap-4 z-20"
    >
      {/* Selection Control */}
      <div className="flex items-center gap-3 pl-2">
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={onToggleSelectAll}
          className="w-5 h-5 rounded border-white/30 bg-white/10 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900 cursor-pointer accent-amber-400"
        />
        <span className="text-xs font-semibold text-white tracking-wide font-inter flex items-center gap-1.5">
          Selected ({selectedCount}/{totalCount})
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/10 rounded border border-white/20 text-zinc-300">Ctrl+A</kbd>
        </span>
      </div>

      {/* Batch Operation Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onExecuteAction('END_BREAK')}
          className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          title="End breaks for selected agents (Ctrl+E)"
        >
          <span>☕</span>
          <span>End Breaks</span>
          <kbd className="px-1 py-0.2 text-[9px] font-mono bg-black/40 rounded border border-blue-400/30 text-blue-200">^E</kbd>
        </button>
        <button
          onClick={() => onExecuteAction('HOLD')}
          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-300 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          title="Hold breaks for selected agents (Ctrl+H)"
        >
          <span>⏸</span>
          <span>Hold</span>
          <kbd className="px-1 py-0.2 text-[9px] font-mono bg-black/40 rounded border border-amber-400/30 text-amber-200">^H</kbd>
        </button>
        <button
          onClick={() => onExecuteAction('BLOCK')}
          className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          title="Block breaks for selected agents (Ctrl+B)"
        >
          <span>🚫</span>
          <span>Block</span>
          <kbd className="px-1 py-0.2 text-[9px] font-mono bg-black/40 rounded border border-red-400/30 text-red-200">^B</kbd>
        </button>
        <button
          onClick={() => onExecuteAction('WARNING')}
          className="px-3 py-1.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/30 text-yellow-300 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          title="Issue Warning to selected agents (Ctrl+W)"
        >
          <span>⚠️</span>
          <span>Issue Warning</span>
          <kbd className="px-1 py-0.2 text-[9px] font-mono bg-black/40 rounded border border-yellow-400/30 text-yellow-200">^W</kbd>
        </button>
        <button
          onClick={() => onExecuteAction('RESET_FLOOR')}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-200 text-xs font-orbitron font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md hover:shadow-emerald-500/20"
          title="End-of-Shift Cleanup: Force-revert selected or entire team to Floor status"
        >
          <span>🧹</span>
          <span>Reset All Floor</span>
        </button>
      </div>

      {/* Dismiss Selection */}
      <button
        onClick={onClearSelection}
        className="text-xs text-zinc-400 hover:text-white px-2 py-1 transition-colors cursor-pointer flex items-center gap-1"
        title="Deselect All (Esc)"
      >
        <span>Deselect</span>
        <kbd className="px-1 py-0.2 text-[9px] font-mono bg-white/5 rounded border border-white/10 text-zinc-400">Esc</kbd>
      </button>
    </motion.div>
  );
};
