// client/src/styled/theme/dark/components.ts

import darkColors from "./colors";
import { DefaultTheme } from "styled-components";

const darkComponentStyles: DefaultTheme["components"] = {
  navigationBar: {
    background: darkColors.surfaces.toolbar,
    text: darkColors.text.primary,
    border: darkColors.border,
    hover: darkColors.text.hover,
    active: darkColors.text.active,
    accent: darkColors.accent,
  },
  panel: {
    background: darkColors.surfaces.panel,
    border: darkColors.border,
    text: darkColors.text.primary,
    shadow: "0 0 10px 2px rgba(0, 0, 0, 0.2)",
  },
  button: {
    primary: {
      background: darkColors.primary,
      text: darkColors.text.primary,
      border: darkColors.border,
      hover: darkColors.text.hover,
    },
    secondary: {
      background: darkColors.secondary,
      text: darkColors.text.secondary,
      border: darkColors.border,
      hover: darkColors.text.hover,
    },
  },
  card: {
    background: darkColors.surfaces.card,
    text: darkColors.text.primary,
    border: darkColors.border,
  },
  tooltip: {
    background: darkColors.surfaces.overlay,
    text: darkColors.text.primary,
  },
  scrollbar: {
    thumb: darkColors.neutrals[700],
    track: darkColors.neutrals[900],
  },
};

export default darkComponentStyles;
