export interface StatusMessagePayloadType {
  state: string;
  state_code: number;
  robot: RobotStatus;
}

export interface RobotStatus {
  robot_connected: boolean;
  cs_safe: boolean;
  payload_confirmed: boolean;
  mgt_active: boolean;
  mgt_free_hand: boolean;
  mgt_mode: number;
  mgt_weight: number;
  execution_mode: number;
  override: boolean;
  dry_cycle: boolean;
  active_mission: string;
}

export interface StatusMessageType {
  type: "status";
  message?: string;
  payload: StatusMessagePayloadType;
}

export interface IOMessageType {
  type: "io";
  message?: string;
  payload: string;
}
