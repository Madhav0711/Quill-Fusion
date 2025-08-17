import React, { FC } from "react";

interface DiamondIconProps {
  className?: string;
}

const DiamondIcon: FC<DiamondIconProps> = ({ className }) => {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Neon gradient for extra pop */}
        <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f7ff" />   {/* neon cyan */}
          <stop offset="100%" stopColor="#007bff" /> {/* bright electric blue */}
        </linearGradient>
      </defs>
      <path
        d="M1.84 7.18L4.77 3.22C5.33 2.45 6.23 2 7.18 2h9.64c.95 0 1.85.45 2.41 1.22l2.93 3.96c.79 1.08.78 2.55-.07 3.61l-7.75 10.1c-1.2 1.57-3.58 1.57-4.78 0L1.87 10.79c-.81-1.06-.83-2.53-.03-3.61z"
        fill="url(#diamondGradient)"
      />
      <path
        d="M22.75 9H1.25c-.01-.64.18-1.28.59-1.82L4.77 3.22C5.33 2.45 6.23 2 7.18 2h9.64c.95 0 1.85.45 2.41 1.22l2.93 3.96c.38.54.57 1.18.59 1.82z"
        fill="#4fc3f7" /* bright sky blue */
      />
    </svg>
  );
};

export default DiamondIcon;
