import styled from "styled-components";

export const LogoContainer = styled.div`
  display: flex;
  align-items: center;

  img {
    height: 32px;
    margin-right: 10px;
    filter: invert();
  }

  h1 {
    font-size: ${({ theme }) => theme.typography.fontSize.medium};
    color: ${({ theme }) => theme.components.navigationBar.text};
    margin: 0;
  }
`;
