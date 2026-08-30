import React from "react";
import { SoldierCard, WeaponType, Loadout, Mos, mosDefinitions, loadoutLimits } from "shared";
import { cn } from "@/lib/utils";

export const weaponLabel: Record<WeaponType, string> = {
  [WeaponType.AssaultRifle]: "M4",
  [WeaponType.LightMachineGun]: "M249",
  [WeaponType.GrenadeLauncher]: "M320",
  [WeaponType.SniperRifle]: "MK12",
  [WeaponType.Pistol]: "M17",
  [WeaponType.SMG]: "MP7",
};

/** Six bars, one per attribute. Reads at a glance; digits on hover. */
export const StatBars: React.FC<{ soldier: SoldierCard; tall?: boolean }> = ({ soldier, tall }) => {
  const a = soldier.attributes;
  const stats: [string, number][] = [
    ["MKS", a.marksmanship], ["CMP", a.composure], ["FIT", a.fitness],
    ["AWR", a.awareness], ["MED", a.medicine], ["LDR", a.leadership],
  ];
  return (
    <div className="grid grid-cols-6 gap-[3px]">
      {stats.map(([label, value]) => (
        <div key={label} className="flex flex-col items-center gap-[2px]" title={`${label} ${value}`}>
          <div className={cn("flex w-full items-end bg-hairline/60", tall ? "h-[34px]" : "h-[22px]")}>
            <div
              className={cn("w-full", value >= 8 ? "bg-foreground" : value >= 5 ? "bg-muted-foreground" : "bg-muted-foreground/40")}
              style={{ height: `${value * 10}%` }}
            />
          </div>
          <span className="text-[8px] tracking-wider text-muted-foreground/70">{label}</span>
        </div>
      ))}
    </div>
  );
};

export const Stepper: React.FC<{ label: string; value: number; max: number; onChange: (v: number) => void }> = ({
  label, value, max, onChange,
}) => (
  <div className="flex items-center justify-between text-[11px]">
    <span className="text-muted-foreground">{label}</span>
    <span className="flex items-center gap-1">
      <button type="button" className="h-5 w-5 border border-hairline text-muted-foreground hover:text-foreground disabled:opacity-30"
        onClick={() => onChange(value - 1)} disabled={value <= 0}>−</button>
      <span className="numeric w-5 text-center text-foreground">{value}</span>
      <button type="button" className="h-5 w-5 border border-hairline text-muted-foreground hover:text-foreground disabled:opacity-30"
        onClick={() => onChange(value + 1)} disabled={value >= max}>+</button>
    </span>
  </div>
);

/** The kit editor for one man. */
export const LoadoutEditor: React.FC<{ mos: Mos; loadout: Loadout; onChange: (l: Loadout) => void }> = ({
  mos, loadout, onChange,
}) => {
  const def = mosDefinitions[mos];
  const set = (patch: Partial<Loadout>) => onChange({ ...loadout, ...patch });
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {def.allowedPrimaries.map((w) => (
          <button key={w} type="button" onClick={() => set({ primaryWeapon: w })}
            className={cn("flex-1 border px-1 py-0.5 text-[10px] tracking-wider",
              loadout.primaryWeapon === w ? "border-primary/70 text-foreground" : "border-hairline text-muted-foreground hover:text-foreground")}>
            {weaponLabel[w]}
          </button>
        ))}
      </div>
      <Stepper label="Primary mags" value={loadout.primaryMagazines} max={loadoutLimits.maxPrimaryMagazines} onChange={(v) => set({ primaryMagazines: v })} />
      <Stepper label="Sidearm mags" value={loadout.secondaryMagazines} max={loadoutLimits.maxSecondaryMagazines} onChange={(v) => set({ secondaryMagazines: v })} />
      <Stepper label="Frag" value={loadout.fragGrenades} max={loadoutLimits.maxFrag} onChange={(v) => set({ fragGrenades: v })} />
      <Stepper label="Smoke" value={loadout.smokeGrenades} max={loadoutLimits.maxSmoke} onChange={(v) => set({ smokeGrenades: v })} />
      <Stepper label="Bandages" value={loadout.bandages} max={loadoutLimits.maxBandages} onChange={(v) => set({ bandages: v })} />
      <Stepper label="Tourniquets" value={loadout.tourniquets} max={loadoutLimits.maxTourniquets} onChange={(v) => set({ tourniquets: v })} />
    </div>
  );
};
