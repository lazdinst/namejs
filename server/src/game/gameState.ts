import { GameState } from '../types/game';

export const gameState: GameState = {
  platoons: [
    {
      id: 'platoon1',
      units: [
        { id: 'unit1', position: [57.1, 26.8], health: 100, status: 'idle' },
        { id: 'unit2', position: [57.1, 26.9], health: 100, status: 'idle' },
      ],
      strategy: 'defensive',
    },
    {
      id: 'platoon2',
      units: [
        { id: 'unit3', position: [57.2, 27.0], health: 100, status: 'idle' },
        { id: 'unit4', position: [57.3, 27.1], health: 100, status: 'idle' },
      ],
      strategy: 'aggressive',
    },
  ],
};

export const getGameState = (): GameState => gameState;
