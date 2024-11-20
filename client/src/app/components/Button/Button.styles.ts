import styled, { css } from "styled-components";

const sizeStyles = {
  small: css`
    padding: 4px 8px;
    font-size: 12px;
  `,
  medium: css`
    padding: 8px 16px;
    font-size: 14px;
  `,
  large: css`
    padding: 12px 24px;
    font-size: 16px;
  `,
};

const variantStyles = {
  primary: css`
    background-color: #007bff;
    color: white;
    &:hover {
      background-color: #0056b3;
    }
  `,
  secondary: css`
    background-color: #6c757d;
    color: white;
    &:hover {
      background-color: #565e64;
    }
  `,
  danger: css`
    background-color: #dc3545;
    color: white;
    &:hover {
      background-color: #b02a37;
    }
  `,
};

export const StyledButton = styled.button<{
  size: "small" | "medium" | "large";
  variant: "primary" | "secondary" | "danger";
}>`
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  ${({ size }) => sizeStyles[size]};
  ${({ variant }) => variantStyles[variant]};

  &:disabled {
    background-color: #d6d6d6;
    color: #a1a1a1;
    cursor: not-allowed;
  }
`;
