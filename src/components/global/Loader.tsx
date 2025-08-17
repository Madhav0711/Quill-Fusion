import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center space-x-2" role="status" aria-label="Loading">
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(0.9);
            }
          }
          .animate-pulse-delay-0 {
            animation: pulse 1.5s infinite;
          }
          .animate-pulse-delay-150 {
            animation: pulse 1.5s infinite 0.15s;
          }
          .animate-pulse-delay-300 {
            animation: pulse 1.5s infinite 0.3s;
          }
          .animate-pulse-delay-450 {
            animation: pulse 1.5s infinite 0.45s;
          }
        `}
      </style>
      <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse-delay-0"></div>
      <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse-delay-150"></div>
      <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse-delay-300"></div>
      <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse-delay-450"></div>
    </div>
  );
};

export default Loader;