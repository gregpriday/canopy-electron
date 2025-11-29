/**
 * Settings Dialog Component
 *
 * Modal UI for viewing and configuring application settings.
 * Includes tabs for General info and Troubleshooting tools.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useErrors } from "@/hooks";
import { useLogsStore } from "@/store";
import { X, FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "general" | "troubleshooting";

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { openLogs } = useErrors();
  const clearLogs = useLogsStore((state) => state.clearLogs);

  const handleClearLogs = async () => {
    clearLogs();
    if (window.electron?.logs) {
      await window.electron.logs.clear();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-canopy-sidebar border border-canopy-border rounded-lg shadow-xl w-full max-w-2xl h-[500px] flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Sidebar */}
        <div className="w-48 border-r border-canopy-border bg-canopy-bg/50 p-4 flex flex-col gap-2">
          <h2 id="settings-title" className="text-sm font-semibold text-canopy-text mb-4 px-2">
            Settings
          </h2>
          <button
            onClick={() => setActiveTab("general")}
            className={cn(
              "text-left px-3 py-2 rounded-md text-sm transition-colors",
              activeTab === "general"
                ? "bg-canopy-accent/10 text-canopy-accent"
                : "text-gray-400 hover:bg-canopy-border hover:text-canopy-text"
            )}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("troubleshooting")}
            className={cn(
              "text-left px-3 py-2 rounded-md text-sm transition-colors",
              activeTab === "troubleshooting"
                ? "bg-canopy-accent/10 text-canopy-accent"
                : "text-gray-400 hover:bg-canopy-border hover:text-canopy-text"
            )}
          >
            Troubleshooting
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between p-6 border-b border-canopy-border">
            <h3 className="text-lg font-medium text-canopy-text capitalize">{activeTab}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-canopy-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-canopy-text">About</h4>
                  <div className="bg-canopy-bg border border-canopy-border rounded-md p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 bg-canopy-accent/20 rounded-lg flex items-center justify-center text-2xl">
                        🌲
                      </div>
                      <div>
                        <div className="font-semibold text-canopy-text text-lg">Canopy</div>
                        <div className="text-sm text-gray-400">Command Center</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Version</span>
                        <span className="font-mono text-canopy-text">0.0.1</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-canopy-text">Description</h4>
                  <p className="text-sm text-gray-400">
                    A mini IDE for orchestrating AI coding agents. Monitor worktrees, manage
                    terminals, and inject context into Claude, Gemini, and other AI agents.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "troubleshooting" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-canopy-text mb-1">Application Logs</h4>
                    <p className="text-xs text-gray-400 mb-3">
                      View internal application logs for debugging purposes.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLogs()}
                        className="text-canopy-text border-canopy-border hover:bg-canopy-border hover:text-canopy-text"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Open Log File
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearLogs}
                        className="text-red-400 border-canopy-border hover:bg-red-900/20 hover:text-red-300 hover:border-red-900/30"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Logs
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-canopy-text mb-1">Keyboard Shortcuts</h4>
                    <p className="text-xs text-gray-400 mb-3">
                      Use Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux) to open DevTools.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
