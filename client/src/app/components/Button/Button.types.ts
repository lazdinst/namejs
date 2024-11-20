import { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
}
