import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PlatoonType, PlatoonFaction } from "shared";

interface PlatoonsState {
  platoons: PlatoonType[];
  selectedFaction: PlatoonFaction | null;
  selectedPlatoon: PlatoonType | null;
}

const initialState: PlatoonsState = {
  platoons: [],
  selectedFaction: null,
  selectedPlatoon: null,
};

const platoonsSlice = createSlice({
  name: "platoons",
  initialState,
  reducers: {
    setPlatoons: (state, action: PayloadAction<PlatoonType[]>) => {
      state.platoons = action.payload;
    },
    setFaction: (state, action: PayloadAction<PlatoonFaction>) => {
      state.selectedFaction = action.payload;
      state.selectedPlatoon =
        state.platoons.find((platoon) => platoon.faction === action.payload) ||
        null;
    },
    setSelectedPlatoon: (state, action: PayloadAction<PlatoonType>) => {
      state.selectedPlatoon = action.payload;
    },
  },
});

export const { setPlatoons, setFaction } = platoonsSlice.actions;

export default platoonsSlice.reducer;
