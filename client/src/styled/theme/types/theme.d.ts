// client/src/styled/theme/types/theme.d.ts
import "styled-components";
import { Components } from "./components";
import { Typography } from "./typography";
import { Spacing } from "./spacing";
import { Colors } from "./colors";
declare module "styled-components" {
  export interface DefaultTheme {
    colors: Colors;
    components: Components;
    typography: Typography;
    spacing: Spacing;
  }
}
