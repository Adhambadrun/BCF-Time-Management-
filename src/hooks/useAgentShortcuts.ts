import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { playSound } from '../lib/sound';

interface AgentShortcutsOptions {
  enabled?: boolean;
}

export const useAgentShortcuts = ({ enabled = true }: AgentShortcutsOptions = {}) => {
  const {
    currentUser,
    breaks,
    startBreak,
    endBreak,
    updateUserProfile,
  } = useApp();

  useEffect(() => {
    if (!enabled || !currentUser || currentUser.role !== 'agent') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
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

      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toUpperCase();

        // Shift + I: Punch In (Start Shift)
        if (key === 'I') {
          e.preventDefault();
          if (!currentUser.actualLoginTime) {
            updateUserProfile(currentUser.email, {
              actualLoginTime: Date.now(),
              actualLogoutTime: undefined,
              status: 'FLOOR',
              isOnline: true,
            });
            playSound('break_start');
          }
        }

        // Shift + O: Punch Out (End Shift)
        if (key === 'O') {
          e.preventDefault();
          if (currentUser.actualLoginTime && !currentUser.actualLogoutTime) {
            // End active break if any
            const activeBreak = breaks.find(b => b.agentEmail === currentUser.email && b.isActive);
            if (activeBreak) {
              endBreak(activeBreak.breakId);
            }
            updateUserProfile(currentUser.email, {
              actualLogoutTime: Date.now(),
              logoutReason: 'MANUAL',
              status: 'OFF_SHIFT',
              isOnline: false,
            });
            playSound('break_end');
          }
        }

        // Shift + B: Toggle Break State
        if (key === 'B') {
          e.preventDefault();
          const activeBreak = breaks.find(b => b.agentEmail === currentUser.email && b.isActive);
          if (activeBreak) {
            endBreak(activeBreak.breakId);
          } else {
            startBreak(currentUser.email, 'short');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentUser, breaks, startBreak, endBreak, updateUserProfile, enabled]);
};
