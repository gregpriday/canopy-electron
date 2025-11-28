export interface ElectronAPI {
  onTerminalData: (callback: (data: string) => void) => void
  sendKeystroke: (data: string) => void
  resizeTerminal: (cols: number, rows: number) => void
  removeTerminalDataListener: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}
