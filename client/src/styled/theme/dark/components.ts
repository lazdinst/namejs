import darkColors from "./colors";
import { DefaultTheme } from "styled-components";

const darkComponentStyles: DefaultTheme["components"] = {
  button: {
    primary: {
      background: darkColors.primary,
      text: darkColors.text,
      border: darkColors.border,
    },
    secondary: {
      background: darkColors.secondary,
      text: darkColors.text,
      border: darkColors.secondary,
    },
  },
  card: {
    background: darkColors.background,
    text: darkColors.text,
    border: darkColors.border,
  },
  tooltip: {
    background: "#000000",
    text: darkColors.text,
  },
  scrollbar: {
    thumb: "#888888", // TODO: UPDATE this color to be from the colors object
    track: "rgba(0, 0, 0, 0)", // TODO: UPDATE this color to be from the colors object
  },
};

export default darkComponentStyles;
