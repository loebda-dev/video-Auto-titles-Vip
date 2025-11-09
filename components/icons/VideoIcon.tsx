
import React from 'react';

interface IconProps {
  className?: string;
}

export const VideoIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4 6.47224V17.5278C4 18.2803 4.77002 18.7445 5.42318 18.3615L14.7088 12.8337C15.3117 12.4838 15.3117 11.5162 14.7088 11.1663L5.42318 5.63847C4.77002 5.25551 4 5.71969 4 6.47224Z" />
    <path d="M10 4H19C19.5523 4 20 4.44772 20 5V19C20 19.5523 19.5523 20 19 20H10V18H18V6H10V4Z" />
  </svg>
);
    