import React, { useMemo, useState } from 'react';
import { Briefcase, ChevronDown, ChevronRight, LayoutGrid, List, Search, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface PositionGalleryProps {
  data: any[];
  isLoading: boolean;
  onRowClick: (row: any) => void;
  key?: string;
}

export default function PositionGallery({ data, isLoading, onRowClick }: PositionGalleryProps) {
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const filtered = data.filter((item) => `${item.Position} ${item.Team}`.toLowerCase().includes(search.toLowerCase()));

    filtered.forEach((item) => {
      const team = item.Team || 'Unassigned';
      if (!groups[team]) {
        groups[team] = [];
      }
      groups[team].push(item);
    });

    return groups;
  }, [data, search]);

  const toggleTeam = (team: string) => {
    setExpandedTeams((current) => ({
      ...current,
      [team]: !current[team],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Organizing Roles...</p>
      </div>
    );
  }

  const teams = Object.keys(groupedData).sort();

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50/50 overflow-hidden">
      <div className="h-[76px] bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center bg-slate-100/80 px-4 py-2.5 rounded-xl w-[440px] border border-slate-200/50 focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Search positions or departments..."
            className="bg-transparent border-none outline-none text-sm w-full font-sans font-medium placeholder:text-slate-400"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {teams.map((team) => (
            <div key={team} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <button onClick={() => toggleTeam(team)} className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/50 transition-colors text-left">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 leading-tight uppercase tracking-wide">{team}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-widest">{groupedData[team].length} POSITIONS</p>
                  </div>
                </div>
                <div className={`p-2 rounded-lg transition-colors ${expandedTeams[team] ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
                  {expandedTeams[team] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>

              <AnimatePresence>
                {expandedTeams[team] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                    <div className={`px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/30 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}`}>
                      {groupedData[team].map((item, index) => {
                        const level = String(item.Level || '').toLowerCase();
                        const isManager = level.includes('manager');

                        return (
                          <motion.div
                            key={`gallery-item-${item._internalId || `${team}-${index}`}`}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onRowClick(item)}
                            className={`bg-white border rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all group ${viewMode === 'grid' ? 'flex flex-col gap-3' : 'flex items-center justify-between'} ${isManager ? 'border-amber-100 bg-amber-50/10' : 'border-slate-200'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isManager ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-800 leading-none group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.Position}</span>
                                <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">{item.Level || 'Standard'}</span>
                              </div>
                            </div>

                            {viewMode === 'grid' ? (
                              <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm animate-pulse"></div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 transition-all group-hover:translate-x-0.5" />
                              </div>
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-all group-hover:translate-x-0.5" />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {teams.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">No matching positions</h3>
              <p className="text-xs text-slate-500 mt-2">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
