import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  onTerminalData: (callback: (data: string) => void) => void
  sendKeystroke: (data: string) => void
  resizeTerminal: (cols: number, rows: number) => void
  removeTerminalDataListener: () => void
}

contextBridge.exposeInMainWorld('electron', {
  onTerminalData: (callback: (data: string) => void) => {
    ipcRenderer.on('terminal-incoming', (_event, data: string) => callback(data))
  },

  sendKeystroke: (data: string) => {
    ipcRenderer.send('terminal-keystroke', data)
  },

  resizeTerminal: (cols: number, rows: number) => {
    ipcRenderer.send('terminal-resize', { cols, rows })
  },

  removeTerminalDataListener: () => {
    ipcRenderer.removeAllListeners('terminal-incoming')
  },
} satisfies ElectronAPI)
