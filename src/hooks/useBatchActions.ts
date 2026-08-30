import { useState, useCallback } from 'react';
import { writeBatch, doc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { playSound } from '../lib/sound';

export type BatchActionType = 'END_BREAK' | 'HOLD' | 'BLOCK' | 'WARNING';

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

  // Execute Firestore Batch Update
  const executeBatchAction = async (action: BatchActionType) => {
    if (selectedAgentIds.length === 0 || isExecuting) return;
    setIsExecuting(true);

    try {
      if (db) {
        const batch = writeBatch(db);

        selectedAgentIds.forEach((agentId) => {
          const agentRef = doc(db, 'agents', agentId);

          switch (action) {
            case 'END_BREAK':
              batch.update(agentRef, {
                status: 'FLOOR',
                breakEndedAt: serverTimestamp(),
                isBreakAllowed: true,
              });
              break;
            case 'HOLD':
              batch.update(agentRef, {
                status: 'HOLD',
                isBreakAllowed: false,
              });
              break;
            case 'BLOCK':
              batch.update(agentRef, {
                status: 'BLOCKED',
                isBreakAllowed: false,
                breakEndedAt: serverTimestamp(),
              });
              break;
            case 'WARNING':
              batch.update(agentRef, {
                warningCount: increment(1),
              });
              break;
          }
        });

        await batch.commit();
      }

      // Sync local state if handler provided
      if (onLocalBatchSync) {
        onLocalBatchSync(action, selectedAgentIds);
      }

      playSound(action === 'WARNING' || action === 'BLOCK' ? 'warning' : 'break_end');
    } catch (err) {
      console.warn('Firestore Batch Action fallback to local context:', err);
      if (onLocalBatchSync) {
        onLocalBatchSync(action, selectedAgentIds);
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
    isAllSelected: allAgentIds.length > 0 && selectedAgentIds.length === allAgentIds.length,
    hasSelection: selectedAgentIds.length > 0,
  };
};
