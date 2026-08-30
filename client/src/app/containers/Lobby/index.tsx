import React, { useEffect, useMemo, useState } from "react";
import {
  PlatoonFaction, Mos, Loadout, allMos, mosDefinitions, loadoutWeightKg,
  validateElement, PlatoonStrategy, factionsOpen, ELEMENT_MAX_SIZE, LobbyPlayer,
} from "shared";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { fetchRoster } from "../../../redux/slices/game";
import {
  joinLobby, leaveLobby, pickSoldier, unpickSoldier, setSoldierLoadout,
  nameElement, readyUp, selectMe, resetLobby, chooseLanding, rematch,
  setPendingLandingZone,
} from "../../../redux/slices/lobby";
import { factionLabels, factionInk } from "../../Map/factions";
import Mark from "../../components/Mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatBars, LoadoutEditor } from "./widgets";

// ---------------------------------------------------------------- chrome

const Frame: React.FC<{ title: string; sub?: string; children: React.ReactNode; wide?: boolean }> = ({
  title, sub, children, wide,
}) => (
  <div className="flex h-screen w-screen flex-col items-center overflow-y-auto bg-background px-6 py-10">
    <div className="flex items-center gap-3">
      <Mark size={28} />
      <span className="text-[13px] font-bold tracking-label text-foreground">NAMEJS</span>
    </div>
    <h1 className="mt-6 text-[20px] font-semibold tracking-wide text-foreground">{title}</h1>
    {sub && <p className="label-tech mt-1">{sub}</p>}
    <div className={cn("mt-8 w-full", wide ? "max-w-[1100px]" : "max-w-[520px]")}>{children}</div>
  </div>
);

const FactionSwatch: React.FC<{ faction: PlatoonFaction }> = ({ faction }) => (
  <span className="inline-block h-2 w-2 border"
    style={{ borderColor: factionInk[faction], transform: faction === PlatoonFaction.BEAR ? "rotate(45deg)" : undefined }} />
);

const Seat: React.FC<{ player: LobbyPlayer | undefined; faction: PlatoonFaction; me: boolean }> = ({ player, faction, me }) => (
  <div className={cn("flex items-center justify-between border px-3 py-2",
    player ? "border-hairline bg-card" : "border-dashed border-hairline/60")}>
    <span className="flex items-center gap-2 text-[12px] text-foreground">
      <FactionSwatch faction={faction} />{factionLabels[faction]}
    </span>
    <span className="label-tech">
      {player ? (me ? "YOU" : "SEATED") : "OPEN"}
      {player?.ready && " · READY"}
    </span>
  </div>
);

// ------------------------------------------------------------------ join

const Join: React.FC = () => {
  const dispatch = useAppDispatch();
  const { lobby, busy, error } = useAppSelector((s) => s.lobby);
  const me = useAppSelector(selectMe);
  const open = factionsOpen(lobby.players);

  return (
    <Frame title="Join a match" sub={me ? "Waiting for an opponent" : "Pick a side"}>
      <div className="flex flex-col gap-2">
        {Object.values(PlatoonFaction).map((f) => (
          <Seat key={f} faction={f} player={lobby.players.find((p) => p.faction === f)} me={me?.faction === f} />
        ))}
      </div>

      {!me ? (
        <div className="mt-6 grid grid-cols-2 gap-2">
          {Object.values(PlatoonFaction).map((f) => (
            <Button key={f} variant="outline" disabled={busy || !open.includes(f)} onClick={() => dispatch(joinLobby(f))}>
              <FactionSwatch faction={f} /> Join {factionLabels[f]}
            </Button>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse-dim rounded-full bg-primary" />
            <span className="label-tech">The draft opens when both seats are filled</span>
          </span>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => dispatch(leaveLobby())}>Leave</Button>
        </div>
      )}
      {error && <p className="mt-3 text-[11px] text-[#B0473C]">{error}</p>}
    </Frame>
  );
};

// ----------------------------------------------------------------- draft

const useCountdown = (deadline: number | null) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);
  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
};

