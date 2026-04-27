import React from 'react';
import { Network } from 'lucide-react';

import Badge from '../components/ui/Badge';
import { parseDriveImage, parseMultiValue } from '../services/sheetService';
import type { Employee, TableType, Team } from '../types';

export const getColumnsMap = (): Record<TableType, any[]> => ({
  employee: [
    {
      key: 'Image',
      label: 'Employee Name',
      sortable: false,
      width: 300,
      render: (value: string, item: Employee) => {
        const imageUrl = parseDriveImage(item['Image Link'] || (item as any)._colT || (item as any)._colJ || value);

        return (
          <div className="flex items-center gap-3" id={`employee-${item['Employee ID']}`}>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0 border border-slate-200 overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                  {item.Employee ? item.Employee.split(' ').map((part) => part[0]).join('').slice(0, 2) : '??'}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-slate-900 truncate uppercase tracking-tight">{item.Employee}</span>
              <span className="text-[10px] items-center font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate shrink-0">
                {item.Email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'Position',
      label: 'Positions',
      render: (value: string) => (
        <div className="flex flex-wrap gap-1.5 overflow-hidden">
          {parseMultiValue(value).map((position, index) => (
            <Badge key={index} className="bg-slate-50 text-slate-600 border-slate-200 whitespace-nowrap">
              {position}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'Team',
      label: 'Teams',
      render: (value: string) => (
        <div className="flex flex-wrap gap-1.5">
          {parseMultiValue(value).map((team, index) => (
            <Badge key={index} className="bg-blue-50 text-blue-600 border-blue-100 whitespace-nowrap">
              {team}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: 'Report to', label: 'Report To', render: (value: string) => <span className="text-blue-600 font-bold hover:underline cursor-pointer truncate block">{value || '-'}</span> },
    {
      key: 'Status',
      label: 'Status',
      render: (value: string) => (
        <Badge
          className={
            value === 'Active' || value === 'Đang làm'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }
        >
          {value}
        </Badge>
      ),
    },
    { key: 'Phone', label: 'Phone', render: (value: string) => <span className="font-mono text-[11px] font-bold text-slate-500 tabular-nums">{value}</span> },
  ],
  position: [
    { key: 'Position', label: 'Role Name', render: (value: string) => <span className="font-extrabold text-slate-900">{value}</span> },
    { key: 'Team', label: 'Department', render: (value: string) => <Badge className="bg-blue-50 text-blue-600 border-blue-100">{value}</Badge> },
    { key: 'Level', label: 'Grade', render: (value: string) => <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100">{value}</Badge> },
  ],
  team: [
    {
      key: 'Team',
      label: 'Hierarchy Unit',
      render: (value: string, item: Team) => {
        const level = Number.parseInt(item.Level || '0', 10);

        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {level > 0 && (
                <div className="flex gap-1 opacity-20">
                  {Array.from({ length: level }).map((_, index) => (
                    <div key={index} className="w-2 h-0.5 bg-slate-900 rounded-full" />
                  ))}
                </div>
              )}
              <span className="font-extrabold text-slate-900 leading-tight">{value}</span>
            </div>
            {item['Parent team'] && (
              <div className="flex items-center gap-1.5 mt-1 opacity-40 ml-1 border-l-2 border-slate-100 pl-2">
                <Network className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">{item['Parent team']}</span>
              </div>
            )}
          </div>
        );
      },
    },
    { key: 'Level', label: 'Tier', render: (value: string) => <Badge className="bg-slate-50 text-slate-400 border-slate-100">Level {value}</Badge> },
    {
      key: 'Manager',
      label: 'Lead Manager',
      render: (value: string) => {
        const displayValue = value?.trim();
        return displayValue ? (
          <span className="font-bold text-blue-600 hover:underline cursor-pointer">{displayValue}</span>
        ) : (
          <span className="text-slate-400 italic">Unassigned</span>
        );
      },
    },
  ],
  orgChart: [],
  employeePosition: [],
  positionProcess: [
    { key: 'Position', label: 'Role Name', render: (value: string) => <span className="font-extrabold text-slate-900">{value}</span> },
    { key: 'Team', label: 'Department', render: (value: string) => <Badge className="bg-blue-50 text-blue-600 border-blue-100">{value}</Badge> },
    { key: 'Level', label: 'Grade', render: (value: string) => <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100">{value}</Badge> },
  ],
  department: [
    { key: 'Team', label: 'Department Name', render: (value: string) => <span className="font-extrabold text-slate-900">{value}</span> },
    {
      key: 'Manager',
      label: 'Department Head',
      render: (value: string) => {
        const displayValue = value?.trim();
        return displayValue ? (
          <span className="font-bold text-blue-600 underline">{displayValue}</span>
        ) : (
          <span className="text-slate-400 italic">Unassigned</span>
        );
      },
    },
  ],
  reportingLines: [
    { key: 'Employee', label: 'Staff Member', render: (value: string) => <span className="font-bold">{value}</span> },
    { key: 'Position', label: 'Role' },
    { key: 'Report to', label: 'Direct Manager', render: (value: string) => <span className="text-blue-600 font-bold">{value}</span> },
  ],
  workflows: [
    { key: 'Process', label: 'Workflow Process' },
    { key: 'Owner', label: 'Process Owner' },
    { key: 'Status', label: 'Status' },
  ],
  dashboard: [
    { key: 'Metric', label: 'Company Metric' },
    { key: 'Value', label: 'Value' },
    { key: 'Target', label: 'Target' },
  ],
  overview: [
    { key: 'Item', label: 'Item' },
    { key: 'Detail', label: 'Detail' },
  ],
  projectInfo: [
    { key: 'Item', label: 'Item' },
    { key: 'Detail', label: 'Detail' },
  ],
});
