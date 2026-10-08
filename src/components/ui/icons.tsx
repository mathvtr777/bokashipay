/**
 * Ícones lineares desenhados na mesma grade 24px, com stroke 1.75.
 * Inline via props evita uma dependência de ícones inteira e garante que o
 * peso de traço case com o resto da UI.
 */
import * as React from 'react'

type IconProps = React.SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const Dashboard = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Icon>
)
export const Sales = (p: IconProps) => (
  <Icon {...p}><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></Icon>
)
export const Pix = (p: IconProps) => (
  <Icon {...p}><path d="M12 3v18M3 12h18M7.5 7.5 12 3l4.5 4.5M16.5 16.5 12 21l-4.5-4.5" /></Icon>
)
export const Finance = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></Icon>
)
export const Customers = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <circle cx="9" cy="7" r="3.5" />
    <path d="M22 20v-1.5a4 4 0 0 0-3-3.87" />
    <path d="M16 3.6a4 4 0 0 1 7.75 1.4 4 4 0 0 1-7.75 1.4" />
  </Icon>
)
export const Bank = (p: IconProps) => (
  <Icon {...p}><path d="M3 10 12 4l9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18M3 18h18" /></Icon>
)
export const Crypto = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 8h4a2.5 2.5 0 0 1 0 5h-4" />
    <path d="M9.5 8v9" />
    <path d="M8 11.5h5.5" />
    <path d="M8 16h5.5" />
  </Icon>
)
export const Integrations = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.15 1.15" />
    <path d="M14 10a4 4 0 0 0-5.66 0l-3 3A4 4 0 0 0 11 18.66l1.14-1.14" />
  </Icon>
)
export const Settings = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </Icon>
)
export const Help = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 4.86.83c0 1.67-2.36 2.17-2.36 2.67M12 17h.01" /></Icon>
)
export const User = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
)
export const Logout = (p: IconProps) => (
  <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Icon>
)
export const Bell = (p: IconProps) => (
  <Icon {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></Icon>
)
export const Search = (p: IconProps) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
)
export const Menu = (p: IconProps) => (
  <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
)
export const X = (p: IconProps) => (
  <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>
)
export const Check = (p: IconProps) => (
  <Icon {...p}><path d="m5 13 4 4L19 7" /></Icon>
)
export const CheckCircle = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></Icon>
)
export const AlertTriangle = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Icon>
)
export const Info = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Icon>
)
export const Plus = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
)
export const Trash = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 6h17" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </Icon>
)
export const Edit = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
)
export const Eye = (p: IconProps) => (
  <Icon {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Icon>
)
export const EyeOff = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.9 4.2A9.9 9.9 0 0 1 12 4c6.4 0 10 6 10 6a17 17 0 0 1-3.4 4.1" />
    <path d="M6.3 6.3A17 17 0 0 0 2 10s3.6 6 10 6a9.7 9.7 0 0 0 5.4-1.6" />
    <path d="m1 1 22 22" />
    <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
  </Icon>
)
export const Copy = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </Icon>
)
export const Download = (p: IconProps) => (
  <Icon {...p}><path d="M12 3v12M7 11l5 5 5-5M4 20h16" /></Icon>
)
export const Share = (p: IconProps) => (
  <Icon {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></Icon>
)
export const ArrowUpRight = (p: IconProps) => (
  <Icon {...p}><path d="M7 17 17 7M9 7h8v8" /></Icon>
)
export const ArrowDownRight = (p: IconProps) => (
  <Icon {...p}><path d="M7 7l10 10M17 9v8H9" /></Icon>
)
export const ArrowRight = (p: IconProps) => (
  <Icon {...p}><path d="M4 12h16M14 6l6 6-6 6" /></Icon>
)
export const SlidersHorizontal = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Icon>
)
export const ChevronLeft = (p: IconProps) => (
  <Icon {...p}><path d="m15 6-6 6 6 6" /></Icon>
)
export const ChevronRight = (p: IconProps) => (
  <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>
)
export const ChevronDown = (p: IconProps) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
)
export const ChevronUp = (p: IconProps) => (
  <Icon {...p}><path d="m6 15 6-6 6 6" /></Icon>
)
export const Wallet = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
    <path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3" />
    <circle cx="16.5" cy="13.5" r="1.2" />
  </Icon>
)
export const Clock = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
)
export const TrendUp = (p: IconProps) => (
  <Icon {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></Icon>
)
export const TrendDown = (p: IconProps) => (
  <Icon {...p}><path d="m3 7 6 6 4-4 8 8" /><path d="M15 17h6v-6" /></Icon>
)
export const Calendar = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>
)
export const Lock = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4.5" y="10" width="15" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Icon>
)
export const Mail = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></Icon>
)
export const Phone = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5 2 2 0 0 1 5 3.5Z" />
  </Icon>
)
export const Shield = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9.5-4.8-1.3-8-5-8-9.5V6Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
)
export const Link = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.5 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
    <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
  </Icon>
)
export const Unlink = (p: IconProps) => (
  <Icon {...p}><path d="M15 7h4v4M9 17H5v-4M8.5 12h7M4 4l16 16" /></Icon>
)
export const Star = (p: IconProps) => (
  <Icon {...p}><path d="m12 3.5 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8Z" /></Icon>
)
export const Card = (p: IconProps) => (
  <Icon {...p}><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6 15h3" /></Icon>
)
export const Barcode = (p: IconProps) => (
  <Icon {...p}><path d="M4 5v14M7.5 5v14M11 5v10M14 5v14M17 5v10M20 5v14" /></Icon>
)
export const Inbox = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 13h5l1.5 3h5L16 13h5" />
    <path d="M5.5 5h13l2.5 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
  </Icon>
)
export const Send = (p: IconProps) => (
  <Icon {...p}><path d="M21 3 3 10.5l7.5 3 3 7.5Z" /><path d="M21 3 10.5 13.5" /></Icon>
)
export const Devices = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="5" width="13" height="10" rx="2" />
    <path d="M6 19h6M9 15v4" />
    <rect x="17" y="9" width="5" height="10" rx="1.5" />
  </Icon>
)
export const Sun = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M19.1 4.9l-1.5 1.5M6.4 17.6l-1.5 1.5" /></Icon>
)
export const Moon = (p: IconProps) => (
  <Icon {...p}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a8.5 8.5 0 0 0 10.5 10.5Z" /></Icon>
)
export const Zap = (p: IconProps) => (
  <Icon {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7Z" /></Icon>
)
export const LockOpen = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4.5" y="10" width="15" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 7.5-2" />
  </Icon>
)
export const Gift = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="8" width="18" height="13" rx="2" />
    <path d="M3 12h18" />
    <path d="M12 8v13" />
    <path d="M12 8c-2 0-3.5-1.5-3.5-3a2 2 0 0 1 3.5-1.5" />
    <path d="M12 8c2 0 3.5-1.5 3.5-3a2 2 0 0 0-3.5-1.5" />
  </Icon>
)
export const ArrowDownToLine = (p: IconProps) => (
  <Icon {...p}><path d="M12 17V3M6 11l6 6 6-6M4 21h16" /></Icon>
)
export const Activity = (p: IconProps) => (
  <Icon {...p}><path d="M3 12h4l3-9 4 18 3-9h4" /></Icon>
)
export const Bot = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="7" width="16" height="12" rx="3" />
    <path d="M12 3v4" />
    <path d="M9 13h.01" />
    <path d="M15 13h.01" />
    <path d="M9 17h6" />
    <circle cx="18" cy="5" r="1" />
    <circle cx="6" cy="5" r="1" />
  </Icon>
)
export const Sparkles = (p: IconProps) => (
  <Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /><path d="M12 8.5l1.4 2.6 2.6 1.4-2.6 1.4L12 16.5l-1.4-2.6L8 12.5l2.6-1.4Z" /></Icon>
)
export const Box = (p: IconProps) => (
  <Icon {...p}><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></Icon>
)
export const ChartBar = (p: IconProps) => (
  <Icon {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>
)
export const ShieldAlert = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9.5-4.8-1.3-8-5-8-9.5V6Z" />
    <path d="M12 8v4" />
    <path d="M12 15h.01" />
  </Icon>
)
export const DollarSign = (p: IconProps) => (
  <Icon {...p}><path d="M12 3v18M16.5 6.5A3.5 3.5 0 0 0 12.7 5H10a2.5 2.5 0 0 0 0 5h4a2.5 2.5 0 0 1 0 5h-2.7a3.5 3.5 0 0 1-3.8-1.5" /></Icon>
)
export const Cart = (p: IconProps) => (
  <Icon {...p}><path d="M3 4h2l2.5 12h11l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></Icon>
)
export const Globe = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Icon>
)
export const Code2 = (p: IconProps) => (
  <Icon {...p}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" /></Icon>
)
export const Layers = (p: IconProps) => (
  <Icon {...p}><path d="M12 3 2 8l10 5 10-5z" /><path d="m2 13 10 5 10-5M2 18l10 5 10-5" /></Icon>
)
export const ShoppingBag = (p: IconProps) => (
  <Icon {...p}><path d="M3 8h18l-1.5 11.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></Icon>
)
export const CreditCard = (p: IconProps) => (
  <Icon {...p}><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M6 15h4" /></Icon>
)
export const Briefcase = (p: IconProps) => (
  <Icon {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon>
)
export const UploadCloud = (p: IconProps) => (
  <Icon {...p}><path d="M16 16l-4-4-4 4M12 12v9" /><path d="M20.4 14.5A5 5 0 0 0 18 5h-1.3A8 8 0 1 0 4 13.7" /></Icon>
)
export const Link2 = (p: IconProps) => (
  <Icon {...p}><path d="M9 17H7a5 5 0 0 1 0-10h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /><path d="M8 12h8" /></Icon>
)
export const At = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></Icon>
)
