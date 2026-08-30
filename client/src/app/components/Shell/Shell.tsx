import React from "react";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { toggleRightPanel } from "../../../redux/slices/ui";
import { cn } from "@/lib/utils";

interface ShellProps {
  topBar: React.ReactNode;
  map: React.ReactNode;
  /** Pinned to the top-left of the map — the player's element, always visible. */
  overlay: React.ReactNode;
  /** The ops drawer on the right edge. Collapsed until the tab is pulled. */
  drawer: React.ReactNode;
}

/**
 * The map is the screen. Everything else floats over it: the element card in
 * the top-left corner, and an ops drawer that slides in from the right edge.
 * The layer sits above Leaflet's panes and passes pointer events through
 * everywhere it has nothing to show.
 */
const Shell: React.FC<ShellProps> = ({ topBar, map, overlay, drawer }) => {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.rightPanelOpen ?? false);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {topBar}
      <div className="relative min-h-0 flex-1">
        {map}

        <div className="pointer-events-none absolute inset-0 z-[1100]">
          {/* element card */}
          <div className="pointer-events-auto absolute bottom-3 left-3 top-3 w-[252px]">
            <div className="max-h-full overflow-y-auto border border-hairline bg-panel/90 shadow-[0_8px_28px_rgba(0,0,0,0.55)] backdrop-blur-sm">
              {overlay}
            </div>
          </div>

          {/* ops drawer */}
          <div
            className={cn(
              "pointer-events-auto absolute inset-y-0 right-0 flex transition-transform duration-200",
              open ? "translate-x-0" : "translate-x-[300px]"
            )}
          >
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? "Collapse ops panel" : "Expand ops panel"}
              onClick={() => dispatch(toggleRightPanel())}
              className="mt-3 flex h-20 w-6 flex-col items-center justify-center gap-1 self-start border border-r-0 border-hairline bg-panel text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span className="text-[10px]">{open ? "\u203A" : "\u2039"}</span>
              <span className="text-[8px] uppercase tracking-label [writing-mode:vertical-rl]">
                Ops
              </span>
            </button>
            <aside className="w-[300px] overflow-y-auto border-l border-hairline bg-panel">
              {drawer}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shell;
