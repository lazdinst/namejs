import { createSlice } from "@reduxjs/toolkit";
import { SettingsState } from "./types";
import { UI_STORAGE_KEY } from "../../utils";

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
      localStorage.removeItem(UI_STORAGE_KEY);
    },
  },
});

export const { toggleCacheUIState, clearUICache } = settings.actions;

export default settings.reducer;
