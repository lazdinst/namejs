import React from 'react';
import { NavBarContainer } from './TopNavBar.styles';
import { TopNavBarProps } from './TopNavBar.types';
import Logo from './Logo';
import Links from './Links';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';

const TopNavBar: React.FC<TopNavBarProps> = ({
  appName,
  logoSrc,
  links,
  onSearch,
  avatarUrl,
  onAvatarClick,
}) => (
  <NavBarContainer>
    <Logo appName={appName} logoSrc={logoSrc} />
    <Links links={links} />
    <SearchBar onSearch={onSearch} />
    <UserMenu avatarUrl={avatarUrl} onAvatarClick={onAvatarClick} />
  </NavBarContainer>
);

export default TopNavBar;
