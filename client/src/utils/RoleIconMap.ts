import RoleIconGrenadier from "../assets/Icon_Grenadier_kit.svg?react";
import RoleIconLightMachineGunner from "../assets/Icon_Machine_Gunner_kit.svg?react";
import RoleIconRecon from "../assets/Icon_Marksman_kit.svg?react";
import RoleIconRifleman from "../assets/Icon_Rifleman_kit.svg?react";
import RoleIconSquadLeader from "../assets/Icon_Squad_Leader_kit.svg?react";

import { Role } from "shared";

export const RoleIconMap: Record<
  Role,
  React.FunctionComponent<React.SVGProps<SVGSVGElement>>
> = {
  [Role.SquadLeader]: RoleIconSquadLeader,
  [Role.Rifleman]: RoleIconRifleman,
  [Role.LightMachineGunner]: RoleIconLightMachineGunner,
  [Role.Grenadier]: RoleIconGrenadier,
  [Role.Recon]: RoleIconRecon,
};
