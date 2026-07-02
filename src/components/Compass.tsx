import React from 'react';

interface CompassProps {
  size?: number | string;
  className?: string;
}

export const Compass: React.FC<CompassProps> = ({ size = 32, className = "" }) => {
  const numericSize = typeof size === 'number' ? size : parseInt(size) || 32;

  return (
    <svg
      width={numericSize}
      height={numericSize}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Crisp premium gradients using the exact high-contrast brand cyan */}
        <linearGradient id="iconNeedleNorth" x1="50" y1="14" x2="43" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3DF6FF" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>

        <linearGradient id="iconNeedleNorthShade" x1="50" y1="14" x2="57" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00AECF" />
          <stop offset="100%" stopColor="#007E96" />
        </linearGradient>

        <linearGradient id="iconBezelGradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3DF6FF" />
          <stop offset="50%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#006C88" />
        </linearGradient>
      </defs>

      {/* 1. OUTERMOST EXECUTIVE BEZEL (Crisp, clean vector circle line) */}
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="url(#iconBezelGradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* 2. INNER CALIBRATION TRACK (Dotted precision vector track) */}
      <circle
        cx="50"
        cy="50"
        r="39"
        stroke="#00D4FF"
        strokeWidth="1.5"
        strokeDasharray="2.5 3.5"
        className="opacity-70"
      />

      {/* 3. CARDINAL INDICATION LINES (Extends inward with premium alignment) */}
      <g stroke="#00D4FF" strokeWidth="1.8" strokeLinecap="round">
        {/* North Target Anchor */}
        <line x1="50" y1="6" x2="50" y2="12" strokeWidth="2.5" />
        {/* South Target Anchor */}
        <line x1="50" y1="88" x2="50" y2="94" className="opacity-70" />
        {/* East Target Anchor */}
        <line x1="88" y1="50" x2="94" y2="50" className="opacity-70" />
        {/* West Target Anchor */}
        <line x1="6" y1="50" x2="12" y2="50" className="opacity-70" />
      </g>

      {/* 4. ULTRA-CLEAN SECTOR DIVISION LINES (Hairline axis grid) */}
      <g stroke="#00D4FF" strokeWidth="0.8" strokeDasharray="1 2" className="opacity-30">
        <line x1="50" y1="18" x2="50" y2="82" />
        <line x1="18" y1="50" x2="82" y2="50" />
      </g>

      {/* 5. PRISTINE CARDINAL TYPOGRAPHY (Exquisite geometric monospaced alignment) */}
      <g fill="#00D4FF" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" fontWeight="900" className="select-none pointer-events-none">
        {/* NORTH INDICATOR (Highly emphasized, glowing brand color) */}
        <text 
          x="50" 
          y="23" 
          fontSize="11" 
          textAnchor="middle" 
          fontWeight="900"
          style={{ textShadow: '0 0 3px rgba(0, 212, 255, 0.4)' }}
        >
          N
        </text>

        {/* SOUTH INDICATOR */}
        <text x="50" y="85.5" fontSize="8.5" textAnchor="middle" className="opacity-70">
          S
        </text>

        {/* EAST INDICATOR */}
        <text x="84" y="53" fontSize="8.5" textAnchor="middle" className="opacity-70">
          E
        </text>

        {/* WEST INDICATOR */}
        <text x="16" y="53" fontSize="8.5" textAnchor="middle" className="opacity-70">
          W
        </text>
      </g>

      {/* 6. MAGNETIC COMPASS NEEDLE (Suspended, dual-facet geometric 3D style) */}
      <g>
        {/* NORTH NEEDLE POINT - Left Facet (Light Gradient) */}
        <path
          d="M50,14 L44.5,50 L50,46.5 Z"
          fill="url(#iconNeedleNorth)"
        />
        {/* NORTH NEEDLE POINT - Right Facet (Shaded Gradient) */}
        <path
          d="M50,14 L55.5,50 L50,46.5 Z"
          fill="url(#iconNeedleNorthShade)"
        />

        {/* SOUTH NEEDLE POINT - Minimalist Hollow Structural Frame */}
        {/* Left facet outline */}
        <path
          d="M50,86 L44.5,50 L50,53.5 Z"
          stroke="#00D4FF"
          strokeWidth="1.2"
          fill="#00D4FF"
          fillOpacity="0.04"
          className="opacity-70"
        />
        {/* Right facet outline */}
        <path
          d="M50,86 L55.5,50 L50,53.5 Z"
          stroke="#00D4FF"
          strokeWidth="1.2"
          fill="#00D4FF"
          fillOpacity="0.12"
          className="opacity-80"
        />
      </g>

      {/* 7. CENTER PIVOT & COLLAR ASSEMBLY (Precision engineering detail) */}
      <circle
        cx="50"
        cy="50"
        r="6.5"
        fill="#040B18"
        stroke="#00D4FF"
        strokeWidth="1.5"
      />
      <circle
        cx="50"
        cy="50"
        r="3"
        fill="#00D4FF"
      />
      <circle
        cx="50"
        cy="50"
        r="1"
        fill="#FFFFFF"
      />
    </svg>
  );
};
