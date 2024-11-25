import { Link } from "./Links/Links.types";

export interface TopNavBarProps {
  appName: string;
  logoSrc: string;
  links: Link[];
  avatarUrl: string;
  onAvatarClick: () => void;
}
