import { useEffect } from 'react';
import { BatchActionType } from './useBatchActions';

interface SupervisorShortcutsOptions {
  hasSelection: boolean;
  selectedAgentIds: string[];
  executeBatchAction: (action: BatchActionType) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  enabled?: boolean;
}

export const useSupervisorShortcuts = ({
  hasSelection,
  selectedAgentIds,
  executeBatchAction,
  toggleSelectAll,
  clearSelection,
  enabled = true,
}: SupervisorShortcutsOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isModifier = e.ctrlKey || e.metaKey;

      // Select All: Ctrl/Cmd + A
      if (isModifier && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        toggleSelectAll();
        return;
      }

      // Escape to clear selection
      if (e.key === 'Escape' && hasSelection) {
        e.preventDefault();
        clearSelection();
        return;
      }

      // Actions only active when there is a selection
      if (hasSelection && isModifier) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            executeBatchAction('BLOCK');
            break;
          case 'w':
            e.preventDefault();
            executeBatchAction('WARNING');
            break;
          case 'e':
            e.preventDefault();
            executeBatchAction('END_BREAK');
            break;
          case 'h':
            e.preventDefault();
            executeBatchAction('HOLD');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasSelection, selectedAgentIds, executeBatchAction, toggleSelectAll, clearSelection, enabled]);
};
