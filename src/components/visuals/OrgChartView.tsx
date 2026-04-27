import React, { useLayoutEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react';

import { escapeHtml, parseDriveImage } from '../../services/sheetService';
import type { Employee } from '../../types';

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

  useLayoutEffect(() => {
    if (!data.length || !chartContainerRef.current) {
      return;
    }

    const uniqueData = Array.from(new Map(data.map((item) => [item['Employee ID'], item])).values());

    const filteredData = uniqueData.filter((employee) => {
      const hasPosition = employee.Position && String(employee.Position).trim() !== '';
      const hasReportTo = employee['Report to'] && String(employee['Report to']).trim() !== '';
      const isPotentialRoot =
        hasPosition &&
        !hasReportTo &&
        uniqueData.some(
          (other) =>
            (other['Report to'] === employee.Employee || other['Report to'] === employee['Employee ID']) &&
            other.Employee !== employee.Employee,
        );

      return hasPosition && (hasReportTo || isPotentialRoot);
    });

    if (!filteredData.length) {
      return;
    }

    const nameToId = new Map<string, string>();
    filteredData.forEach((employee) => {
      if (employee.Employee) {
        nameToId.set(employee.Employee, employee['Employee ID']);
      }
      nameToId.set(employee['Employee ID'], employee['Employee ID']);
    });

    const nodes: NodeData[] = filteredData.map((employee) => {
      const parentName = employee['Report to'];
      let parentId = parentName ? nameToId.get(parentName) || null : null;
      if (parentId === employee['Employee ID']) {
        parentId = null;
      }

      const rawImageUrl = (employee as any)['Image Link'] || (employee as any)._colT || (employee as any)._colJ || employee.Image || '';

      return {
        id: employee['Employee ID'],
        parentId,
        name: employee.Employee,
        position: employee.Position,
        team: employee.Team,
        imageUrl: parseDriveImage(rawImageUrl) || '',
      };
    });

    const roots = nodes.filter((node) => !node.parentId || !nodes.find((parent) => parent.id === node.parentId));
    if (roots.length > 1) {
      const virtualRootId = 'virtual-root';
      nodes.push({
        id: virtualRootId,
        parentId: null,
        name: 'NHAN SU PHUOC HUNG',
        position: 'Root Overview',
        team: 'Organization',
        imageUrl: '',
      });
      roots.forEach((root) => {
        root.parentId = virtualRootId;
      });
    }

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
      .nodeContent((datum) => {
        const isSelected = datum.data._highlighted;
        const safeName = escapeHtml(datum.data.name || 'Unknown');
        const safePosition = escapeHtml(datum.data.position || 'N/A');
        const safeTeam = escapeHtml(datum.data.team || 'N/A');
        const safeImageUrl = escapeHtml(datum.data.imageUrl || '');
        const initials = escapeHtml(
          (datum.data.name || 'Unknown')
            .split(' ')
            .map((part) => (part ? part[0] : ''))
            .join('')
            .slice(0, 2),
        );

        return `
          <div class="flex flex-col gap-2 bg-white rounded-xl shadow-md border-2 ${isSelected ? 'border-blue-500 ring-2 ring-blue-50/50' : 'border-slate-100'} w-[220px] overflow-hidden p-3 transition-all duration-300">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center relative">
                <div class="absolute inset-0 flex items-center justify-center text-slate-300 font-bold text-base bg-slate-50 uppercase">${initials}</div>
                ${
                  safeImageUrl
                    ? `<img src="${safeImageUrl}" class="w-full h-full object-cover relative z-10" referrerpolicy="no-referrer" onerror="this.style.display='none'" />`
                    : ''
                }
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-slate-900 font-bold text-xs truncate leading-tight uppercase tracking-tight">${safeName}</div>
                <div class="text-blue-600 font-semibold text-[9px] mt-0.5 leading-tight truncate uppercase tracking-widest">${safePosition}</div>
                <div class="mt-1 inline-flex px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-400 font-medium text-[8px] uppercase tracking-widest leading-none">
                  ${safeTeam}
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

    const resizeObserver = new ResizeObserver(() => {
      chartRef.current?.fit();
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
      }
    };
  }, [data]);

  return (
    <div className="flex-1 flex h-full flex-col min-h-0 bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]">
      <div className="absolute top-8 right-8 z-20 flex flex-col gap-2">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-1 flex flex-col overflow-hidden">
          <button onClick={() => chartRef.current?.zoomIn()} className="p-3 hover:bg-slate-50 text-slate-500 transition-colors border-b border-slate-100" title="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={() => chartRef.current?.zoomOut()} className="p-3 hover:bg-slate-50 text-slate-500 transition-colors border-b border-slate-100" title="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={() => chartRef.current?.fit()} className="p-3 hover:bg-slate-50 text-slate-500 transition-colors" title="Fit Screen">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={chartContainerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
}
