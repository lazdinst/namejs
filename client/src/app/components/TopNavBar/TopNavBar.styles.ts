import styled from "styled-components";

export const NavBarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  background-color: #1e1e2f;
  color: white;
`;

export const LogoContainer = styled.div`
  display: flex;
  align-items: center;

  img {
    height: 40px;
    margin-right: 10px;
  }

  h1 {
    font-size: 18px;
    margin: 0;
  }
`;

export const LinksContainer = styled.div`
  display: flex;
  gap: 20px;

  a {
    text-decoration: none;
    color: white;
    font-size: 16px;
    font-weight: 500;

    &:hover {
      color: #00bcd4;
    }
  }
`;

export const SearchBar = styled.input`
  background-color: #2c2c3a;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 8px 12px;
  width: 250px;

  &::placeholder {
    color: #a9a9a9;
  }

  &:focus {
    outline: 2px solid #00bcd4;
  }
`;

export const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  img {
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
  }
`;
