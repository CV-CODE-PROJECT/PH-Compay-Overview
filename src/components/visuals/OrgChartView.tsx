/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { OrgChart } from 'd3-org-chart';
import { Employee } from '../../types';
import { User, ZoomIn, ZoomOut, Maximize, Search } from 'lucide-react';
import { parseDriveImage } from '../../services/sheetService';

interface OrgChartViewProps {
  data: Employee[];
}

interface NodeData {
  id: string;
  parentId: string | null;
  name: string;
  position: string;
  team: string;
  imageUrl: string;
  _highlighted?: boolean;
}

export default function OrgChartView({ data }: OrgChartViewProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<OrgChart<NodeData> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useLayoutEffect(() => {
    if (!data || data.length === 0 || !chartContainerRef.current) return;

    // Filter employees: must have position and relationship context
    // The requirement: "những nhân viên nào mà chưa có Position và Report to thì không hiển thị"
    // We interpret this as: must have a Position, AND (must have a Report to OR be a root who others report to)
    // Deduplicate by Employee ID to prevent chart breakage
    const uniqueData = Array.from(new Map(data.map(item => [item['Employee ID'], item])).values());

    const filteredData = uniqueData.filter(emp => {
      const hasPosition = emp.Position && String(emp.Position).trim() !== '';
      const hasReportTo = emp['Report to'] && String(emp['Report to']).trim() !== '';
      
      // A root is someone who has a position, no supervisor, but someone reports to them
      const isPotentialRoot = hasPosition && !hasReportTo && uniqueData.some(other => 
        (other['Report to'] === emp.Employee || other['Report to'] === emp['Employee ID']) && 
        other.Employee !== emp.Employee
      );

      return hasPosition && (hasReportTo || isPotentialRoot);
    });

    if (filteredData.length === 0) return;

    // 1. Transform flat employees into hierarchical nodes
    // Map of Employee Name -> ID to resolve "Report to" strings
    const nameToId = new Map<string, string>();
    filteredData.forEach(emp => {
      if (emp.Employee) nameToId.set(emp.Employee, emp['Employee ID']);
      nameToId.set(emp['Employee ID'], emp['Employee ID']);
    });

    const nodes: NodeData[] = filteredData.map(emp => {
      const parentName = emp['Report to'];
      let parentId: string | null = parentName ? (nameToId.get(parentName) || null) : null;
      
      // Prevent self-reference or circularity if data is messy
      if (parentId === emp['Employee ID']) parentId = null;

      // Try multiple potential image fields, prioritizing the new 'Link hình'
      const rawImageUrl = (emp as any)['Link hình'] || (emp as any)._colT || (emp as any)._colJ || emp['Hình'] || '';

      return {
        id: emp['Employee ID'],
        parentId: parentId,
        name: emp.Employee,
        position: emp.Position,
        team: emp.Team,
        imageUrl: parseDriveImage(rawImageUrl) || ''
      };
    });

    // Handle multiple roots by creating a virtual root if necessary
    const roots = nodes.filter(n => !n.parentId || !nodes.find(p => p.id === n.parentId));
    if (roots.length > 1) {
      const virtualRootId = 'virtual-root';
      nodes.push({
        id: virtualRootId,
        parentId: null,
        name: 'NHÂN SỰ PHƯỚC HƯNG',
        position: 'Root Overview',
        team: 'Organization',
        imageUrl: ''
      });
      roots.forEach(r => {
        r.parentId = virtualRootId;
      });
    }

    // 2. Initialize d3-org-chart
    const chart = new OrgChart<NodeData>()
      .container(chartContainerRef.current)
      .data(nodes)
      .layout('top')
      .compact(false)
      .nodeHeight(() => 100)
      .nodeWidth(() => 220)
      .childrenMargin(() => 60)
      .compactMarginBetween(() => 40)
      .compactMarginPair(() => 40)
      .neighbourMargin(() => 40)
      .nodeContent((d) => {
        const isSelected = d.data._highlighted;
        const name = d.data.name || 'Unknown';
        const initials = name.split(' ').map(n => n ? n[0] : '').join('').slice(0, 2);
        
        // Return template with image error handling
        return `
          <div class="flex flex-col gap-2 bg-white rounded-xl shadow-md border-2 ${isSelected ? 'border-blue-500 ring-2 ring-blue-50/50' : 'border-slate-100'} w-[220px] overflow-hidden p-3 transition-all duration-300">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center relative">
                <div class="absolute inset-0 flex items-center justify-center text-slate-300 font-bold text-base bg-slate-50 uppercase">${initials}</div>
                ${d.data.imageUrl 
                  ? `<img src="${d.data.imageUrl}" 
                          class="w-full h-full object-cover relative z-10" 
                          referrerPolicy="no-referrer" 
                          onerror="this.style.display='none'" 
                     />`
                  : ''
                }
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-slate-900 font-bold text-xs truncate leading-tight uppercase tracking-tight">${name}</div>
                <div class="text-blue-600 font-semibold text-[9px] mt-0.5 leading-tight truncate uppercase tracking-widest">${d.data.position || 'N/A'}</div>
                <div class="mt-1 inline-flex px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-400 font-medium text-[8px] uppercase tracking-widest leading-none">
                  ${d.data.team || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .render()
      .expandAll()
      .fit();

    chartRef.current = chart;

    // Handle initial sizing and cleanup
    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.fit();
      }
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
        resizeObserver.disconnect();
      }
    };
  }, [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chartRef.current || !searchTerm) return;
    
    // Search for the node
    const found = data.find(emp => 
      emp.Employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.Position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (found) {
      chartRef.current.clearHighlighting();
      chartRef.current.setUpToTheRootHighlighted(found['Employee ID']);
      chartRef.current.render();
    }
  };

  const resetZoom = () => chartRef.current?.fit();
  const zoomIn = () => chartRef.current?.zoomIn();
  const zoomOut = () => chartRef.current?.zoomOut();

  return (
    <div className="flex-1 flex h-full flex-col min-h-0 bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Visual Controls */}
      <div className="absolute top-8 right-8 z-20 flex flex-col gap-2">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-1 flex flex-col overflow-hidden">
          <button onClick={zoomIn} className="p-3 hover:bg-slate-50 text-slate-500 transition-colors border-b border-slate-100" title="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={zoomOut} className="p-3 hover:bg-slate-50 text-slate-500 transition-colors border-b border-slate-100" title="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={resetZoom} className="p-3 hover:bg-slate-50 text-slate-500 transition-colors" title="Fit Screen">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        ref={chartContainerRef} 
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
