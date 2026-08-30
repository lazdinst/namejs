import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMapEvents } from "react-leaflet";
import { LatLng } from "leaflet";
import { PlatoonStrategy, strategyInfo } from "shared";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { orderElementMove, orderElementStrategy } from "../../redux/slices/game";
import { selectMe } from "../../redux/slices/lobby";
import { cn } from "@/lib/utils";

interface MenuState {
  latlng: LatLng;
  x: number;
  y: number;
}

/**
 * Right-click on the map: order your element to that point, or change its
 * posture. Rendered through a portal so Leaflet's panes cannot clip it.
 */
const MapContextMenu: React.FC = () => {
  const dispatch = useAppDispatch();
  const me = useAppSelector(selectMe);
  const platoons = useAppSelector((state) => state.platoons.platoons);
  const selectedPlatoonId = useAppSelector((state) => state.platoons.selectedPlatoonId);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [hovered, setHovered] = useState<PlatoonStrategy | null>(null);

  useMapEvents({
    contextmenu: (event) => {
      event.originalEvent.preventDefault();
      setMenu({
        latlng: event.latlng,
        x: event.originalEvent.clientX,
        y: event.originalEvent.clientY,
      });
      setHovered(null);
    },
    click: () => setMenu(null),
    dragstart: () => setMenu(null),
    zoomstart: () => setMenu(null),
  });

  useEffect(() => {
    if (!menu) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menu]);

  /** The element this player commands: their faction's in a match, else the selection. */
  const mine = useMemo(() => {
    if (me) return platoons.find((p) => p.faction === me.faction) ?? null;
    return platoons.find((p) => p.id === selectedPlatoonId) ?? platoons[0] ?? null;
  }, [me, platoons, selectedPlatoonId]);

  if (!menu || !mine) return null;

  const move = () => {
    dispatch(orderElementMove({ platoonId: mine.id, position: [menu.latlng.lat, menu.latlng.lng] }));
    setMenu(null);
  };
  const posture = (strategy: PlatoonStrategy) => {
    dispatch(orderElementStrategy({ platoonId: mine.id, strategy }));
    setMenu(null);
  };

  const info = hovered ? strategyInfo[hovered] : null;

  return createPortal(
    <div
      className="fixed z-[1000] flex items-start"
      style={{ left: Math.min(menu.x, window.innerWidth - 420), top: Math.min(menu.y, window.innerHeight - 300) }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="w-[190px] border border-hairline bg-popover shadow-[0_8px_28px_rgba(0,0,0,0.6)]">
        <div className="border-b border-hairline px-2.5 py-1.5">
          <span className="label-tech">{(mine.id === selectedPlatoonId || me) ? "" : ""}{("name" in mine && (mine as { name?: string }).name) || mine.id}</span>
        </div>

        <button
          type="button"
          onClick={move}
          className="flex w-full items-center justify-between px-2.5 py-2 text-left text-[12px] text-foreground hover:bg-accent"
        >
          Move element here
          <span className="numeric text-[9px] text-muted-foreground">
            {menu.latlng.lat.toFixed(4)}, {menu.latlng.lng.toFixed(4)}
          </span>
        </button>

        <div className="border-t border-hairline px-2.5 pb-1 pt-1.5">
          <span className="label-tech">Posture</span>
        </div>
        {Object.values(PlatoonStrategy).map((strategy) => {
          const active = mine.strategy === strategy;
          return (
            <button
              key={strategy}
              type="button"
              onMouseEnter={() => setHovered(strategy)}
              onClick={() => posture(strategy)}
              className={cn(
                "flex w-full items-center justify-between px-2.5 py-1.5 text-left text-[12px] hover:bg-accent",
                active ? "text-primary" : "text-foreground"
              )}
            >
              {strategyInfo[strategy].label}
              {active && <span className="text-[9px] uppercase tracking-label">Current</span>}
            </button>
          );
        })}
      </div>

      {/* Pros and cons of whatever posture the cursor is over. */}
      {info && (
        <div className="ml-1 w-[210px] border border-hairline bg-popover px-2.5 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.6)]">
          <p className="text-[11px] leading-snug text-muted-foreground">{info.summary}</p>
          <div className="mt-1.5 label-tech text-primary">Pros</div>
          <ul className="mt-0.5 flex flex-col gap-0.5">
            {info.pros.map((line) => (
              <li key={line} className="text-[10.5px] leading-snug text-foreground/85">+ {line}</li>
            ))}
          </ul>
          <div className="mt-1.5 label-tech text-[#B0473C]">Cons</div>
          <ul className="mt-0.5 flex flex-col gap-0.5">
            {info.cons.map((line) => (
              <li key={line} className="text-[10.5px] leading-snug text-foreground/85">− {line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>,
    document.body
  );
};

export default MapContextMenu;
