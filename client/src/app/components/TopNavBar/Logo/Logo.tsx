import React from 'react';
import { LogoContainer } from './Logo.styles';
import { LogoProps } from './Logo.types';

const Logo: React.FC<LogoProps> = ({ appName, logoSrc }) => (
  <LogoContainer>
    <img src={logoSrc} alt="${appName} Logo" />
    <h1>{appName}</h1>
  </LogoContainer>
);

export default Logo;
