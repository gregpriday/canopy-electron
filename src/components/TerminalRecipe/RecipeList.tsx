/**
 * Recipe List Component
 *
 * Displays a list of saved terminal recipes with actions to run, edit, and delete.
 */

import { useCallback, useState, useRef, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { TerminalRecipe } from '@/store/recipeStore'

export interface RecipeListProps {
  /** List of recipes to display */
  recipes: TerminalRecipe[]
  /** Currently running recipe ID */
  runningRecipeId: string | null
  /** Callback when a recipe is selected to run */
  onRun: (recipe: TerminalRecipe) => void
  /** Callback when a recipe is selected to edit */
  onEdit: (recipe: TerminalRecipe) => void
  /** Callback when a recipe is selected to delete */
  onDelete: (recipe: TerminalRecipe) => void
  /** Callback when a recipe is selected to export */
  onExport: (recipe: TerminalRecipe) => void
}

const TERMINAL_TYPE_ICONS: Record<string, string> = {
  shell: '⬛',
  claude: '🤖',
  gemini: '💎',
  custom: '⚙️',
}

export function RecipeList({
  recipes,
  runningRecipeId,
  onRun,
  onEdit,
  onDelete,
  onExport,
}: RecipeListProps) {
  if (recipes.length === 0) {
    return (
      <div className="text-sm text-canopy-text/50 py-2 text-center">
        No recipes saved
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {recipes.map(recipe => (
        <RecipeItem
          key={recipe.id}
          recipe={recipe}
          isRunning={recipe.id === runningRecipeId}
          onRun={() => onRun(recipe)}
          onEdit={() => onEdit(recipe)}
          onDelete={() => onDelete(recipe)}
          onExport={() => onExport(recipe)}
        />
      ))}
    </div>
  )
}

interface RecipeItemProps {
  recipe: TerminalRecipe
  isRunning: boolean
  onRun: () => void
  onEdit: () => void
  onDelete: () => void
  onExport: () => void
}

function RecipeItem({
  recipe,
  isRunning,
  onRun,
  onEdit,
  onDelete,
  onExport,
}: RecipeItemProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const confirmTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleDelete = useCallback(() => {
    if (showConfirmDelete) {
      onDelete()
      setShowConfirmDelete(false)
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current)
        confirmTimerRef.current = null
      }
    } else {
      setShowConfirmDelete(true)
      // Auto-reset after 3 seconds
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current)
      }
      confirmTimerRef.current = setTimeout(() => setShowConfirmDelete(false), 3000)
    }
  }, [showConfirmDelete, onDelete])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current)
      }
    }
  }, [])

  const terminalIcons = recipe.terminals.map((t, i) => (
    <span key={i} title={t.title || t.type}>
      {TERMINAL_TYPE_ICONS[t.type] || '⬛'}
    </span>
  ))

  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded border border-canopy-border bg-canopy-bg/50 hover:bg-canopy-bg/80 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-canopy-text truncate">
            {recipe.name}
          </span>
          {recipe.worktreeId === null && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-canopy-accent/20 text-canopy-accent">
              global
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-canopy-text/50">
          <span className="flex gap-0.5">{terminalIcons}</span>
          <span className="ml-1">({recipe.terminals.length} terminals)</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Run Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={cn(
            'px-2 py-1 text-xs rounded border font-medium',
            isRunning
              ? 'border-canopy-border text-canopy-text/50 cursor-not-allowed'
              : 'border-green-600 text-green-400 hover:bg-green-900/50'
          )}
        >
          {isRunning ? '...' : '▶ Run'}
        </button>

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded text-canopy-text/50 hover:text-canopy-text hover:bg-canopy-border">
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
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              Edit Recipe
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              Export Recipe
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className={cn(
                showConfirmDelete
                  ? 'text-red-400 focus:text-red-400'
                  : ''
              )}
            >
              {showConfirmDelete ? 'Click again to confirm' : 'Delete Recipe'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
