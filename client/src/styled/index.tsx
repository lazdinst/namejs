import React, { ReactNode } from "react";
import { useSelector } from "react-redux";
import styled, {
  ThemeProvider as StyledThemeProvider,
} from "styled-components";
import { darkTheme } from "./theme";
import { ThemeModeState } from "../redux/slices/theme";
import GlobalStyle from "./theme/shared/global";

const AppWrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  position: fixed;
  background-color: ${(props) => props.theme.colors.surfaces.background};
  color: ${(props) => props.theme.colors.text.primary};
`;

export const ThemeContext = React.createContext<
  | {
      theme: typeof darkTheme;
    }
  | undefined
>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const mode = useSelector(
    (state: { theme: ThemeModeState }) => state.theme.mode
  );
  let selectedTheme = darkTheme;

  switch (mode) {
    default:
      selectedTheme = darkTheme;
  }

  return (
    <ThemeContext.Provider value={{ theme: selectedTheme }}>
      <StyledThemeProvider theme={selectedTheme}>
        <GlobalStyle />
        <AppWrapper>{children}</AppWrapper>
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export { darkTheme as defaultTheme };
