export interface MoveCommandRequest {
  platoonId: string;
  newPosition: [number, number];
}

export interface ChangeStrategyRequest {
  platoonId: string;
  newStrategy: 'aggressive' | 'defensive' | 'patrol';
}
