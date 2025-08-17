import React, { FC } from "react";

interface TrashIconProps {
  className?: string;
}

const TrashIcon: FC<TrashIconProps> = ({ className }) => {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="trashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f7ff" />
          <stop offset="100%" stopColor="#007bff" />
        </linearGradient>
      </defs>
      <path
        d="M4 7h16v12c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7z"
        fill="url(#trashGradient)"
      />
      <path
        d="M9 10c.55 0 1 .45 1 1v7c0 .55-.45 1-1 1s-1-.45-1-1v-7c0-.55.45-1 1-1z"
        fill="#4fc3f7"
      />
      <path
        d="M15 10c.55 0 1 .45 1 1v7c0 .55-.45 1-1 1s-1-.45-1-1v-7c0-.55.45-1 1-1z"
        fill="#4fc3f7"
      />
      <path
        d="M7 5c0-1.66 1.34-3 3-3h4c1.66 0 3 1.34 3 3h4c.55 0 1 .45 1 1s-.45 1-1 1H3c-.55 0-1-.45-1-1s.45-1 1-1h4zM10 4h4c.55 0 1 .45 1 1H9c0-.55.45-1 1-1z"
        fill="#4fc3f7"
      />
    </svg>
  );
};

export default TrashIcon;
