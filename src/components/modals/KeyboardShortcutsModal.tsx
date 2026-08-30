import React from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { X, Command, Sparkles, Shield, User, CornerDownLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { GLIDE } from '../../styles/motion-presets';
import { playSound } from '../../lib/sound';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSound('click');
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={GLIDE}
        className="w-full max-w-2xl"
      >
        <GlassPanel material="thick" className="p-6 md:p-8 border-2 border-yellow-400/40 shadow-2xl relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center text-yellow-400 shadow-md">
                <Command className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-orbitron font-extrabold text-xl text-white tracking-wide flex items-center gap-2">
                  <span>Keyboard Shortcuts</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-mono">
                    Floor Hotkeys
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-inter">
                  Instant command palette hotkeys for fast sales floor operations
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Section 1: Agent Shift & Break Hotkeys */}
            <div>
              <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-yellow-400 uppercase tracking-wider mb-3">
                <User className="w-4 h-4" />
                <span>Agent Floor Operations</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-inter text-xs">
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between hover:border-yellow-400/40 transition-colors">
                  <div>
                    <div className="font-semibold text-zinc-100">Punch In (Start Shift)</div>
                    <div className="text-[11px] text-zinc-400">Records login timestamp & joins active floor</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-yellow-300 font-bold shadow">
                      Shift
                    </kbd>
                    <span className="text-zinc-500 font-mono">+</span>
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-yellow-300 font-bold shadow">
                      I
                    </kbd>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between hover:border-yellow-400/40 transition-colors">
                  <div>
                    <div className="font-semibold text-zinc-100">Punch Out (End Shift)</div>
                    <div className="text-[11px] text-zinc-400">Ends active breaks & records shift sign-off</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-yellow-300 font-bold shadow">
                      Shift
                    </kbd>
                    <span className="text-zinc-500 font-mono">+</span>
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-yellow-300 font-bold shadow">
                      O
                    </kbd>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between hover:border-yellow-400/40 transition-colors sm:col-span-2">
                  <div>
                    <div className="font-semibold text-zinc-100">Quick Break Toggle</div>
                    <div className="text-[11px] text-zinc-400">Start 15m regular break or instantly return to floor if active</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-cyan font-bold shadow">
                      Shift
                    </kbd>
                    <span className="text-zinc-500 font-mono">+</span>
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-cyan font-bold shadow">
                      B
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Supervisor & Command Bar Shortcuts */}
            <div>
              <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-cyan uppercase tracking-wider mb-3">
                <Shield className="w-4 h-4" />
                <span>Supervisor & Command Deck</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-inter text-xs">
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between hover:border-cyan/40 transition-colors">
                  <div>
                    <div className="font-semibold text-zinc-100">Select All Team Pods</div>
                    <div className="text-[11px] text-zinc-400">Toggles multi-agent selection in current team</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-zinc-200 font-bold shadow">
                      Ctrl / ⌘
                    </kbd>
                    <span className="text-zinc-500 font-mono">+</span>
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-zinc-200 font-bold shadow">
                      A
                    </kbd>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between hover:border-cyan/40 transition-colors">
                  <div>
                    <div className="font-semibold text-zinc-100">Batch End Break</div>
                    <div className="text-[11px] text-zinc-400">Return selected agents to floor immediately</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-zinc-200 font-bold shadow">
                      Ctrl / ⌘
                    </kbd>
                    <span className="text-zinc-500 font-mono">+</span>
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-zinc-200 font-bold shadow">
                      E
                    </kbd>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between hover:border-cyan/40 transition-colors">
                  <div>
                    <div className="font-semibold text-zinc-100">Batch Block Breaks</div>
                    <div className="text-[11px] text-zinc-400">Freeze break access for selected pods</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-zinc-200 font-bold shadow">
                      Ctrl / ⌘
                    </kbd>
                    <span className="text-zinc-500 font-mono">+</span>
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-zinc-200 font-bold shadow">
                      B
                    </kbd>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between hover:border-cyan/40 transition-colors">
                  <div>
                    <div className="font-semibold text-zinc-100">Batch Issue Warning</div>
                    <div className="text-[11px] text-zinc-400">Issue shift warning to selected agents</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-zinc-200 font-bold shadow">
                      Ctrl / ⌘
                    </kbd>
                    <span className="text-zinc-500 font-mono">+</span>
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-zinc-200 font-bold shadow">
                      W
                    </kbd>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between hover:border-cyan/40 transition-colors sm:col-span-2">
                  <div>
                    <div className="font-semibold text-zinc-100">Batch Floor Hold</div>
                    <div className="text-[11px] text-zinc-400">Place selected agents on temporary coaching hold</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-zinc-200 font-bold shadow">
                      Ctrl / ⌘
                    </kbd>
                    <span className="text-zinc-500 font-mono">+</span>
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-zinc-200 font-bold shadow">
                      H
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Navigation & System */}
            <div>
              <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-zinc-400 uppercase tracking-wider mb-3">
                <Sparkles className="w-4 h-4 text-zinc-400" />
                <span>Global Navigation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-inter text-xs">
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-100">Keyboard Shortcuts Help</div>
                    <div className="text-[11px] text-zinc-400">Open or toggle this hotkey guide</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2.5 py-1 rounded-md bg-yellow-400 text-black font-mono text-[12px] font-extrabold shadow">
                      ?
                    </kbd>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-100">Dismiss / Close Modal</div>
                    <div className="text-[11px] text-zinc-400">Close active modal or deselect pods</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-600 font-mono text-[11px] text-zinc-300 font-bold shadow">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 font-inter">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-[10px]">Esc</kbd> anytime to close this modal</span>
            <button
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-orbitron font-bold text-xs shadow-md transition-transform hover:scale-105 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
};
