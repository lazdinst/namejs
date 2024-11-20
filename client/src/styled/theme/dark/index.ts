import { DefaultTheme } from "styled-components";
import darkColors from "./colors";
import darkComponentStyles from "./components";
import typography from "../shared/typography";
import spacing from "../shared/spacing";

const darkTheme: DefaultTheme = {
  colors: darkColors,
  components: darkComponentStyles,
  typography,
  spacing,
};

export default darkTheme;
