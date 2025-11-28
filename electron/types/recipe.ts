/**
 * Terminal Recipe Types
 *
 * Defines the structure for terminal recipes - preset configurations
 * that spawn multiple pre-configured terminals with one click.
 */

import type { TerminalType } from './index.js'

/**
 * Configuration for a single terminal in a recipe
 */
export interface RecipeTerminal {
  /** Type of terminal to spawn */
  type: TerminalType
  /** Custom title for this terminal (optional, defaults to type-based title) */
  title?: string
  /** Command to execute after shell starts (for custom type) */
  command?: string
  /** Environment variables to set (optional) */
  env?: Record<string, string>
}

/**
 * A terminal recipe - a preset configuration that spawns multiple terminals
 */
export interface TerminalRecipe {
  /** Unique identifier for this recipe */
  id: string
  /** Display name for the recipe */
  name: string
  /** ID of the worktree this recipe is associated with (null = global recipe) */
  worktreeId: string | null
  /** List of terminals to spawn when this recipe runs */
  terminals: RecipeTerminal[]
  /** Timestamp when the recipe was created */
  createdAt: number
  /** Timestamp when the recipe was last updated */
  updatedAt: number
}

/**
 * Input for creating a new recipe (id and timestamps are auto-generated)
 */
export type CreateRecipeInput = Omit<TerminalRecipe, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Input for updating an existing recipe
 */
export type UpdateRecipeInput = Partial<Omit<TerminalRecipe, 'id' | 'createdAt' | 'updatedAt'>>

/**
 * Recipe export format for sharing
 */
export interface RecipeExport {
  /** Version of the export format */
  version: 1
  /** The recipe data */
  recipe: Omit<TerminalRecipe, 'id' | 'worktreeId' | 'createdAt' | 'updatedAt'>
  /** Timestamp when exported */
  exportedAt: number
}
