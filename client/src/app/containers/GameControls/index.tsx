import React from "react";
import { GameStatus, PlatoonFaction, UnitStatusType } from "shared";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  sendGameControl,
  stepGame,
  setAutonomy,
} from "../../../redux/slices/game";
import { factionLabels, factionInk } from "../../Map/factions";
import { tallyHeld } from "shared";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Skull } from "lucide-react";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="flex flex-col gap-2 px-3 py-3">
    <h2 className="label-tech">{title}</h2>
    {children}
  </section>
);

const Readout: React.FC<{ k: string; children: React.ReactNode }> = ({
  k,
  children,
}) => (
  <div className="flex items-center justify-between">
    <span className="label-tech">{k}</span>
    <span className="numeric text-[12px] text-foreground">{children}</span>
  </div>
);

const GameControls: React.FC = () => {
  const dispatch = useAppDispatch();
  const { status, tick, events, autonomous, pending, error, outcome, objectives } =
    useAppSelector((state) => state.game);
  const platoons = useAppSelector((state) => state.platoons.platoons);

  const isRunning = status === GameStatus.RUNNING;

  const strength = (faction: PlatoonFaction) => {
    const units = platoons
      .filter((platoon) => platoon.faction === faction)
      .flatMap((platoon) => platoon.units);
    const alive = units.filter(
      (unit) => unit.status !== UnitStatusType.Kia
    ).length;
    return { alive, total: units.length };
  };

  return (
    <div className="flex h-full flex-col divide-y divide-hairline">
      <Section title="Simulation">
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant={isRunning ? "default" : "outline"}
            size="sm"
            disabled={pending || isRunning}
            onClick={() => dispatch(sendGameControl("start"))}
          >
            Start
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending || !isRunning}
            onClick={() => dispatch(sendGameControl("pause"))}
          >
            Pause
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => dispatch(sendGameControl("reset"))}
          >
            Reset
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={pending || isRunning}
          onClick={() => dispatch(stepGame(10))}
          title="Advance 10 ticks while paused"
        >
          Step 10 ticks
        </Button>

        {/* Admin mode: one operator presses start and both sides fight it out. */}
        <div className="mt-1 flex items-center justify-between border border-hairline bg-card px-2 py-1.5">
          <span className="label-tech">Control</span>
          <div className="flex items-center gap-px">
            {(
              [
                ["AUTO", true],
                ["MANUAL", false],
              ] as const
            ).map(([label, value]) => (
              <button
                key={label}
                type="button"
                disabled={pending}
                aria-pressed={autonomous === value}
                onClick={() => dispatch(setAutonomy(value))}
                className={cn(
                  "px-2 py-0.5 text-[10px] uppercase tracking-label transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  autonomous === value
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[10px] leading-snug text-muted-foreground/70">
          {autonomous
            ? "Both sides act on their platoon strategy. Orders you issue override a unit until it arrives."
            : "Units hold until ordered."}
        </p>

        <div className="mt-1 flex flex-col gap-1.5">
          <Readout k="Tick">{tick.toLocaleString()}</Readout>
          <Readout k="State">
            <span className={isRunning ? "text-primary" : "text-muted-foreground"}>
              {status.replace("_", " ").toUpperCase()}
            </span>
          </Readout>
        </div>

        {error && (
          <p className="text-[11px] text-destructive-foreground/90">{error}</p>
        )}
      </Section>

      {outcome && (
        <div className="border-b border-hairline bg-primary/10 px-3 py-3">
          <div className="label-tech text-primary">Field decided</div>
          <div className="mt-1 text-[13px] font-semibold tracking-wide text-foreground">
            {outcome.winnerId.toUpperCase()} WINS
          </div>
          <div className="text-[10px] uppercase tracking-label text-muted-foreground">
            {outcome.reason === "objectives"
              ? "holds every objective"
              : outcome.reason === "destroyed"
                ? `${outcome.loserId} destroyed`
                : `${outcome.loserId} combat ineffective`}
            {" · "}T{outcome.tick}
          </div>
        </div>
      )}

      <Section title="Objectives">
        <div className="grid grid-cols-3 gap-1">
          {objectives.map((o) => (
            <div
              key={o.id}
              className="flex flex-col items-center border border-hairline bg-card py-1.5"
              title={o.name}
            >
              <span
                className="text-[14px] font-bold"
                style={{ color: o.holder ? factionInk[o.holder] : "#5A5A5A" }}
              >
                {o.id}
              </span>
              <span className="text-[9px] uppercase tracking-label text-muted-foreground">
                {o.contested ? "CONTEST" : o.holder ? factionLabels[o.holder] : "OPEN"}
              </span>
              {o.progress > 0 && (
                <div className="mt-1 h-[2px] w-4/5 bg-hairline">
                  <div className="h-full bg-primary" style={{ width: `${o.progress * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
        {objectives.length > 0 && (
          <div className="flex justify-between text-[10px] uppercase tracking-label text-muted-foreground numeric">
            {Object.values(PlatoonFaction).map((f) => (
              <span key={f}>
                {factionLabels[f]} {tallyHeld(objectives)[f]}/{objectives.length}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Order of Battle">
        <div className="flex flex-col gap-1">
          {Object.values(PlatoonFaction).map((faction) => {
            const { alive, total } = strength(faction);
            const spent = total > 0 && alive === 0;

            return (
              <div
                key={faction}
                className="flex items-center justify-between border border-hairline bg-card px-2 py-1.5"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 border"
                    style={{
                      borderColor: factionInk[faction],
                      transform:
                        faction === PlatoonFaction.BEAR
                          ? "rotate(45deg)"
                          : undefined,
                    }}
                  />
                  <span className="text-[12px] tracking-wide text-foreground">
                    {factionLabels[faction]}
                  </span>
                </span>
                <span
                  className={cn(
                    "numeric text-[12px]",
                    spent ? "text-muted-foreground line-through" : "text-foreground"
                  )}
                >
                  {alive}/{total}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      <section className="flex min-h-0 flex-1 flex-col gap-2 px-3 py-3">
        <h2 className="label-tech">
          Engagements{" "}
          {events.length > 0 && (
            <span className="text-muted-foreground/70">({events.length})</span>
          )}
        </h2>

        {events.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No contact.</p>
        ) : (
          <ScrollArea className="min-h-0 flex-1 -mx-1 px-1">
            <ol className="flex flex-col-reverse gap-px">
              {events.map((event, index) => {
                const killed = event.type === "kia";

                return (
                  <li
                    key={`${event.tick}-${index}`}
                    data-kind={event.type}
                    className={cn(
                      "flex gap-1.5 border-l-2 py-1 pl-2 pr-1 text-[11px] leading-snug",
                      killed
                        ? "border-l-destructive bg-destructive/15 text-foreground"
                        : event.type === "dry"
                          ? "border-l-primary/70 bg-card/60 text-muted-foreground"
                          : "border-l-hairline bg-card/60 text-muted-foreground"
                    )}
                  >
                    {killed && (
                      <Skull
                        aria-hidden
                        className="mt-[2px] h-3 w-3 shrink-0 text-destructive"
                      />
                    )}
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "numeric mr-1.5",
                          killed
                            ? "text-destructive"
                            : "text-muted-foreground/60"
                        )}
                      >
                        T{event.tick}
                      </span>
                      {event.message}
                    </span>
                  </li>
                );
              })}
            </ol>
          </ScrollArea>
        )}
      </section>
    </div>
  );
};

export default GameControls;
