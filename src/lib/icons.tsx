import React from 'react';

type IconProps = { size?: number; color?: string; stroke?: number; className?: string };

const base = (s?: number) => s || 20;

export const IconHome = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1v-9.5z" />
  </svg>
);
export const IconGame = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="3" />
    <path d="M6 12h4M8 10v4M15 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM18 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
  </svg>
);
export const IconWallet = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    <path d="M16 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    <path d="M5 10h10" />
  </svg>
);
export const IconUser = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </svg>
);
export const IconTicket = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0-2 2 2 2 0 0 0 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 2-2 2 2 0 0 0-2-2V7z" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
export const IconSpin = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M5.6 18.4l2.1-2.1" />
  </svg>
);
export const IconDice = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8" cy="8" r="1" fill={color} />
    <circle cx="12" cy="12" r="1" fill={color} />
    <circle cx="16" cy="16" r="1" fill={color} />
    <circle cx="16" cy="8" r="1" fill={color} />
    <circle cx="8" cy="16" r="1" fill={color} />
  </svg>
);
export const IconTarget = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" fill={color} />
  </svg>
);
export const IconPlus = ({ size, color="#fff", stroke=2 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconMinus = ({ size, color="#fff", stroke=2 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}><path d="M5 12h14" /></svg>
);
export const IconCheck = ({ size, color="#fff", stroke=2 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
);
export const IconX = ({ size, color="#fff", stroke=2 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconArrow = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
);
export const IconArrowLeft = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
);
export const IconBolt = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>
);
export const IconCrown = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M3 16l3-10 4 5 4-5 3 10H3z"/><path d="M3 19h18" /></svg>
);
export const IconSettings = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </svg>
);
export const IconShield = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /></svg>
);
export const IconChart = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M3 20V10M8 20V4M13 20v-8M18 20V8" /></svg>
);
export const IconUsers = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
export const IconLogOut = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
export const IconRefresh = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9c2 0 4 .7 5.5 2"/><path d="M21 3v6h-6" /></svg>
);
export const IconCopy = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3"/></svg>
);
export const IconEye = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
export const IconBank = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M3 10L12 3l9 7H3z"/><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/><path d="M9 21v-6h6v6"/></svg>
);
export const IconClock = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
export const IconFire = ({ size, color="#fff", stroke=1.8 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><path d="M9 12a3 3 0 0 0 3 3 3 3 0 0 0 0-6 3 3 0 0 0-3 3z"/></svg>
);
export const IconMenu = ({ size, color="#fff", stroke=2 }: IconProps) => (
  <svg width={base(size)} height={base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
);
