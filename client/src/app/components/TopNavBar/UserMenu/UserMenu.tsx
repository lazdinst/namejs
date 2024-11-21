import React from 'react';
import { UserMenuContainer, Avatar } from './UserMenu.styles';
import { UserMenuProps } from './UserMenu.types';

const UserMenu: React.FC<UserMenuProps> = ({ avatarUrl, onAvatarClick }) => (
  <UserMenuContainer>
    <Avatar src={avatarUrl} alt="User Avatar" onClick={onAvatarClick} />
  </UserMenuContainer>
);

export default UserMenu;
