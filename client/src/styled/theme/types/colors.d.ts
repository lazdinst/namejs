// client/src/styled/theme/types/colors.d.ts
export interface SharedColors {
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  accent: string;
}
export interface Colors {
  // Semantic Colors
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  accent: string;

  // Borders
  border: string;

  // Surfaces
  surfaces: {
    background: string;
    panel: string;
    card: string;
    header: string;
    footer: string;
    modal: string;
    overlay: string;
    toolbar: string;
    sidebar: string;
  };

  // Text Colors
  text: {
    primary: string;
    secondary: string;
    muted: string;
    placeholder: string;
    hover: string;
    active: string;
    inverted: string;
  };

  // Neutrals (Theme-specific)
  neutrals: {
    [key: number]: string;
  };
}
