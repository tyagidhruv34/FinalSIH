import React from 'react';

interface SaffronFlagProps {
  size?: number;
  className?: string;
}

export const SaffronFlag: React.FC<SaffronFlagProps> = ({ size = 40, className }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size * (2/3)} // Maintain 3:2 aspect ratio
      viewBox="0 0 300 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Saffron band */}
      <rect x="0" y="0" width="300" height="66.67" fill="#FF9933" />
      {/* White band */}
      <rect x="0" y="66.67" width="300" height="66.67" fill="#FFFFFF" />
      {/* Green band */}
      <rect x="0" y="133.34" width="300" height="66.67" fill="#138808" />
      {/* Ashoka Chakra (simplified blue circle for symbol) */}
      <circle cx="150" cy="100" r="20" fill="#000080" />
    </svg>
  );
};

export default SaffronFlag;


