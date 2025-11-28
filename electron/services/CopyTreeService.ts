/**
 * CopyTree Service
 *
 * Interfaces with the external CopyTree CLI tool to generate context for AI agents.
 * CopyTree generates a text representation of a codebase suitable for injection
 * into AI chat interfaces.
 */

import { execa } from 'execa';
import stripAnsi from 'strip-ansi';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { CopyTreeOptions, CopyTreeResult } from '../ipc/types.js';

// Re-export types for convenience
export type { CopyTreeOptions, CopyTreeResult };

class CopyTreeService {
  /**
   * Generate context for a worktree
   *
   * @param rootPath - Absolute path to the worktree root
   * @param options - CopyTree options (profile, extraArgs, files)
   * @returns CopyTreeResult with content, file count, and optional error
   */
  async generate(rootPath: string, options: CopyTreeOptions = {}): Promise<CopyTreeResult> {
    // Validate rootPath before calling copytree
    if (!path.isAbsolute(rootPath)) {
      return {
        content: '',
        fileCount: 0,
        error: 'rootPath must be an absolute path',
      };
    }

    try {
      await fs.access(rootPath);
    } catch {
      return {
        content: '',
        fileCount: 0,
        error: `Path does not exist or is not accessible: ${rootPath}`,
      };
    }

    const args = ['-r'];

    if (options.profile) {
      args.push('-p', options.profile);
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    if (options.files?.length) {
      args.push(...options.files);
    }

    try {
      const { stdout, stderr } = await execa('copytree', args, {
        cwd: rootPath,
        timeout: 60000, // 60s timeout for large repos
      });

      // Strip ANSI codes for clean display
      const cleanContent = stripAnsi(stdout);

      // Parse file count from output (if available)
      // CopyTree typically outputs something like "Processed 42 files"
      const fileCountMatch = cleanContent.match(/(\d+)\s+files?/i);
      const fileCount = fileCountMatch ? parseInt(fileCountMatch[1], 10) : 0;

      // Log stderr if present (warnings, debug info)
      if (stderr) {
        console.warn('[CopyTree] stderr:', stderr);
      }

      return {
        content: cleanContent,
        fileCount,
      };
    } catch (error) {
      // Handle various error scenarios
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check if copytree CLI is not installed
      // Use execa-specific error properties to distinguish CLI missing from path issues
      if (
        (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') ||
        errorMessage.includes('command not found')
      ) {
        return {
          content: '',
          fileCount: 0,
          error: 'CopyTree CLI not found in PATH. Please install copytree to use this feature.',
        };
      }

      // Timeout error - use execa's timedOut property
      if (error && typeof error === 'object' && 'timedOut' in error && error.timedOut === true) {
        return {
          content: '',
          fileCount: 0,
          error: 'CopyTree operation timed out. The repository may be too large or the operation is taking too long.',
        };
      }

      // Generic error
      return {
        content: '',
        fileCount: 0,
        error: `CopyTree error: ${errorMessage}`,
      };
    }
  }

  /**
   * Check if copytree CLI is available
   *
   * @returns True if copytree command is available in PATH
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execa('copytree', ['--version'], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

/** Singleton instance of CopyTreeService */
export const copyTreeService = new CopyTreeService();
