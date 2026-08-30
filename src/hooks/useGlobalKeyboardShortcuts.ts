import { useEffect } from 'react';

interface GlobalKeyboardShortcutsOptions {
  onToggleShortcuts: () => void;
  enabled?: boolean;
}

export const useGlobalKeyboardShortcuts = ({
  onToggleShortcuts,
  enabled = true,
}: GlobalKeyboardShortcutsOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut if user is typing in an input, textarea, select, or contentEditable
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

      // Check for '?' key (e.key === '?' or Shift + / on various keyboard layouts)
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        onToggleShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggleShortcuts, enabled]);
};
