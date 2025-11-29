import Store from "electron-store";
import type { RecentDirectory } from "./ipc/types.js";

export type { RecentDirectory };

export interface StoreSchema {
  windowState: {
    x?: number;
    y?: number;
    width: number;
    height: number;
    isMaximized: boolean;
  };
  appState: {
    activeWorktreeId?: string;
    sidebarWidth: number;
    lastDirectory?: string;
    recentDirectories?: RecentDirectory[];
    terminals: Array<{
      id: string;
      type: "shell" | "claude" | "gemini" | "custom";
      title: string;
      cwd: string;
      worktreeId?: string;
    }>;
  };
}

export const store = new Store<StoreSchema>({
  defaults: {
    windowState: {
      x: undefined,
      y: undefined,
      width: 1200,
      height: 800,
      isMaximized: false,
    },
    appState: {
      sidebarWidth: 350,
      recentDirectories: [],
      terminals: [],
    },
  },
});
