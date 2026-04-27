import React from 'react';
import Badge from '../components/ui/Badge';
import { parseMultiValue, parseDriveImage } from '../services/sheetService';
import { Employee, Team, TableType } from '../types';
import { Network } from 'lucide-react';

export const getColumnsMap = (): Record<TableType, any[]> => {
  return {
    employee: [
      {
        key: 'Hình',
        label: 'Employee Name',
        sortable: false,
        width: 300,
        render: (val: string, item: Employee) => {
          const imageUrl = parseDriveImage((item as any)['Link hình'] || (item as any)._colT || (item as any)._colJ || val);
          return (
            <div className="flex items-center gap-3" id={`employee-${item['Employee ID']}`}>
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0 border border-slate-200 overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                    {item['Employee'] ? item['Employee'].split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '??'}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-slate-900 truncate uppercase tracking-tight">{item['Employee']}</span>
                <span className="text-[10px] items-center font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate shrink-0">
                  {item['Email']}
                </span>
              </div>
            </div>
          );
        }
      },
      { 
        key: 'Position', 
        label: 'Positions',
        render: (val: string) => (
          <div className="flex flex-wrap gap-1.5 overflow-hidden">
            {parseMultiValue(val).map((p, i) => (
              <Badge key={i} className="bg-slate-50 text-slate-600 border-slate-200 whitespace-nowrap">{p}</Badge>
            ))}
          </div>
        )
      },
      { 
        key: 'Team', 
        label: 'Teams',
        render: (val: string) => (
          <div className="flex flex-wrap gap-1.5">
            {parseMultiValue(val).map((t, i) => (
              <Badge key={i} className="bg-blue-50 text-blue-600 border-blue-100 whitespace-nowrap">{t}</Badge>
            ))}
          </div>
        )
      },
      { key: 'Report to', label: 'Report To', render: (val: string) => <span className="text-blue-600 font-bold hover:underline cursor-pointer truncate block">{val || '-'}</span> },
      { 
        key: 'Trạng thái', 
        label: 'Status',
        render: (val: string) => (
          <Badge className={
            val === 'Active' || val === 'Đang làm' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }>
            {val}
          </Badge>
        )
      },
      { key: 'SĐT', label: 'Phone', render: (val: string) => <span className="font-mono text-[11px] font-bold text-slate-500 tabular-nums">{val}</span> },
    ],
    position: [
      { key: 'Position', label: 'Role Name', render: (val: string) => <span className="font-extrabold text-slate-900">{val}</span> },
      { key: 'Team', label: 'Department', render: (val: string) => <Badge className="bg-blue-50 text-blue-600 border-blue-100">{val}</Badge> },
      { key: 'Cấp bậc', label: 'Grade', render: (val: string) => <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100">{val}</Badge> },
    ],
    team: [
      { 
        key: 'Team', 
        label: 'Hierarchy Unit', 
        render: (val: string, item: Team) => {
          const level = parseInt(item['Level'] || '0');
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {level > 0 && (
                  <div className="flex gap-1 opacity-20">
                    {Array.from({ length: level }).map((_, i) => (
                      <div key={i} className="w-2 h-0.5 bg-slate-900 rounded-full" />
                    ))}
                  </div>
                )}
                <span className="font-extrabold text-slate-900 leading-tight">{val}</span>
              </div>
              {item['Parent team'] && (
                <div className="flex items-center gap-1.5 mt-1 opacity-40 ml-1 border-l-2 border-slate-100 pl-2">
                  <Network className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">{item['Parent team']}</span>
                </div>
              )}
            </div>
          );
        }
      },
      { key: 'Level', label: 'Tier', render: (val: string) => <Badge className="bg-slate-50 text-slate-400 border-slate-100">Level {val}</Badge> },
      { 
        key: 'Manager', 
        label: 'Lead Manager', 
        render: (val: string) => {
          const displayVal = val?.trim();
          return displayVal ? (
            <span className="font-bold text-blue-600 hover:underline cursor-pointer">{displayVal}</span>
          ) : (
            <span className="text-slate-400 italic">Unassigned</span>
          );
        }
      },
    ],
    orgChart: [],
    employeePosition: [],
    positionProcess: [
      { key: 'Position', label: 'Role Name', render: (val: string) => <span className="font-extrabold text-slate-900">{val}</span> },
      { key: 'Team', label: 'Department', render: (val: string) => <Badge className="bg-blue-50 text-blue-600 border-blue-100">{val}</Badge> },
      { key: 'Cấp bậc', label: 'Grade', render: (val: string) => <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100">{val}</Badge> },
    ],
    department: [
      { key: 'Team', label: 'Department Name', render: (val: string) => <span className="font-extrabold text-slate-900">{val}</span> },
      { 
        key: 'Manager', 
        label: 'Department head', 
        render: (val: string) => {
          const displayVal = val?.trim();
          return displayVal ? (
            <span className="font-bold text-blue-600 underline">{displayVal}</span>
          ) : (
            <span className="text-slate-400 italic">Unassigned</span>
          );
        }
      }
    ],
    reportingLines: [
      { key: 'Employee', label: 'Staff Member', render: (val: string) => <span className="font-bold">{val}</span> },
      { key: 'Position', label: 'Role' },
      { key: 'Report to', label: 'Direct Manager', render: (val: string) => <span className="text-blue-600 font-bold">{val}</span> }
    ],
    workflows: [
      { key: 'Process', label: 'Workflow Process' },
      { key: 'Owner', label: 'Process Owner' },
      { key: 'Status', label: 'Status' }
    ],
    dashboard: [
      { key: 'Metric', label: 'Company Metric' },
      { key: 'Value', label: 'Value' },
      { key: 'Target', label: 'Target' }
    ],
    overview: [
      { key: 'Item', label: 'Item' },
      { key: 'Detail', label: 'Detail' }
    ],
    projectInfo: [
      { key: 'Item', label: 'Item' },
      { key: 'Detail', label: 'Detail' }
    ]
  };
};
