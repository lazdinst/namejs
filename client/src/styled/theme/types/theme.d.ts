// client/src/styled/theme/types/theme.d.ts
import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      success: string;
      warning: string;
      error: string;
      accent: string;
      background: string; // Theme-specific
      textPrimary: string; // Theme-specific
      border: string; // Theme-specific
      surfaces: {
        // Theme-specific
        background: string;
        card: string;
        panel: string;
      };
    };
    components: {
      button: {
        primary: {
          background: string;
          text: string;
          border: string;
        };
        secondary: {
          background: string;
          text: string;
          border: string;
        };
      };
      card: {
        background: string;
        text: string;
        border: string;
      };
      tooltip: {
        background: string;
        text: string;
      };
      scrollbar: {
        thumb: string;
        track: string;
      };
    };
    typography: {
      fontSizeSmall: string;
      fontSizeMedium: string;
      fontSizeLarge: string;
      lineHeightSmall: string;
      lineHeightMedium: string;
      lineHeightLarge: string;
      fontFamily: string;
    };
    spacing: {
      unit: number;
      small: string;
      medium: string;
      large: string;
      extraLarge: string;
      gap: string;
    };
  }
}
