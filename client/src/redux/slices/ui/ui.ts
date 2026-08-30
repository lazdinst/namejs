import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UIState } from "./types";

const initialState: UIState = {
  selectedUnitId: null,
  focusNonce: 0,
  followSelection: false,
  rightPanelOpen: false,
};

export const ui = createSlice({
  name: "ui",
  initialState,
  reducers: {
    /** Highlight a unit without moving the map — e.g. a click on the map. */
    setSelectedUnit: (state, action: PayloadAction<string | null>) => {
      state.selectedUnitId = action.payload;
    },
    /** Highlight a unit AND ask the map to re-centre on it. */
    focusUnit: (state, action: PayloadAction<string>) => {
      state.selectedUnitId = action.payload;
      state.focusNonce += 1;
    },
    toggleFollowSelection: (state) => {
      state.followSelection = !state.followSelection;
    },
    toggleRightPanel: (state) => {
      state.rightPanelOpen = !state.rightPanelOpen;
    },
  },
});

export const {
  setSelectedUnit,
  focusUnit,
  toggleFollowSelection,
  toggleRightPanel,
} = ui.actions;

export default ui.reducer;
