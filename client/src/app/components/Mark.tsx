import React from "react";

/**
 * The Namejs emblem. Served from public/ rather than imported through svgr so
 * index.html can point the favicon at the same file instead of holding a
 * second copy of the artwork. It repeats what the adjacent wordmark already
 * says, so it stays out of the accessibility tree.
 */
const Mark: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className,
}) => (
  <img
    src="/namejs.svg"
    alt=""
    aria-hidden
    width={size}
    height={size}
    className={className}
  />
);

export default Mark;
