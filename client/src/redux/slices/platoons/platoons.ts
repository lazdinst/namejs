import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PlatoonType, PlatoonFaction } from "shared";

interface PlatoonsState {
  platoons: PlatoonType[];
  selectedFaction: PlatoonFaction | null;
}

const initialState: PlatoonsState = {
  platoons: [],
  selectedFaction: null,
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
    },
  },
});

export const { setPlatoons, setFaction } = platoonsSlice.actions;

export default platoonsSlice.reducer;
