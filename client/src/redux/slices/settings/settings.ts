import { createSlice } from "@reduxjs/toolkit";
import { SettingsState } from "./types";

const initialState: SettingsState = {
  cacheUIState: true,
  messages: [],
};

const settings = createSlice({
  name: "settings",
  initialState,
  reducers: {
    toggleCacheUIState: (state) => {
      state.cacheUIState = !state.cacheUIState;
    },
    clearUICache: () => {
      localStorage.removeItem("ui");
    },
  },
});

export const { toggleCacheUIState, clearUICache } = settings.actions;

export default settings.reducer;
