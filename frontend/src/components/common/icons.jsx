/*
 * Inline SVG icon set — no icon library dependency, every icon inherits
 * currentColor so it can be recoloured with CSS.
 */

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true,
  focusable: false,
});

export const PlayIcon = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" /></svg>
);

export const PauseIcon = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
);

export const NextIcon = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M6 6.5v11a1 1 0 0 0 1.53.85L15 13.1V17a1 1 0 0 0 2 0V7a1 1 0 0 0-2 0v3.9L7.53 5.65A1 1 0 0 0 6 6.5Z" /></svg>
);

export const PrevIcon = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M18 6.5v11a1 1 0 0 1-1.53.85L9 13.1V17a1 1 0 0 1-2 0V7a1 1 0 0 1 2 0v3.9l7.47-5.25A1 1 0 0 1 18 6.5Z" /></svg>
);

export const ShuffleIcon = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M17 4l3.2 3.2L17 10.4 15.8 9.2l1.1-1.1H14a3 3 0 0 0-2.4 1.2l-1.1 1.5-1.4-2.1L7.8 7.6 9 6.4A5 5 0 0 1 13 5h2.9l-1.1-1.1L17 4ZM4 7h2.2l8.6 10H17v-2l3.2 3.2L17 19v-2h-3.9l-8.6-10H4V7Zm3.1 8.5 1.4 2.1 1.4-1-1.4-2.1-1.4 1Z" /></svg>
);

export const RepeatIcon = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M7 7h10v2.5L21 6l-4-3.5V5H5a3 3 0 0 0-3 3v1h2V8a1 1 0 0 1 1-1Zm10 10H7v-2.5L3 18l4 3.5V20h12a3 3 0 0 0 3-3v-1h-2v1a1 1 0 0 1-1 1Z" /></svg>
);

export const RepeatOneIcon = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M7 7h10v2.5L21 6l-4-3.5V5H5a3 3 0 0 0-3 3v1h2V8a1 1 0 0 1 1-1Zm10 10H7v-2.5L3 18l4 3.5V20h12a3 3 0 0 0 3-3v-1h-2v1a1 1 0 0 1-1 1Z" />
    <path d="M12.6 10.4h1.6v5h-1.2l-1.8 1.2v-1.2h-.6v-4h2Z" />
  </svg>
);

export const HeartIcon = ({ size = 20, filled = false }) => (
  <svg {...base(size)} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.8}>
    <path d="M12 20.3 4.7 13a4.6 4.6 0 0 1 0-6.5 4.6 4.6 0 0 1 6.5 0l.8.8.8-.8a4.6 4.6 0 0 1 6.5 6.5L12 20.3Z" />
  </svg>
);

export const VolumeIcon = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M4 9v6h4l5 4V5L8 9H4Zm12.5 3a4 4 0 0 0-2-3.46v6.92A4 4 0 0 0 16.5 12Zm-2-7.1v2.06a6 6 0 0 1 0 10.08v2.06a8 8 0 0 0 0-14.2Z" /></svg>
);

export const MuteIcon = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M4 9v6h4l5 4V5L8 9H4Zm15.7.3-1.4-1.4L16 10.2l-2.3-2.3-1.4 1.4 2.3 2.3-2.3 2.3 1.4 1.4 2.3-2.3 2.3 2.3 1.4-1.4-2.3-2.3 2.3-2.3Z" /></svg>
);

export const HomeIcon = ({ size = 22 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.7" fill="none">
    <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z" strokeLinejoin="round" />
    <path d="M9.5 20.5v-6h5v6" />
  </svg>
);

export const SearchIcon = ({ size = 22 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.7" fill="none">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" strokeLinecap="round" />
  </svg>
);

export const LibraryIcon = ({ size = 22 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.7" fill="none">
    <path d="M5 4v16M9.5 4v16" strokeLinecap="round" />
    <path d="m14 5 4.5-1.2L21 18.6 16.5 20 14 5Z" strokeLinejoin="round" />
  </svg>
);

export const PlusIcon = ({ size = 20 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.9" fill="none">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

export const TrashIcon = ({ size = 18 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.7" fill="none">
    <path d="M5 7h14M10 7V5h4v2M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const EditIcon = ({ size = 18 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.7" fill="none">
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" strokeLinejoin="round" />
    <path d="m14.5 6 3 3" />
  </svg>
);

export const UploadIcon = ({ size = 20 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.7" fill="none">
    <path d="M12 16V5m0 0L8 9m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" strokeLinecap="round" />
  </svg>
);

export const MusicNoteIcon = ({ size = 24 }) => (
  <svg {...base(size)}><path d="M9 18.5a2.5 2.5 0 1 1-2.5-2.5H8V6.8l9-1.8v9.5a2.5 2.5 0 1 1-2.5-2.5h1.5V7.4L9.5 8.6v9.9Z" /></svg>
);

export const UserIcon = ({ size = 22 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.7" fill="none">
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
  </svg>
);

export const LogoutIcon = ({ size = 18 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.7" fill="none">
    <path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
    <path d="M10 12h10m0 0-3-3m3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const XIcon = ({ size = 18 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.9" fill="none">
    <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
  </svg>
);

export const ChevronRightIcon = ({ size = 18 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.8" fill="none">
    <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ListIcon = ({ size = 18 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.7" fill="none">
    <path d="M4 7h11M4 12h11M4 17h7M18 10v7" strokeLinecap="round" />
    <circle cx="16.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const DiscIcon = ({ size = 20 }) => (
  <svg {...base(size)} stroke="currentColor" strokeWidth="1.6" fill="none">
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

export const Spinner = ({ size = 22 }) => (
  <svg className="spinner" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/** Brand mark: a gradient rounded square with waveform bars (original artwork). */
export const LogoMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient id="sonora-logo-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7c5cff" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="9" fill="#16161f" />
    <g fill="url(#sonora-logo-gradient)">
      <rect x="6" y="13" width="3.4" height="6" rx="1.7" />
      <rect x="11.3" y="9" width="3.4" height="14" rx="1.7" />
      <rect x="16.6" y="6" width="3.4" height="20" rx="1.7" />
      <rect x="21.9" y="11" width="3.4" height="10" rx="1.7" />
    </g>
  </svg>
);
