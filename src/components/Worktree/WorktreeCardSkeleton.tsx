import { cn } from "../../lib/utils";

/**
 * WorktreeCardSkeleton Component
 *
 * Skeleton placeholder that matches the structure of WorktreeCard to prevent
 * layout shift during initial worktree list loading. Displays animated placeholders
 * for the action buttons, branch name, path, and summary sections.
 *
 * Features:
 * - Matches WorktreeCard visual structure (buttons row, branch, path, summary, terminal badge)
 * - Subtle pulse animation using Tailwind's animate-pulse
 * - Respects prefers-reduced-motion media query
 * - Uses theme colors for consistent appearance
 * - Proper ARIA attributes for accessibility
 *
 * @see WorktreeCard - The actual component this skeleton represents
 */
export function WorktreeCardSkeleton() {
  return (
    <div
      className={cn(
        "border-2 rounded-lg p-3 mb-3",
        "border-border/50 bg-card/40",
        "motion-safe:animate-pulse motion-reduce:animate-none"
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading worktree"
    >
      <span className="sr-only">Loading worktree</span>

      {/* Action buttons row - more buttons to match real cards */}
      <div className="flex gap-2 mb-3 border-b border-gray-700 pb-2" aria-hidden="true">
        <div className="h-6 w-12 bg-muted/50 rounded" />
        <div className="h-6 w-16 bg-muted/50 rounded" />
        <div className="h-6 w-12 bg-muted/50 rounded" />
        <div className="h-6 w-14 bg-muted/50 rounded" />
        <div className="h-6 w-20 bg-muted/50 rounded" />
      </div>

      {/* Header: Activity light + Agent status + Active indicator + Branch name */}
      <div className="mb-1 flex items-center gap-2" aria-hidden="true">
        {/* Activity light placeholder - matches ActivityLight h-3 w-3 */}
        <div className="h-3 w-3 bg-muted/50 rounded-full" />
        {/* Agent status placeholder - matches AgentStatusIndicator h-5 w-5 */}
        <div className="h-5 w-5 bg-muted/50 rounded-full" />
        {/* Active indicator placeholder */}
        <div className="h-3 w-3 bg-muted/50 rounded-full" />
        {/* Branch name placeholder - wider to accommodate typical branch names */}
        <div className="h-4 w-40 bg-muted/50 rounded" />
      </div>

      {/* Path placeholder */}
      <div className="mb-2" aria-hidden="true">
        <div className="h-3 w-48 bg-muted/50 rounded" />
      </div>

      {/* Summary placeholder - taller to match text-sm rendering */}
      <div className="mt-3 space-y-2" aria-hidden="true">
        <div className="h-4 w-full bg-muted/50 rounded" />
        <div className="h-4 w-3/4 bg-muted/50 rounded" />
      </div>

      {/* Terminal badge placeholder - appears when worktree has terminals */}
      <div className="mt-3 h-6 w-32 bg-muted/50 rounded-sm" aria-hidden="true" />
    </div>
  );
}
