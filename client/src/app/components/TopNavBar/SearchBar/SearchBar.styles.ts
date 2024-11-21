import styled from 'styled-components';

export const StyledSearchBar = styled.input`
  background-color: ${({ theme }) => theme.components.navigationBar.background};
  border: none;
  border-radius: 4px;
  color: ${({ theme }) => theme.components.navigationBar.text};
  padding: 8px 12px;
  width: 250px;

  &::placeholder {
    color: ${({ theme }) => theme.components.navigationBar.hover};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.components.navigationBar.accent};
  }
`;
