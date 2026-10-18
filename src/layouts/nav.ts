import type { IconName } from '../components/Icon';

export interface NavItem {
  to: string;
  key: string;
  icon: IconName;
  end?: boolean;
  /** Shown in the bottom tab bar on small screens. */
  mobile: boolean;
  /** Sits near the bottom of the desktop sidebar. */
  secondary?: boolean;
}

export const NAV: NavItem[] = [
  { to: '/app', key: 'home', icon: 'home', end: true, mobile: true },
  { to: '/app/plan', key: 'plan', icon: 'plan', mobile: true },
  { to: '/app/money', key: 'money', icon: 'money', mobile: true },
  { to: '/app/inbox', key: 'inbox', icon: 'inbox', mobile: true },
  { to: '/app/privacy', key: 'privacy', icon: 'shield', mobile: false, secondary: true },
  { to: '/app/me', key: 'me', icon: 'user', mobile: true, secondary: true },
];
