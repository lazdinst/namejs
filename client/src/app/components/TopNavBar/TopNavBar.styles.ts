import styled from 'styled-components';

export const NavBarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 20px;
  background-color: ${({ theme }) => theme.components.navigationBar.background};
  color: ${({ theme }) => theme.components.navigationBar.text};
`;
