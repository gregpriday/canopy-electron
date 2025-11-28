import { useCallback, useEffect } from 'react'
import '@xterm/xterm/css/xterm.css'
import { isElectronAvailable, useAgentLauncher } from './hooks'
import { AppLayout } from './components/Layout'
import { TerminalGrid } from './components/Terminal'
import { useTerminalStore } from './store'

function SidebarContent() {
  return (
    <div className="p-4">
      <h2 className="text-canopy-text font-semibold text-sm mb-4">Worktrees</h2>
      <div className="text-canopy-text/60 text-sm">
        No worktrees loaded yet.
      </div>
    </div>
  )
}

function App() {
  const { focusNext, focusPrevious, toggleMaximize, focusedId } = useTerminalStore()
  const { launchAgent } = useAgentLauncher()

  // Handle agent launcher from toolbar
  const handleLaunchAgent = useCallback(async (type: 'claude' | 'gemini' | 'shell') => {
    await launchAgent(type)
  }, [launchAgent])

  const handleRefresh = useCallback(() => {
    // TODO: Implement worktree refresh via IPC
    console.log('Refresh worktrees')
  }, [])

  const handleSettings = useCallback(() => {
    // TODO: Implement settings modal
    console.log('Open settings')
  }, [])

  // Keyboard shortcuts for grid navigation
  useEffect(() => {
    if (!isElectronAvailable()) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts if user is typing in an input/textarea or terminal
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' ||
                     target.tagName === 'TEXTAREA' ||
                     target.isContentEditable

      // Skip if typing in input field
      if (isInput) return

      // Skip if focus is inside a terminal (xterm renders as a div with class 'xterm')
      // This allows terminal shortcuts and shell hotkeys to work normally
      const isInTerminal = target.closest('.xterm') !== null
      if (isInTerminal) return

      // Ctrl+Tab: Focus next terminal
      if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        focusNext()
      }
      // Ctrl+Shift+Tab: Focus previous terminal
      else if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault()
        focusPrevious()
      }
      // Ctrl+Shift+F: Toggle maximize
      else if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        if (focusedId) {
          toggleMaximize(focusedId)
        }
      }
      // Ctrl+T: New shell terminal
      else if (e.ctrlKey && e.key === 't' && !e.shiftKey) {
        e.preventDefault()
        handleLaunchAgent('shell')
      }
      // Ctrl+Shift+C: Launch Claude (use 'C' not 'c' to detect shift properly)
      else if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault()
        handleLaunchAgent('claude')
      }
      // Ctrl+Shift+G: Launch Gemini
      else if (e.ctrlKey && e.shiftKey && (e.key === 'G' || e.key === 'g')) {
        e.preventDefault()
        handleLaunchAgent('gemini')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusNext, focusPrevious, toggleMaximize, focusedId, handleLaunchAgent])

  if (!isElectronAvailable()) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-canopy-bg">
        <div className="text-canopy-text/60 text-sm">
          Electron API not available - please run in Electron
        </div>
      </div>
    )
  }

  return (
    <AppLayout
      sidebarContent={<SidebarContent />}
      onLaunchAgent={handleLaunchAgent}
      onRefresh={handleRefresh}
      onSettings={handleSettings}
    >
      <TerminalGrid className="h-full w-full bg-canopy-bg" />
    </AppLayout>
  )
}

export default App
