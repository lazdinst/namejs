import styled from 'styled-components';

export const LinksContainer = styled.div`
  display: flex;
  gap: 20px;

  a {
    text-decoration: none;
    color: ${({ theme }) => theme.components.navigationBar.text};
    font-size: 16px;
    font-weight: 500;

    &:hover {
      color: ${({ theme }) => theme.components.navigationBar.hover};
    }
  }
`;
