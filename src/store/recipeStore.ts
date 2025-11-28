/**
 * Recipe Store
 *
 * Zustand store for managing terminal recipes in the renderer process.
 * Handles recipe CRUD operations, running recipes, and export/import.
 */

import { create } from 'zustand'
import { useTerminalStore } from './terminalStore'

// Types matching the preload API
export type TerminalType = 'shell' | 'claude' | 'gemini' | 'custom'

export interface RecipeTerminal {
  type: TerminalType
  title?: string
  command?: string
  env?: Record<string, string>
}

export interface TerminalRecipe {
  id: string
  name: string
  worktreeId: string | null
  terminals: RecipeTerminal[]
  createdAt: number
  updatedAt: number
}

interface RecipeRunResult {
  success: boolean
  terminalIds: string[]
  error?: string
}

interface RecipeState {
  recipes: TerminalRecipe[]
  isLoading: boolean
  error: string | null
  runningRecipeId: string | null

  // Actions
  fetchRecipes: () => Promise<void>
  fetchRecipesForWorktree: (worktreeId: string | null) => Promise<TerminalRecipe[]>
  createRecipe: (name: string, worktreeId: string | null, terminals: RecipeTerminal[]) => Promise<TerminalRecipe>
  updateRecipe: (id: string, updates: { name?: string; worktreeId?: string | null; terminals?: RecipeTerminal[] }) => Promise<TerminalRecipe>
  deleteRecipe: (id: string) => Promise<void>
  runRecipe: (id: string, worktreeId: string, worktreePath: string) => Promise<RecipeRunResult>
  runRecipeLocally: (recipe: TerminalRecipe, worktreeId: string, worktreePath: string) => Promise<RecipeRunResult>
  exportRecipe: (id: string) => Promise<string>
  importRecipe: (json: string, worktreeId: string | null) => Promise<TerminalRecipe>
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  isLoading: false,
  error: null,
  runningRecipeId: null,

  fetchRecipes: async () => {
    set({ isLoading: true, error: null })
    try {
      const recipes = await window.electron.recipe.getAll()
      set({ recipes, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch recipes'
      set({ error: message, isLoading: false })
    }
  },

  fetchRecipesForWorktree: async (worktreeId: string | null) => {
    try {
      return await window.electron.recipe.getForWorktree(worktreeId)
    } catch (error) {
      console.error('Failed to fetch recipes for worktree:', error)
      return []
    }
  },

  createRecipe: async (name: string, worktreeId: string | null, terminals: RecipeTerminal[]) => {
    set({ error: null })
    try {
      const recipe = await window.electron.recipe.create(name, worktreeId, terminals)
      set(state => ({ recipes: [...state.recipes, recipe] }))
      return recipe
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create recipe'
      set({ error: message })
      throw error
    }
  },

  updateRecipe: async (id: string, updates: { name?: string; worktreeId?: string | null; terminals?: RecipeTerminal[] }) => {
    set({ error: null })
    try {
      const recipe = await window.electron.recipe.update(id, updates)
      set(state => ({
        recipes: state.recipes.map(r => r.id === id ? recipe : r)
      }))
      return recipe
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update recipe'
      set({ error: message })
      throw error
    }
  },

  deleteRecipe: async (id: string) => {
    set({ error: null })
    try {
      await window.electron.recipe.delete(id)
      set(state => ({
        recipes: state.recipes.filter(r => r.id !== id)
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete recipe'
      set({ error: message })
      throw error
    }
  },

  runRecipe: async (id: string, worktreeId: string, worktreePath: string) => {
    // Find the recipe first
    const recipes = get().recipes
    let recipe = recipes.find(r => r.id === id)

    // If not in local state, fetch from backend
    if (!recipe) {
      recipe = await window.electron.recipe.get(id) ?? undefined
    }

    if (!recipe) {
      set({ error: 'Recipe not found' })
      return { success: false, terminalIds: [], error: 'Recipe not found' }
    }

    return get().runRecipeLocally(recipe, worktreeId, worktreePath)
  },

  runRecipeLocally: async (recipe: TerminalRecipe, worktreeId: string, worktreePath: string) => {
    set({ runningRecipeId: recipe.id, error: null })

    const terminalIds: string[] = []
    const addTerminal = useTerminalStore.getState().addTerminal

    try {
      // Spawn terminals sequentially using the terminalStore
      for (const terminal of recipe.terminals) {
        // Determine command for AI agent types
        let command: string | undefined
        if (terminal.type === 'claude') {
          command = 'claude'
        } else if (terminal.type === 'gemini') {
          command = 'gemini'
        }

        const id = await addTerminal({
          type: terminal.type,
          title: terminal.title,
          worktreeId,
          cwd: worktreePath,
          command,
        })

        terminalIds.push(id)

        // Small delay between spawns to prevent buffer overflow
        if (recipe.terminals.indexOf(terminal) < recipe.terminals.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      set({ runningRecipeId: null })
      return { success: true, terminalIds }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run recipe'
      set({ runningRecipeId: null, error: message })
      return { success: false, terminalIds, error: message }
    }
  },

  exportRecipe: async (id: string) => {
    try {
      return await window.electron.recipe.export(id)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export recipe'
      set({ error: message })
      throw error
    }
  },

  importRecipe: async (json: string, worktreeId: string | null) => {
    set({ error: null })
    try {
      const recipe = await window.electron.recipe.import(json, worktreeId)
      set(state => ({ recipes: [...state.recipes, recipe] }))
      return recipe
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import recipe'
      set({ error: message })
      throw error
    }
  },
}))
