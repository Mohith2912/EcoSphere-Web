import { useState } from 'react'
import { Bell, ChevronDown, Menu, PanelLeftClose, Search, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import Logo from '../components/brand/Logo'

function Sidebar({ mobile = false, collapsed, experience, navItems, onClose, onCollapse }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
        <Logo compact={!mobile && collapsed} inverse />
        {mobile && <button onClick={onClose} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close navigation"><X size={20} /></button>}
      </div>
      <div className={`px-4 pb-3 pt-5 ${collapsed && !mobile ? 'text-center' : ''}`}>
        {(!collapsed || mobile) && <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">{experience}</p>}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Primary navigation">
        {navItems.map(({ label, href, icon: Icon, badge }) => (
          <NavLink key={label} to={href} onClick={onClose} title={collapsed && !mobile ? label : undefined}
            className={({ isActive }) => `flex min-h-11 items-center rounded-xl text-sm font-medium transition ${collapsed && !mobile ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'bg-white text-forest-950 shadow-sm' : 'text-white/68 hover:bg-white/8 hover:text-white'}`}>
            <Icon size={18} className="shrink-0" aria-hidden="true" />
            {(!collapsed || mobile) && <><span className="flex-1">{label}</span>{badge && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-950">{badge}</span>}</>}
          </NavLink>
        ))}
      </nav>
      {!mobile && (
        <button onClick={onCollapse} className={`m-3 flex h-11 items-center rounded-xl text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}>
          <PanelLeftClose size={18} className={collapsed ? 'rotate-180' : ''} />
          {!collapsed && 'Collapse sidebar'}
        </button>
      )}
    </div>
  )
}

export default function AppShell({ children, navItems, experience, user }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-canvas">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden bg-forest-950 transition-[width] duration-200 lg:block ${collapsed ? 'w-20' : 'w-64'}`}><Sidebar collapsed={collapsed} experience={experience} navItems={navItems} onClose={() => {}} onCollapse={() => setCollapsed((value) => !value)} /></aside>
      {mobileOpen && <div className="fixed inset-0 z-40 lg:hidden"><button className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" /><aside className="relative h-full w-[min(86vw,320px)] bg-forest-950 shadow-2xl"><Sidebar mobile collapsed={false} experience={experience} navItems={navItems} onClose={() => setMobileOpen(false)} /></aside></div>}

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-20 flex h-[72px] items-center border-b border-line bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button onClick={() => setMobileOpen(true)} className="mr-3 rounded-xl border border-line p-2.5 text-ink-800 lg:hidden" aria-label="Open navigation"><Menu size={19} /></button>
          <div className="relative hidden max-w-sm flex-1 md:block">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-600" aria-hidden="true" />
            <input type="search" placeholder="Search EcoSphere" className="h-10 w-full rounded-xl border border-line bg-canvas pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-forest-600 focus:bg-white" />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button className="relative grid size-10 place-items-center rounded-xl border border-line text-ink-600 hover:bg-canvas" aria-label="Notifications">
              <Bell size={18} /><span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-amber-500" />
            </button>
            <button className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-canvas">
              <span className="grid size-8 place-items-center rounded-lg bg-forest-100 text-xs font-bold text-forest-800">NV</span>
              <span className="hidden text-left sm:block"><span className="block text-xs font-semibold text-ink-950">{user.name}</span><span className="block text-[10px] text-ink-600">{user.role}</span></span>
              <ChevronDown size={15} className="hidden text-ink-600 sm:block" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        <footer className="px-6 py-7 text-center text-xs text-ink-600">EcoSphere · Responsible progress, made measurable</footer>
      </div>
    </div>
  )
}
