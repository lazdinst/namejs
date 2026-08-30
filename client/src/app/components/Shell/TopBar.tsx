import React from "react";
import { GameStatus } from "shared";
import { useAppSelector } from "../../../redux/hooks";
import { cn } from "@/lib/utils";
import Mark from "../Mark";

const StatusLamp: React.FC<{ status: GameStatus }> = ({ status }) => {
  const running = status === GameStatus.RUNNING;

  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          running
            ? "bg-primary animate-pulse-dim"
            : status === GameStatus.PAUSED
              ? "bg-muted-foreground"
              : "bg-hairline"
        )}
      />
      <span className="label-tech">{status.replace("_", " ")}</span>
    </span>
  );
};

/**
 * A status strip rather than a navigation bar — there is one screen, so the
 * top of the window is better spent on the state of the simulation.
 */
const TopBar: React.FC = () => {
  const { status, tick } = useAppSelector((state) => state.game);
  const connected = useAppSelector((state) => state.websocket.connected);

  return (
    <header className="flex h-9 shrink-0 items-center justify-between border-b border-hairline bg-panel px-3">
      <div className="flex items-center gap-2.5">
        <Mark size={18} />
        <span className="text-[13px] font-bold tracking-label text-foreground">
          NAMEJS
        </span>
        <span className="h-3 w-px bg-hairline" />
        <span className="label-tech">Tactical Simulation</span>
      </div>

      <div className="flex items-center gap-4">
        <StatusLamp status={status} />
        <span className="h-3 w-px bg-hairline" />
        <span className="label-tech numeric">
          TICK <span className="text-foreground">{tick.toLocaleString()}</span>
        </span>
        <span className="h-3 w-px bg-hairline" />
        <span className="label-tech">
          LINK{" "}
          <span className={connected ? "text-primary" : "text-muted-foreground"}>
            {connected ? "UP" : "DOWN"}
          </span>
        </span>
      </div>
    </header>
  );
};

export default TopBar;
