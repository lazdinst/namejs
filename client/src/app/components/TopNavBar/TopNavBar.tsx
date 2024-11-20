import React, { useState } from "react";
import {
  NavBarContainer,
  LogoContainer,
  LinksContainer,
  SearchBar,
  UserMenu,
} from "./TopNavBar.styles";
import { TopNavBarProps } from "./TopNavBar.types";

const TopNavBar: React.FC<TopNavBarProps> = ({ appName, links, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <NavBarContainer>
      {/* Logo */}
      <LogoContainer>
        <img src="/logo.png" alt="App Logo" />
        <h1>{appName}</h1>
      </LogoContainer>

      {/* Navigation Links */}
      <LinksContainer>
        {links.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
      </LinksContainer>

      {/* Search Bar */}
      <SearchBar
        type="text"
        placeholder="Search by name or ID"
        value={searchQuery}
        onChange={handleSearch}
      />

      {/* User Menu */}
      <UserMenu>
        <img src="/user-avatar.png" alt="User Avatar" />
      </UserMenu>
    </NavBarContainer>
  );
};

export default TopNavBar;
