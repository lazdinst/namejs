import React from "react";
import {
  NavBarContainer,
  NavRightSection,
  NavLeftSection,
} from "./TopNavBar.styles";
import { TopNavBarProps } from "./TopNavBar.types";
import Logo from "./Logo";
import Links from "./Links";
import UserMenu from "./UserMenu";

const TopNavBar: React.FC<TopNavBarProps> = ({
  appName,
  logoSrc,
  links,
  avatarUrl,
  onAvatarClick,
}) => (
  <NavBarContainer>
    <NavLeftSection>
      <Logo appName={appName} logoSrc={logoSrc} />
      <Links links={links} />
    </NavLeftSection>
    <NavRightSection>
      <UserMenu avatarUrl={avatarUrl} onAvatarClick={onAvatarClick} />
    </NavRightSection>
  </NavBarContainer>
);

export default TopNavBar;
