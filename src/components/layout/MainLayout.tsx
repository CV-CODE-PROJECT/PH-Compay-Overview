/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import { TableType } from '../../types';
import { Menu } from 'lucide-react';
import StatusBanner from '../common/StatusBanner';

interface MainLayoutProps {
  children: ReactNode;
  user: any;
  onLogout: () => void;
  dataSource: 'live' | 'fallback';
  error: string | null;
}

export default function MainLayout({ 
  children, 
  user, 
  onLogout,
  dataSource,
  error
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={onLogout}
      />
      
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white/50">
        {/* Top Operational bar (Mobile) */}
        <div className="h-[76px] px-8 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 z-30 md:hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-xl"
            id="mobile-menu-trigger"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-right">
            <h1 className="text-sm font-black text-slate-900 leading-none">PHUOC HUNG</h1>
            <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-widest leading-none">Atlas</p>
          </div>
        </div>

        {/* <StatusBanner dataSource={dataSource} error={error} /> */}
        {children}
      </main>
    </div>
  );
}
