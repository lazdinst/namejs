import { Link } from './Links/Links.types';

export interface TopNavBarProps {
  appName: string;
  logoSrc: string;
  links: Link[];
  onSearch: (query: string) => void;
  avatarUrl: string;
  onAvatarClick: () => void;
}