const Draft: React.FC = () => {
  const dispatch = useAppDispatch();
  const { lobby, busy, error } = useAppSelector((s) => s.lobby);
  const { roster, rosterLoaded } = useAppSelector((s) => s.game);
  const me = useAppSelector(selectMe);
  const [mosFilter, setMosFilter] = useState<Mos | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const seconds = useCountdown(lobby.draftDeadline);

  useEffect(() => { if (!rosterLoaded) dispatch(fetchRoster()); }, [rosterLoaded, dispatch]);

  const taken = useMemo(() => new Set(lobby.taken), [lobby.taken]);
  const available = roster.filter((s) => !taken.has(s.id) && (!mosFilter || s.mos === mosFilter));

  if (!me) {
    return (
      <Frame title="Draft in progress" sub="Both seats are taken — spectating">
        <p className="text-[12px] text-muted-foreground">The match will appear once the elements drop.</p>
      </Frame>
    );
  }

  const other = lobby.players.find((p) => p.id !== me.id);
  const problems = validateElement({
    name: me.elementName, faction: me.faction, strategy: PlatoonStrategy.AGGRESSIVE, landingZoneId: "LZ-1", slots: me.slots,
  });
  const canReady = problems.length === 0 && !me.ready && !busy;
  const setLoadout = (soldierId: string, loadout: Loadout) => dispatch(setSoldierLoadout({ soldierId, loadout }));

  return (
    <Frame title="Draft" sub={`${factionLabels[me.faction]} · pick your element`} wide>
      {/* clock */}
      <div className="mb-4 flex items-center justify-between border border-hairline bg-card px-4 py-2">
        <span className="flex items-center gap-4">
          <span className="label-tech">Draft closes in</span>
          <span className={cn("numeric text-[22px] font-semibold", seconds <= 5 ? "text-[#B0473C]" : "text-foreground")}>
            {seconds}<span className="text-[12px] text-muted-foreground">s</span>
          </span>
        </span>
        <span className="flex items-center gap-4 label-tech">
          <span>YOU {me.ready ? "· READY" : ""}</span>
          <span className="h-3 w-px bg-hairline" />
          <span>{other ? `${factionLabels[other.faction]} ${other.ready ? "· READY" : `· ${other.slots.length} PICKED`}` : ""}</span>
        </span>
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-4">
        {/* board */}
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="label-tech">Draft board</h2>
            <span className="numeric label-tech">{available.length} available</span>
          </div>
          <div className="flex flex-wrap gap-[3px]">
            <button type="button" onClick={() => setMosFilter(null)}
              className={cn("border px-1.5 py-0.5 text-[9px] tracking-wider", !mosFilter ? "border-primary/70 text-foreground" : "border-hairline text-muted-foreground")}>ALL</button>
            {allMos.map((m) => (
              <button key={m} type="button" onClick={() => setMosFilter(m)} title={mosDefinitions[m].title}
                className={cn("border px-1.5 py-0.5 text-[9px] tracking-wider", mosFilter === m ? "border-primary/70 text-foreground" : "border-hairline text-muted-foreground")}>{m}</button>
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-1.5 xl:grid-cols-3">
            {available.map((s) => {
              const def = mosDefinitions[s.mos];
              const full = me.slots.length >= ELEMENT_MAX_SIZE;
              return (
                <li key={s.id} className="border border-hairline bg-card px-2.5 py-2">
                  <div className="flex items-baseline justify-between">
                    <span className="flex items-baseline gap-2">
                      <span className="numeric text-[10px] font-semibold text-primary">{s.mos}</span>
                      <span className="text-[12px] text-foreground">{s.callsign}</span>
                    </span>
                    <span className="numeric text-[11px] text-foreground">{s.rating.toFixed(1)}<span className="text-muted-foreground/60">/10</span></span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{def.title}</p>
                  <div className="mt-1.5"><StatBars soldier={s} tall /></div>
                  <button type="button" disabled={full || me.ready || busy} onClick={() => dispatch(pickSoldier(s.id))}
                    className="mt-1.5 w-full border border-hairline py-0.5 text-[10px] uppercase tracking-label text-muted-foreground hover:border-primary/60 hover:text-foreground disabled:opacity-30">
                    {full ? "Element full" : "Pick"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* my element */}
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="label-tech">Your element</h2>
            <span className="numeric label-tech">{me.slots.length}/{ELEMENT_MAX_SIZE}</span>
          </div>
          <input defaultValue={me.elementName} disabled={me.ready}
            onBlur={(e) => e.target.value !== me.elementName && dispatch(nameElement(e.target.value))}
            className="w-full border border-hairline bg-card px-2 py-1 text-[12px] tracking-wide text-foreground focus:border-primary/60 focus:outline-none disabled:opacity-60" />

          {me.slots.length === 0 && <p className="text-[11px] text-muted-foreground">Pick men from the board.</p>}
          <ul className="flex flex-col gap-1">
            {me.slots.map((slot) => {
              const def = mosDefinitions[slot.soldier.mos];
              const kg = loadoutWeightKg(slot.soldier.mos, slot.loadout);
              const open = editing === slot.soldier.id;
              return (
                <li key={slot.soldier.id} className="border border-hairline bg-card">
                  <button type="button" onClick={() => setEditing(open ? null : slot.soldier.id)}
                    className="flex w-full items-center justify-between px-2 py-1.5 text-left">
                    <span className="flex items-baseline gap-2">
                      <span className="numeric text-[10px] font-semibold text-primary">{slot.soldier.mos}</span>
                      <span className="text-[12px] text-foreground">{slot.soldier.callsign}</span>
                    </span>
                    <span className={cn("numeric text-[10px] uppercase tracking-label", kg > def.loadCapacityKg ? "text-[#B0473C]" : "text-muted-foreground")}>
                      {kg.toFixed(1)}/{def.loadCapacityKg} KG
                    </span>
                  </button>
                  {open && !me.ready && (
                    <div className="border-t border-hairline px-2 py-2">
                      <LoadoutEditor mos={slot.soldier.mos} loadout={slot.loadout} onChange={(l) => setLoadout(slot.soldier.id, l)} />
                      <button type="button" onClick={() => { dispatch(unpickSoldier(slot.soldier.id)); setEditing(null); }}
                        className="mt-2 text-[10px] uppercase tracking-label text-muted-foreground hover:text-[#B0473C]">Release</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {problems.length > 0 && me.slots.length > 0 && !me.ready && (
            <ul>{problems.slice(0, 3).map((p, i) => <li key={i} className="text-[10px] leading-snug text-[#B0473C]">{p.message}</li>)}</ul>
          )}
          {error && <p className="text-[10px] text-[#B0473C]">{error}</p>}

          <Button variant={me.ready ? "outline" : canReady ? "default" : "outline"} disabled={!canReady} onClick={() => dispatch(readyUp())}>
            {me.ready ? "Ready — waiting on opponent" : "Ready"}
          </Button>
          <p className="text-[10px] text-muted-foreground">When the clock runs out, an unfinished element is filled from the board.</p>
        </section>
      </div>
    </Frame>
  );
};

// --------------------------------------------------------------- landing

const Landing: React.FC<{ map: React.ReactNode }> = ({ map }) => {
  const dispatch = useAppDispatch();
  const { lobby, busy, error } = useAppSelector((s) => s.lobby);
  const { landingZones, rosterLoaded } = useAppSelector((s) => s.game);
  const me = useAppSelector(selectMe);
  // The staged pick lives in the store so the map's LZ markers share it.
  const choice = useAppSelector((s) => s.lobby.pendingLandingZoneId) ?? "";
  useEffect(() => { if (!rosterLoaded) dispatch(fetchRoster()); }, [rosterLoaded, dispatch]);

  const other = lobby.players.find((p) => p.id !== me?.id);

  return (
    <div className="flex h-screen w-screen flex-col bg-background">
      <header className="flex h-9 shrink-0 items-center justify-between border-b border-hairline bg-panel px-3">
        <span className="flex items-center gap-3">
          <Mark size={18} /><span className="text-[13px] font-bold tracking-label text-foreground">NAMEJS</span>
          <span className="h-3 w-px bg-hairline" /><span className="label-tech">Choose your landing zone</span>
        </span>
        <span className="label-tech">
          {me ? `${factionLabels[me.faction]} ${me.landingZoneId ? `· ${me.landingZoneId}` : ""}` : "SPECTATING"}
          {other && <> <span className="mx-2 text-hairline">|</span> {factionLabels[other.faction]} {other.landingZoneId ? "· CHOSEN" : "· CHOOSING"}</>}
        </span>
      </header>
      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">{map}</main>
        <aside className="w-[300px] shrink-0 border-l border-hairline bg-panel px-3 py-3">
          <h2 className="label-tech">Landing zones</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">Click a zone on the map or in this list, then confirm. Your helicopter comes in from your own edge of the map.</p>
          <ul className="mt-3 flex flex-col gap-1">
            {landingZones.map((z) => (
              <li key={z.id}>
                <button type="button" disabled={!me || !!me.landingZoneId} onClick={() => dispatch(setPendingLandingZone(z.id))}
                  className={cn("flex w-full items-center justify-between border px-2 py-1.5 text-[12px]",
                    (me?.landingZoneId ?? choice) === z.id ? "border-primary/70 bg-primary/10 text-foreground" : "border-hairline bg-card text-muted-foreground hover:text-foreground",
                    "disabled:opacity-60")}>
                  <span>{z.name}</span><span className="numeric label-tech">{z.id}</span>
                </button>
              </li>
            ))}
          </ul>
          {me && !me.landingZoneId && (
            <Button className="mt-3 w-full" disabled={!choice || busy} onClick={() => dispatch(chooseLanding(choice))}>
              {choice ? `Insert at ${choice}` : "Pick a zone"}
            </Button>
          )}
          {me?.landingZoneId && (
            <p className="mt-3 flex items-center gap-2 label-tech">
              <span className="h-1.5 w-1.5 animate-pulse-dim rounded-full bg-primary" />Waiting on the other element
            </p>
          )}
          {error && <p className="mt-2 text-[10px] text-[#B0473C]">{error}</p>}
          <Button variant="ghost" size="sm" className="mt-6" onClick={() => dispatch(resetLobby())}>Abandon match</Button>
        </aside>
      </div>
    </div>
  );
};

/**
 * The field has been decided. Laid over the map with the result and the way
 * back: a new match empties both seats and reopens the lobby for everyone.
 */
const MatchOver: React.FC = () => {
  const dispatch = useAppDispatch();
  const outcome = useAppSelector((s) => s.game.outcome);
  const platoons = useAppSelector((s) => s.platoons.platoons);
  const busy = useAppSelector((s) => s.lobby.busy);
  const [watching, setWatching] = useState(false);

  // A fresh result re-arms the overlay even if the last one was dismissed.
  useEffect(() => setWatching(false), [outcome?.tick]);

  if (!outcome || watching) return null;

  const winner = platoons.find((p) => p.id === outcome.winnerId);
  const reason =
    outcome.reason === "objectives"
      ? "holds every objective"
      : outcome.reason === "destroyed"
        ? `${outcome.loserId.toUpperCase()} destroyed`
        : `${outcome.loserId.toUpperCase()} combat ineffective`;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
      <div className="w-[380px] border border-hairline bg-panel shadow-[0_12px_48px_rgba(0,0,0,0.7)]">
        <div className="border-b border-hairline px-4 py-3">
          <div className="label-tech text-primary">Field decided</div>
          <div className="mt-1 text-[18px] font-semibold tracking-wide text-foreground">
            {(winner && "name" in winner && (winner as { name?: string }).name
              ? (winner as { name?: string }).name
              : outcome.winnerId
            )?.toUpperCase()}{" "}
            WINS
          </div>
          <div className="label-tech mt-0.5">
            {reason} · T{outcome.tick}
          </div>
        </div>

        <div className="flex flex-col gap-1 px-4 py-3">
          {platoons.map((p) => {
            const alive = p.units.filter((u) => u.status !== "kia").length;
            return (
              <div key={p.id} className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-foreground">
                  <FactionSwatch faction={p.faction} />
                  {("name" in p && (p as { name?: string }).name) || p.id}
                </span>
                <span className="numeric text-muted-foreground">
                  {alive}/{p.units.length} effective
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 border-t border-hairline px-4 py-3">
          <Button className="flex-1" disabled={busy} onClick={() => dispatch(rematch())}>
            New match
          </Button>
          <Button variant="outline" onClick={() => setWatching(true)}>
            Keep watching
          </Button>
        </div>
        <p className="px-4 pb-3 text-[10px] leading-snug text-muted-foreground">
          A new match returns both players to the join screen with a fresh draft board.
        </p>
      </div>
    </div>
  );
};

/** Which screen the match is on. `map` is only mounted from landing onward. */
const Lobby: React.FC<{ map: React.ReactNode; children: React.ReactNode }> = ({ map, children }) => {
  const phase = useAppSelector((s) => s.lobby.lobby.phase);
  if (phase === "waiting") return <Join />;
  if (phase === "draft") return <Draft />;
  if (phase === "landing") return <Landing map={map} />;
  return (
    <>
      {children}
      <MatchOver />
    </>
  );
};

export default Lobby;
