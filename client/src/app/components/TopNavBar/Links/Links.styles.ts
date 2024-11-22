import styled from "styled-components";

export const LinksContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-left: 16px;
  a {
    text-decoration: none;
    color: ${({ theme }) => theme.components.navigationBar.text};
    font-size: ${({ theme }) => theme.typography.fontSize.small};
    font-weight: 500;

    &:hover {
      color: ${({ theme }) => theme.components.navigationBar.hover};
    }
  }
  &:hover {
    cursor: pointer;
  }
`;
