import React, { useContext, ReactNode } from "react";
import { useSelector } from "react-redux";
import styled, {
  ThemeProvider as StyledThemeProvider,
} from "styled-components";
import { dark } from "./themes";
import { ThemeModeState } from "../redux/slices/theme";
import GlobalStyle from "./themes/global";

const AppWrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  position: fixed;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
`;

const ThemeContext = React.createContext<
  | {
      theme: typeof dark;
    }
  | undefined
>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const mode = useSelector(
    (state: { theme: ThemeModeState }) => state.theme.mode
  );
  let selectedTheme = dark;

  switch (mode) {
    default:
      selectedTheme = dark;
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

export { dark as defaultTheme };
