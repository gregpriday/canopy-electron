/**
 * Recipe Editor Component
 *
 * Modal dialog for creating and editing terminal recipes.
 * Allows adding/removing terminals with type and title configuration.
 */

import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import type { TerminalRecipe, RecipeTerminal, TerminalType } from '@/store/recipeStore'

export interface RecipeEditorProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Existing recipe to edit (null for creating new) */
  recipe: TerminalRecipe | null
  /** Worktree ID for new recipes (null for global) */
  worktreeId: string | null
  /** Callback when recipe is saved */
  onSave: (name: string, terminals: RecipeTerminal[]) => Promise<void>
}

const TERMINAL_TYPES: { value: TerminalType; label: string; description: string }[] = [
  { value: 'shell', label: 'Shell', description: 'Standard terminal shell' },
  { value: 'claude', label: 'Claude', description: 'Claude AI agent' },
  { value: 'gemini', label: 'Gemini', description: 'Gemini AI agent' },
  { value: 'custom', label: 'Custom', description: 'Custom command' },
]

interface TerminalItem {
  id: string
  type: TerminalType
  title: string
}

export function RecipeEditor({
  open,
  onOpenChange,
  recipe,
  worktreeId,
  onSave,
}: RecipeEditorProps) {
  const [name, setName] = useState('')
  const [terminals, setTerminals] = useState<TerminalItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens/closes or recipe changes
  useEffect(() => {
    if (open) {
      if (recipe) {
        setName(recipe.name)
        setTerminals(
          recipe.terminals.map((t, i) => ({
            id: `terminal-${i}`,
            type: t.type,
            title: t.title || '',
          }))
        )
      } else {
        setName('')
        setTerminals([{ id: 'terminal-0', type: 'shell', title: '' }])
      }
      setError(null)
    }
  }, [open, recipe])

  const handleAddTerminal = useCallback(() => {
    if (terminals.length >= 10) {
      setError('Maximum 10 terminals per recipe')
      return
    }
    setTerminals(prev => [
      ...prev,
      { id: `terminal-${Date.now()}`, type: 'shell', title: '' },
    ])
  }, [terminals.length])

  const handleRemoveTerminal = useCallback((id: string) => {
    setTerminals(prev => {
      if (prev.length <= 1) {
        setError('At least one terminal is required')
        return prev
      }
      return prev.filter(t => t.id !== id)
    })
  }, [])

  const handleUpdateTerminal = useCallback(
    (id: string, field: 'type' | 'title', value: string) => {
      setTerminals(prev =>
        prev.map(t =>
          t.id === id
            ? { ...t, [field]: field === 'type' ? (value as TerminalType) : value }
            : t
        )
      )
    },
    []
  )

  const handleSave = useCallback(async () => {
    setError(null)

    if (!name.trim()) {
      setError('Recipe name is required')
      return
    }
    if (terminals.length === 0) {
      setError('At least one terminal is required')
      return
    }

    setIsSaving(true)
    try {
      const recipeTerminals: RecipeTerminal[] = terminals.map(t => ({
        type: t.type,
        title: t.title.trim() || undefined,
      }))
      await onSave(name.trim(), recipeTerminals)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe')
    } finally {
      setIsSaving(false)
    }
  }, [name, terminals, onSave, onOpenChange])

  const isEditing = recipe !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Recipe' : 'Create Recipe'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your terminal recipe configuration.'
              : 'Create a terminal recipe to spawn multiple terminals with one click.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipe Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-canopy-text" htmlFor="recipe-name">
              Recipe Name
            </label>
            <input
              id="recipe-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Full Stack Dev"
              className="w-full rounded-md border border-canopy-border bg-canopy-bg px-3 py-2 text-sm text-canopy-text placeholder:text-canopy-text/50 focus:border-canopy-accent focus:outline-none focus:ring-1 focus:ring-canopy-accent"
            />
          </div>

          {/* Terminals List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-canopy-text">
                Terminals ({terminals.length}/10)
              </label>
              <button
                type="button"
                onClick={handleAddTerminal}
                disabled={terminals.length >= 10}
                className={cn(
                  'text-xs px-2 py-1 rounded border border-canopy-accent text-canopy-accent',
                  terminals.length >= 10
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-canopy-accent/10'
                )}
              >
                + Add Terminal
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {terminals.map((terminal, index) => (
                <div
                  key={terminal.id}
                  className="flex items-center gap-2 p-2 rounded border border-canopy-border bg-canopy-bg/50"
                >
                  <span className="text-xs text-canopy-text/50 w-5">{index + 1}.</span>

                  {/* Type Select */}
                  <select
                    value={terminal.type}
                    onChange={e => handleUpdateTerminal(terminal.id, 'type', e.target.value)}
                    className="flex-shrink-0 rounded border border-canopy-border bg-canopy-bg px-2 py-1 text-sm text-canopy-text focus:border-canopy-accent focus:outline-none"
                  >
                    {TERMINAL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  {/* Title Input */}
                  <input
                    type="text"
                    value={terminal.title}
                    onChange={e => handleUpdateTerminal(terminal.id, 'title', e.target.value)}
                    placeholder="Custom title (optional)"
                    className="flex-1 min-w-0 rounded border border-canopy-border bg-canopy-bg px-2 py-1 text-sm text-canopy-text placeholder:text-canopy-text/50 focus:border-canopy-accent focus:outline-none"
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveTerminal(terminal.id)}
                    disabled={terminals.length <= 1}
                    className={cn(
                      'p-1 rounded text-canopy-text/50',
                      terminals.length <= 1
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:text-red-400 hover:bg-red-400/10'
                    )}
                    title="Remove terminal"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {/* Scope Indicator */}
          <div className="text-xs text-canopy-text/50">
            {worktreeId
              ? 'This recipe will be saved for the current worktree.'
              : 'This recipe will be saved globally (available for all worktrees).'}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : isEditing ? 'Update Recipe' : 'Create Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
