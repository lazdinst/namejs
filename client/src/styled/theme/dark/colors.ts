// client/src/styled/theme/dark/darkColors.ts
import { Colors } from "../types/colors"; // Import the Colors interface
import { sharedColors } from "../shared/colors";

// Define theme-specific neutrals
const neutrals = {
  0: "#ffffff", // White
  50: "#f8f9fa", // Lightest gray
  100: "#f1f3f5", // Very light gray
  200: "#e9ecef", // Light gray
  300: "#dee2e6", // Medium light gray
  400: "#ced4da", // Medium gray
  500: "#adb5bd", // Neutral gray
  600: "#868e96", // Medium dark gray
  700: "#495057", // Dark gray
  800: "#343a40", // Very dark gray
  900: "#212529", // Darker gray
  950: "#121212", // Almost black
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
    toolbar: neutrals[800], // Toolbar background
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
  border: neutrals[700], // General border color
};

export default darkColors;
