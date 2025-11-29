/**
 * useContextInjection Hook
 *
 * Provides context injection functionality for worktrees into terminals.
 * Generates CopyTree output and injects it into the focused terminal.
 *
 * The output format is automatically optimized based on the target AI agent:
 * - Claude: XML (structured parsing)
 * - Gemini: Markdown (natural reading)
 * - Shell/Custom: XML (safe default)
 */

import { useCallback, useState } from "react";
import { useTerminalStore, type TerminalInstance } from "@/store/terminalStore";
import type { TerminalType } from "@/components/Terminal/TerminalPane";

/** CopyTree output format */
type CopyTreeFormat = "xml" | "json" | "markdown" | "tree" | "ndjson";

/**
 * Mapping from terminal type to optimal CopyTree output format.
 * Different AI agents have different preferences for context format.
 */
const AGENT_FORMAT_MAP: Record<TerminalType, CopyTreeFormat> = {
  claude: "xml", // Claude prefers structured XML
  gemini: "markdown", // Gemini works well with Markdown
  shell: "xml", // Default for manual paste
  custom: "xml", // Safe default
};

/**
 * Get the optimal CopyTree output format for a terminal type.
 */
function getOptimalFormat(terminalType: TerminalType): CopyTreeFormat {
  const format = AGENT_FORMAT_MAP[terminalType];
  if (!format) {
    console.warn(`Unknown terminal type "${terminalType}", defaulting to XML format`);
    return "xml";
  }
  return format;
}

export interface UseContextInjectionReturn {
  /** Inject context from a worktree into a terminal */
  inject: (worktreeId: string, terminalId?: string) => Promise<void>;
  /** Whether an injection is currently in progress */
  isInjecting: boolean;
  /** Error message from the last injection attempt */
  error: string | null;
  /** Clear the error state */
  clearError: () => void;
}

export function useContextInjection(): UseContextInjectionReturn {
  const [isInjecting, setIsInjecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focusedId = useTerminalStore((state) => state.focusedId);
  const terminals = useTerminalStore((state) => state.terminals);

  const inject = useCallback(
    async (worktreeId: string, terminalId?: string) => {
      const targetTerminalId = terminalId || focusedId;

      if (!targetTerminalId) {
        setError("No terminal selected");
        return;
      }

      setIsInjecting(true);
      setError(null);

      try {
        // Check if CopyTree is available
        const isAvailable = await window.electron.copyTree.isAvailable();
        if (!isAvailable) {
          throw new Error(
            "CopyTree CLI not installed. Please install copytree to use this feature."
          );
        }

        // Get terminal info to determine optimal format
        const terminal = terminals.find((t: TerminalInstance) => t.id === targetTerminalId);
        if (!terminal) {
          throw new Error(`Terminal not found: ${targetTerminalId}`);
        }
        const format = getOptimalFormat(terminal.type);

        // Inject context into terminal with optimal format
        // The injectToTerminal function handles:
        // - Looking up the worktree path from worktreeId
        // - Generating context via CopyTree with the specified format
        // - Chunked writing to the terminal
        const result = await window.electron.copyTree.injectToTerminal(
          targetTerminalId,
          worktreeId,
          { format }
        );

        if (result.error) {
          throw new Error(result.error);
        }

        // Log success with format information
        console.log(`Context injected (${result.fileCount} files as ${format.toUpperCase()})`);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to inject context";
        setError(message);
        console.error("Context injection failed:", message);
      } finally {
        setIsInjecting(false);
      }
    },
    [focusedId, terminals]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { inject, isInjecting, error, clearError };
}
