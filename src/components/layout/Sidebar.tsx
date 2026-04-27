import { ExternalLink, GitBranch, Home, Layers, LayoutGrid, LogOut, Network, UserSquare, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: {
    email: string;
    name: string;
    picture?: string;
  } | null;
  onLogout?: () => void;
  spreadsheetId: string;
}

export default function Sidebar({ isOpen, onClose, user, onLogout, spreadsheetId }: SidebarProps) {
  const groups = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
        { id: 'overview', label: 'Company Overview', icon: LayoutGrid, path: '/overview' },
      ],
    },
    {
      title: 'Organization',
      items: [
        { id: 'orgChart', label: 'Org Chart', icon: Network, path: '/org-chart' },
        { id: 'departments', label: 'Departments', icon: Layers, path: '/data/department' },
        { id: 'team', label: 'Teams & Hierarchy', icon: Users, path: '/data/team' },
        { id: 'reporting-lines', label: 'Reporting Lines', icon: GitBranch, path: '/data/reporting-lines' },
      ],
    },
    {
      title: 'People',
      items: [
        { id: 'employee', label: 'Employee Directory', icon: Users, path: '/data/employee' },
        { id: 'position', label: 'Positions / Roles', icon: UserSquare, path: '/data/position' },
      ],
    },
    {
      title: 'Actions',
      items: [
        {
          id: 'master-sheet',
          label: 'Open Master Sheet',
          icon: ExternalLink,
          action: () => window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`, '_blank', 'noopener,noreferrer'),
        },
        user ? { id: 'logout', label: 'Log Out Session', icon: LogOut, action: onLogout } : null,
      ].filter(Boolean) as Array<any>,
    },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm" />}
      </AnimatePresence>

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-30 md:w-[260px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-8 pb-10 flex items-center justify-between">
          <div className="w-18">
            <img src="https://cdn.shopify.com/s/files/1/0747/0032/5038/files/retina-logo-1.png?v=1776824820" alt="logo" />
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 md:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-8 space-y-9">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="px-4 mb-3">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{group.title}</h2>
              </div>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  if (item.action) {
                    return (
                      <li key={item.id}>
                        <button onClick={item.action} className="w-full flex items-center px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group hover:bg-slate-50 text-slate-600">
                          <item.icon className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-600" />
                          <span className="flex-1 text-left font-sans">{item.label}</span>
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.path}
                        onClick={() => onClose?.()}
                        className={({ isActive }) => `
                          w-full flex items-center px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group
                          ${isActive ? 'bg-blue-50 text-blue-700 font-bold shadow-sm border border-blue-100' : 'hover:bg-slate-50 text-slate-600'}
                        `}
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className="flex-1 text-left font-sans">{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-[10px] font-bold text-slate-500 uppercase">{user?.name?.slice(0, 2) || 'AD'}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-none truncate">{user ? user.name : 'Admin Console'}</p>
              <p className="text-[10px] text-slate-400 mt-1 truncate">{user ? user.email : 'internal'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
