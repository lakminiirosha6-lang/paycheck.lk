import React from 'react';

interface ReceiptLogoProps {
  className?: string;
  size?: number;
}

export const ReceiptLogo: React.FC<ReceiptLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Receipt Paper Base */}
      <path
        d="M10 7C10 5.34315 11.3431 4 13 4H35C36.6569 4 38 5.34315 38 7V42L34 39.5L30 42L26 39.5L22 42L18 39.5L14 42L10 39.5V7Z"
        fill="url(#receiptGradient)"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top receipt lines */}
      <path
        d="M16 11H32"
        stroke="#A7F3D0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M16 16H26"
        stroke="#A7F3D0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Verified Badge Circle inside Receipt */}
      <circle
        cx="24"
        cy="27"
        r="10"
        fill="#10B981"
        stroke="#FFFFFF"
        strokeWidth="2"
      />

      {/* Prominent White Check Mark / Tick inside Receipt */}
      <path
        d="M19.5 27L22.5 30L28.5 24"
        stroke="#FFFFFF"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient
          id="receiptGradient"
          x1="10"
          y1="4"
          x2="38"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#047857" />
          <stop stopColor="#065F46" />
        </linearGradient>
      </defs>
    </svg>
  );
};
