import { cn } from "../../lib/utils";

/**
 * WorktreeCardSkeleton Component
 *
 * Skeleton placeholder that matches the structure of WorktreeCard to prevent
 * layout shift during initial worktree list loading. Displays animated placeholders
 * for the action buttons, branch name, path, and summary sections.
 *
 * Features:
 * - Matches WorktreeCard visual structure (compact header, meta rows)
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
        "border rounded-lg p-3 mb-2",
        "border-border/50 bg-card/30",
        "motion-safe:animate-pulse motion-reduce:animate-none"
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading worktree"
    >
      <span className="sr-only">Loading worktree</span>

      {/* Header: Status + Branch + Path + Action placeholers */}
      <div className="mb-3 flex items-start justify-between gap-2" aria-hidden="true">
        <div className="flex flex-col gap-1.5 w-3/4">
            <div className="flex items-center gap-2">
                {/* Status dots */}
                <div className="h-3 w-3 bg-muted/50 rounded-full" />
                <div className="h-3 w-3 bg-muted/50 rounded-full" />
                {/* Branch name */}
                <div className="h-4 w-32 bg-muted/50 rounded" />
            </div>
             {/* Path */}
            <div className="h-3 w-48 bg-muted/50 rounded" />
        </div>
         {/* Action buttons placeholder */}
        <div className="flex gap-1">
            <div className="h-6 w-6 bg-muted/30 rounded" />
        </div>
      </div>

      {/* Summary Lines */}
      <div className="space-y-2 mb-3" aria-hidden="true">
        <div className="h-3 w-full bg-muted/40 rounded" />
        <div className="h-3 w-5/6 bg-muted/40 rounded" />
      </div>

      {/* Metrics Row (Dev | Terminals | Changes) */}
      <div className="flex items-center gap-4" aria-hidden="true">
         {/* Dev */}
         <div className="flex items-center gap-2">
             <div className="h-3 w-3 bg-muted/50 rounded-full" />
             <div className="h-3 w-16 bg-muted/40 rounded" />
         </div>
         {/* Terminals */}
         <div className="flex items-center gap-2">
             <div className="h-3 w-3 bg-muted/50 rounded" />
             <div className="h-3 w-4 bg-muted/40 rounded" />
         </div>
         {/* Changes */}
         <div className="flex items-center gap-2">
             <div className="h-3 w-3 bg-muted/50 rounded" />
             <div className="h-3 w-12 bg-muted/40 rounded" />
         </div>
      </div>
    </div>
  );
}
