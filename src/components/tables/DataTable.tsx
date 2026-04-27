/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  error?: string | null;
  searchPlaceholder?: string;
  groupKey?: keyof T;
  key?: React.Key;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  isLoading,
  error,
  searchPlaceholder = "Search data...",
  groupKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});

  const handleResizeStart = (e: React.MouseEvent, key: keyof T) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.pageX;
    const th = (e.target as HTMLElement).closest('th');
    const startWidth = th?.getBoundingClientRect().width || 100;
    
    const handleMouseMove = (mw: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (mw.pageX - startX));
      setColWidths(prev => ({ ...prev, [String(key)]: newWidth }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
    
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some(
          (val) => val && String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else if (groupKey) {
      // Default sort by group key if grouping is enabled
      result.sort((a, b) => {
        const aVal = String(a[groupKey] || '');
        const bVal = String(b[groupKey] || '');
        return aVal.localeCompare(bVal);
      });
    }

    return result;
  }, [data, search, sortConfig, groupKey]);

  const displayRows = useMemo(() => {
    const rows: Array<{ type: 'header' | 'row'; id: string; data?: T; value?: any; originalIndex?: number }> = [];
    let lastGroupVal: any = null;

    filteredData.forEach((item, idx) => {
      if (groupKey && item[groupKey] !== lastGroupVal) {
        lastGroupVal = item[groupKey];
        const headerId = `group-header-${String(lastGroupVal)}-idx-${idx}`;
        rows.push({
          type: 'header',
          id: headerId,
          value: lastGroupVal
        });
      }
      const rowId = `row-item-${item._internalId || 'no-id'}-${idx}`;
      rows.push({
        type: 'row',
        id: rowId,
        data: item,
        originalIndex: idx
      });
    });
    return rows;
  }, [filteredData, groupKey]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Syncing Atlas...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50/50 overflow-hidden">
      {/* Header / Toolbar remains same */}
      <div className="h-[76px] bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center bg-slate-100/80 px-4 py-2.5 rounded-xl w-[440px] border border-slate-200/50 focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-slate-600 font-sans font-medium placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Operations Data</p>
            <p className="text-xs font-bold text-slate-600 mt-1.5">
              {filteredData.length} <span className="font-medium text-slate-400 uppercase text-[9px] tracking-widest ml-1">Entries</span>
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:border-slate-300 transition-colors cursor-pointer">
            <FileSpreadsheet className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-6">
        <div className="flex-1 bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] border border-slate-200 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full border-collapse table-fixed min-w-[1000px]">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-20">
                <tr className="border-b border-slate-100 shadow-[0_1px_0_0_rgba(15,23,42,0.05)]">
                  {columns.map((col, colIdx) => (
                    <th
                      key={`col-${String(col.key)}-${colIdx}`}
                      style={{ width: colWidths[String(col.key)] || col.width || 'auto' }}
                      className="group relative text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors bg-white/95"
                    >
                      <div 
                        onClick={() => col.sortable !== false && handleSort(col.key)}
                        className={cn("flex items-center gap-2", col.sortable !== false && "cursor-pointer hover:text-slate-900")}
                      >
                        {col.label}
                        {sortConfig?.key === col.key && (
                          <span className={sortConfig.direction === 'asc' ? "text-blue-600" : "text-blue-600"}>
                            {sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </span>
                        )}
                      </div>
                      <div 
                        onMouseDown={(e) => handleResizeStart(e, col.key)}
                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-400/50 active:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {displayRows.length > 0 ? (
                    displayRows.map((row) => {
                      if (row.type === 'header') {
                        return (
                          <motion.tr 
                            key={row.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-slate-50/50"
                          >
                            <td colSpan={columns.length} className="px-6 py-3 border-y border-slate-100 bg-slate-50/80">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                 Department: <span className="text-blue-600 ml-1">{String(row.value || 'Unassigned')}</span>
                              </span>
                            </td>
                          </motion.tr>
                        );
                      }

                      const item = row.data!;
                      const idx = row.originalIndex!;

                      return (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.005, 0.4), duration: 0.2 }}
                          onClick={() => onRowClick?.(item)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-all group"
                        >
                          {columns.map((col, colIdx) => (
                            <td key={`cell-${String(col.key)}-${colIdx}`} className="px-6 py-3.5 font-sans font-medium text-slate-600 group-hover:text-slate-900 leading-tight">
                              {col.render ? col.render(item[col.key], item, idx) : (
                                <span className="truncate block">{item[col.key] || '-'}</span>
                              )}
                            </td>
                          ))}
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="py-32 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-slate-300" />
                          </div>
                          <p className="font-serif italic text-xl text-slate-400">Zero matches found.</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Adjust your search parameters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          <div className="h-10 bg-slate-50/50 border-t border-slate-100 flex items-center shadow-inner">
             {error && (
               <div className="px-6 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
                 <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Connectivity Alert: Using Proxy Data</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
