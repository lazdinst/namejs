import styled from "styled-components";

export const NavBarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  padding: 0 ${({ theme }) => theme.spacing.small};
  background-color: ${({ theme }) => theme.components.navigationBar.background};
  color: ${({ theme }) => theme.components.navigationBar.text};
`;

export const NavRightSection = styled.div`
  display: flex;
  align-items: center;
`;

export const NavLeftSection = styled.div`
  display: flex;
  align-items: center;
`;
