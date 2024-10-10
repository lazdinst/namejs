import { Unit, GameEvent } from '../types/game';

export const handleEngagement = (unit: Unit, target: Unit): GameEvent => {
  if (target.health > 0) {
    target.health -= 20; // Example damage value
    return {
      type: 'engagement',
      message: `${unit.id} engaged ${target.id}, reducing health to ${target.health}`,
    };
  } else {
    return {
      type: 'engagement',
      message: `${target.id} is already down`,
    };
  }
};
