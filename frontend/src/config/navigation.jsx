import {
  BarChart3, Bell, Building2, ClipboardCheck, FileBarChart, Gamepad2,
  Gauge, HandHeart, Leaf, Medal, ScrollText, Settings, ShieldCheck, Target,
  Users, UserRound,
} from 'lucide-react'

export const organizationNav = [
  { label: 'Overview', href: '/org/dashboard', icon: Gauge },
  { label: 'Environmental', href: '/org/environmental', icon: Leaf },
  { label: 'Social', href: '/org/social', icon: HandHeart },
  { label: 'Governance', href: '/org/governance', icon: ShieldCheck },
  { label: 'Gamification', href: '/org/gamification', icon: Gamepad2 },
  { label: 'Approvals', href: '/org/approvals', icon: ClipboardCheck, badge: '0' },
  { label: 'People & access', href: '/org/users', icon: Users },
  { label: 'Reports', href: '/org/reports', icon: FileBarChart },
  { label: 'Settings', href: '/org/settings', icon: Settings },
]

export const employeeNav = [
  { label: 'Home', href: '/app/dashboard', icon: Gauge },
  { label: 'Environmental', href: '/app/environmental', icon: Leaf },
  { label: 'CSR activities', href: '/app/social', icon: HandHeart },
  { label: 'Policies', href: '/app/governance', icon: ScrollText },
  { label: 'Challenges', href: '/app/challenges', icon: Target },
  { label: 'XP & badges', href: '/app/achievements', icon: Medal },
  { label: 'Leaderboard', href: '/app/leaderboard', icon: BarChart3 },
  { label: 'Notifications', href: '/app/notifications', icon: Bell },
  { label: 'Profile', href: '/app/profile', icon: UserRound },
]

export const sectionMeta = {
  environmental: { title: 'Environmental', description: 'Carbon accounting, environmental goals and performance analytics.', icon: Leaf, accent: 'emerald' },
  social: { title: 'Social', description: 'CSR activities, employee participation and social impact.', icon: HandHeart, accent: 'blue' },
  governance: { title: 'Governance', description: 'Policies, acknowledgements, audits and compliance.', icon: ShieldCheck, accent: 'violet' },
  gamification: { title: 'Gamification', description: 'Challenges, achievements, rewards and engagement.', icon: Gamepad2, accent: 'amber' },
  approvals: { title: 'Approval center', description: 'Review ESG submissions requiring your attention.', icon: ClipboardCheck, accent: 'blue' },
  users: { title: 'People & access', description: 'Manage organization members, roles and departments.', icon: Users, accent: 'violet' },
  reports: { title: 'Reports', description: 'Generate permission-aware ESG reports and exports.', icon: FileBarChart, accent: 'emerald' },
  settings: { title: 'Settings', description: 'Configure your organization and EcoSphere preferences.', icon: Settings, accent: 'slate' },
  challenges: { title: 'Challenges', description: 'Discover and participate in active sustainability challenges.', icon: Target, accent: 'amber' },
  achievements: { title: 'XP & badges', description: 'Track achievements earned from verified participation.', icon: Medal, accent: 'amber' },
  leaderboard: { title: 'Leaderboard', description: 'Rankings calculated from verified employee activity.', icon: BarChart3, accent: 'amber' },
  notifications: { title: 'Notifications', description: 'Updates from your ESG activity and organization.', icon: Bell, accent: 'blue' },
  profile: { title: 'Profile', description: 'Your EcoSphere identity and participation overview.', icon: UserRound, accent: 'slate' },
}
