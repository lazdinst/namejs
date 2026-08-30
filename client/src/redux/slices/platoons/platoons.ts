import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PlatoonType, PlatoonFaction } from "shared";

export interface PlatoonsState {
  platoons: PlatoonType[];
  selectedFaction: PlatoonFaction | null;
  selectedPlatoonId: string | null;
}

const initialState: PlatoonsState = {
  platoons: [],
  selectedFaction: null,
  selectedPlatoonId: null,
};

const platoonsSlice = createSlice({
  name: "platoons",
  initialState,
  reducers: {
    setPlatoons: (state, action: PayloadAction<PlatoonType[]>) => {
      state.platoons = action.payload;

      // Keep the selection pointing at something that still exists.
      if (
        state.selectedPlatoonId &&
        !action.payload.some((p) => p.id === state.selectedPlatoonId)
      ) {
        state.selectedPlatoonId = null;
      }
    },
    setFaction: (state, action: PayloadAction<PlatoonFaction>) => {
      state.selectedFaction = action.payload;
      state.selectedPlatoonId =
        state.platoons.find((p) => p.faction === action.payload)?.id ?? null;
    },
    setSelectedPlatoon: (state, action: PayloadAction<string>) => {
      state.selectedPlatoonId = action.payload;
    },
  },
});

export const { setPlatoons, setFaction, setSelectedPlatoon } =
  platoonsSlice.actions;

// Resolved against the live platoon list on every read, so the panel tracks
// incoming game state instead of showing a snapshot frozen at selection time.
// Typed against just the slice it reads, so it composes with any store that
// carries a `platoons` branch rather than requiring the whole RootState.
export const selectSelectedPlatoon = (state: {
  platoons: PlatoonsState;
}): PlatoonType | null =>
  state.platoons.platoons.find(
    (p) => p.id === state.platoons.selectedPlatoonId
  ) ?? null;

export default platoonsSlice.reducer;
