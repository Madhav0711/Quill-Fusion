import React, { FC } from "react";

interface HomeIconProps {
  className?: string;
}

const HomeIcon: FC<HomeIconProps> = ({ className }) => {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f7ff" />
          <stop offset="100%" stopColor="#007bff" />
        </linearGradient>
      </defs>
      <path
        d="M2 11.34c0-.85.36-1.66.99-2.23l7-6.3c1.14-1.03 2.87-1.03 4.01 0l7 6.3c.63.57.99 1.38.99 2.23V19c0 1.66-1.34 3-3 3H5c-1.66 0-3-1.34-3-3v-7.66z"
        fill="url(#homeGradient)"
      />
      <path
        d="M9 16c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v6H9v-6z"
        fill="#4fc3f7"
      />
    </svg>
  );
};

export default HomeIcon;
