import styled from "styled-components";

export const LogoContainer = styled.div`
  display: flex;
  align-items: center;

  img {
    height: 40px;
    margin-right: 10px;
    filter: invert();
  }

  h1 {
    font-size: 18px;
    color: ${({ theme }) => theme.components.navigationBar.text};
    margin: 0;
  }
`;
