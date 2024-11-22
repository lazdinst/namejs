// client/src/styled/theme/dark/darkColors.ts
import { Colors } from "../types/colors"; // Import the Colors interface
import { sharedColors } from "../shared/colors";

const neutrals = {
  0: "#ffffff", // White (unchanged)
  50: "#e5e5e5", // Very light gray
  100: "#c8c8c8", // Light gray
  200: "#a0a0a0", // Medium-light gray
  300: "#7a7a7a", // Medium gray
  400: "#5a5a5a", // Neutral gray
  500: "#444444", // Medium-dark gray
  600: "#303030", // Dark gray
  700: "#1f1f1f", // Very dark gray
  800: "#151515", // Almost black
  900: "#0c0c0c", // Near pitch black
  950: "#000000", // Black
};

// Define the dark color theme
const darkColors: Colors = {
  // Theme-Specific Neutrals
  neutrals,

  // Theme-Specific Colors
  primary: "#007bff", // Dark theme-specific primary color
  secondary: "#6c757d", // Dark theme-specific secondary color
  success: sharedColors.status.success, // Dark theme-specific success color
  warning: sharedColors.status.warning, // Dark theme-specific warning color
  error: sharedColors.status.error, // Dark theme-specific error color
  accent: sharedColors.accent, // Dark theme-specific accent color

  // Surfaces
  surfaces: {
    background: neutrals[950], // General background
    panel: neutrals[900], // Panel background
    card: neutrals[800], // Card background
    header: neutrals[800], // Header background
    footer: neutrals[800], // Footer background
    modal: neutrals[900], // Modal background
    overlay: "rgba(0, 0, 0, 0.5)", // Overlay for modals/dialogs
    toolbar: neutrals[900], // Toolbar background
    sidebar: neutrals[800], // Sidebar background
  },

  // Text Colors
  text: {
    primary: neutrals[0], // Primary text color (white)
    secondary: neutrals[100], // Secondary text color
    muted: neutrals[500], // Muted text
    inverted: neutrals[950], // Inverted text for contrast
    placeholder: neutrals[600], // Input placeholder text
    hover: neutrals[50], // Text color on hover
    active: neutrals[100], // Text color on active
  },

  // Borders
  border: neutrals[900], // General border color
};

export default darkColors;
