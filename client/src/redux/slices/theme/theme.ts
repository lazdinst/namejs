import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ThemeModeState, ThemeMode } from "./types";

const initialState: ThemeModeState = {
  mode: "dark",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      localStorage.setItem("theme", action.payload);
    },
    toggleThemeMode: (state) => {
      const themeModes: ThemeMode[] = ["dark"];
      const currentIndex = themeModes.indexOf(state.mode);
      state.mode = themeModes[(currentIndex + 1) % themeModes.length];
      localStorage.setItem("theme", JSON.stringify(state));
    },
  },
  extraReducers: (builder) => {
    builder.addDefaultCase((state) => state);
  },
});

export type { ThemeModeState };
export const { setThemeMode, toggleThemeMode } = themeSlice.actions;
export const selectThemeMode = (state: { theme: ThemeModeState }) =>
  state.theme.mode;
export default themeSlice.reducer;
