import type { SVGProps } from 'react';
import {
  Activity,
  Bug,
  CircleHelp,
  Cloud,
  Coins,
  DoorOpen,
  EyeOff,
  HandCoins,
  KeyRound,
  LogIn,
  Users,
  Wallet,
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Banknote,
  Calendar,
  ChartLine,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CirclePause,
  Clock,
  Download,
  Eye,
  FileText,
  Funnel,
  Globe,
  House,
  Info,
  Lock,
  LogOut,
  Mail,
  Map,
  Menu,
  MessageCircle,
  Minus,
  Monitor,
  Moon,
  PanelLeft,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Repeat,
  Scale,
  Search,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/** One icon set: Lucide, bundled with the app. Names are Tengo's own so call sites stay stable. */
const ICONS = {
  home: House,
  plan: ChartLine,
  money: Banknote,
  inbox: MessageCircle,
  shield: Shield,
  user: User,
  check: Check,
  checkCircle: CircleCheck,
  alert: TriangleAlert,
  shortCircle: CircleAlert,
  info: Info,
  x: X,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  arrowRight: ArrowRight,
  plus: Plus,
  minus: Minus,
  upload: Upload,
  download: Download,
  calendar: Calendar,
  edit: Pencil,
  trash: Trash2,
  globe: Globe,
  lock: Lock,
  eye: Eye,
  file: FileText,
  refresh: RefreshCw,
  switch: ArrowLeftRight,
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
  clock: Clock,
  sliders: SlidersHorizontal,
  receipt: Receipt,
  pause: CirclePause,
  mail: Mail,
  phone: Smartphone,
  bolt: Zap,
  repeat: Repeat,
  filter: Funnel,
  search: Search,
  menu: Menu,
  logout: LogOut,
  sparkle: Sparkles,
  map: Map,
  scale: Scale,
  sidebar: PanelLeft,
  help: CircleHelp,
  eyeOff: EyeOff,
  wallet: Wallet,
  coins: Coins,
  users: Users,
  door: DoorOpen,
  key: KeyRound,
  bug: Bug,
  cloud: Cloud,
  handCoins: HandCoins,
  login: LogIn,
  activity: Activity,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'ref'> {
  name: IconName;
  size?: number;
  label?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, label, strokeWidth = 1.75, ...rest }: IconProps) {
  const Svg = ICONS[name];
  return (
    <Svg
      size={size}
      strokeWidth={strokeWidth}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    />
  );
}
