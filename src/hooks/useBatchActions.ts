import { useState, useCallback } from 'react';
import { playSound } from '../lib/sound';

export type BatchActionType = 'END_BREAK' | 'HOLD' | 'BLOCK' | 'WARNING' | 'RESET_FLOOR';

export const useBatchActions = (
  allAgentIds: string[],
  onLocalBatchSync?: (action: BatchActionType, ids: string[]) => void
) => {
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Toggle single selection
  const toggleSelectAgent = useCallback((agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  }, []);

  // Toggle 'Select All'
  const toggleSelectAll = useCallback(() => {
    playSound('click');
    if (selectedAgentIds.length === allAgentIds.length && allAgentIds.length > 0) {
      setSelectedAgentIds([]);
    } else {
      setSelectedAgentIds([...allAgentIds]);
    }
  }, [allAgentIds, selectedAgentIds]);

  const clearSelection = useCallback(() => {
    playSound('click');
    setSelectedAgentIds([]);
  }, []);

  // Execute Neon Batch Update
  const executeBatchAction = async (action: BatchActionType) => {
    // If RESET_FLOOR and no specific agents selected, apply to all agents
    const targetAgentIds =
      action === 'RESET_FLOOR' && selectedAgentIds.length === 0
        ? allAgentIds
        : selectedAgentIds;

    if (targetAgentIds.length === 0 || isExecuting) return;
    setIsExecuting(true);

    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch',
          batchAction: action,
          selectedAgentEmails: targetAgentIds,
        }),
      });

      // Sync local state if handler provided
      if (onLocalBatchSync) {
        onLocalBatchSync(action, targetAgentIds);
      }

      playSound(action === 'WARNING' || action === 'BLOCK' ? 'warning' : 'break_end');
    } catch (err) {
      console.warn('Batch Action fallback to local context:', err);
      if (onLocalBatchSync) {
        onLocalBatchSync(action, targetAgentIds);
      }
    } finally {
      setIsExecuting(false);
      clearSelection();
    }
  };

  return {
    selectedAgentIds,
    toggleSelectAgent,
    toggleSelectAll,
    clearSelection,
    executeBatchAction,
    isExecuting,
    hasSelection: selectedAgentIds.length > 0,
    selectedCount: selectedAgentIds.length,
    isAllSelected: allAgentIds.length > 0 && selectedAgentIds.length === allAgentIds.length,
  };
};
