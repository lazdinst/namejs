import React from "react";
import { LinksContainer } from "./Links.styles";
import { LinksProps } from "./Links.types";

const Links: React.FC<LinksProps> = ({ links }) => (
  <LinksContainer>
    {links.map((link) => (
      <a key={link.label} href={link.href}>
        {link.label}
      </a>
    ))}
  </LinksContainer>
);

export default Links;
