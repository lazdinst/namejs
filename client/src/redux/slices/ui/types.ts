export interface UIState {
  /** Unit highlighted in the roster panel, if any. */
  selectedUnitId: string | null;
  /**
   * Bumped each time the roster asks the map to re-centre on the selected
   * unit. A counter, not a flag, so picking the same unit twice pans twice.
   */
  focusNonce: number;
  /** Whether the map keeps the selected platoon centred as it moves. */
  followSelection: boolean;
  /** The ops drawer on the right edge. Starts collapsed. */
  rightPanelOpen: boolean;
}
