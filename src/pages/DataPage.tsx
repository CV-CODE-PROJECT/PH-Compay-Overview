/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DataTable from '../components/tables/DataTable';
import PositionGallery from '../components/visuals/PositionGallery';
import { TableType } from '../types';
import { fetchSheetData } from '../services/sheetService';
import { getColumnsMap } from '../constants/columns';
import DetailPanel from '../components/detail/DetailPanel';

interface DataPageProps {
  token: string;
  spreadsheetId: string;
  onLogout: () => void;
  setDataSource: (source: 'live' | 'fallback') => void;
  setError: (error: string | null) => void;
  table?: TableType;
}

const DataPage: React.FC<DataPageProps> = ({ 
  token, 
  spreadsheetId, 
  onLogout,
  setDataSource,
  setError,
  table: propTable
}) => {
  const { tableId } = useParams<{ tableId: string }>();
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Map URL slug to TableType
  const tableMap: Record<string, TableType> = {
    'employee': 'employee',
    'employee-position': 'employeePosition',
    'position': 'position',
    'position-process': 'positionProcess',
    'team': 'team',
    'department': 'department',
    'reporting-lines': 'reportingLines',
    'workflows': 'workflows',
    'dashboard': 'dashboard',
    'overview': 'overview'
  };

  const activeTable = propTable || tableMap[tableId || ''] || 'employee';
  const columnsMap = getColumnsMap();

  useEffect(() => {
    if (!token || !spreadsheetId) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        if (activeTable === 'employee') {
          // Gộp Employee và Employee Position
          const [empRes, posRes] = await Promise.all([
            fetchSheetData('employee', token, spreadsheetId),
            fetchSheetData('employeePosition', token, spreadsheetId)
          ]);

          if (empRes.authRequired || posRes.authRequired) {
            onLogout();
            return;
          }

          // Merge data by Employee ID
          const posMap = new Map();
          posRes.data.forEach(p => {
            const eid = p['Employee ID'];
            if (!posMap.has(eid)) posMap.set(eid, []);
            posMap.get(eid).push(p);
          });

          const merged = empRes.data.map((emp: any) => {
            const eid = emp['Employee ID'];
            const positions = posMap.get(eid) || [];
            
            // If positions found in Employee Position sheet, use them or append them
            return {
              ...emp,
              _positions: positions // Store for extra detail if needed
            };
          });

          setData(merged);
          setEmployees(merged);
          setDataSource(empRes.source);
          if (empRes.source === 'fallback' && empRes.error) {
            setError(empRes.error);
          }
        } else {
          const res = await fetchSheetData(activeTable as any, token, spreadsheetId);
          if (res.authRequired) {
            onLogout();
            return;
          }

          setData(res.data);
          setDataSource(res.source);

          // If position or positionProcess table, also fetch employees for DetailPanel
          if (activeTable === 'position' || activeTable === 'positionProcess') {
            const empRes = await fetchSheetData('employee', token, spreadsheetId);
            if (!empRes.authRequired) {
              setEmployees(empRes.data);
            }
          }

          if (res.source === 'fallback' && res.error) {
            setError(res.error);
          }
        }
      } catch (err) {
        console.error("Data Load Error:", err);
        setError("Failed to load table data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
    setSelectedRow(null); // Reset selection on page change
  }, [activeTable, token, spreadsheetId, onLogout, setDataSource, setError]);

  return (
    <>
      {activeTable === 'dashboard' ? (
        <div className="p-8 space-y-8 overflow-auto h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Employees</h3>
              <p className="text-3xl font-extrabold text-slate-900">{employees.length || data.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Departments</h3>
              <p className="text-3xl font-extrabold text-blue-600">
                {new Set((employees.length ? employees : data).map(e => e.Team)).size}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Active Roles</h3>
              <p className="text-3xl font-extrabold text-indigo-600">
                {new Set((employees.length ? employees : data).map(e => e.Position)).size}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Recent Employee Records</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <DataTable
                key={activeTable}
                data={data.slice(0, 10)}
                columns={columnsMap['employee']}
                isLoading={loading}
                onRowClick={setSelectedRow}
                searchPlaceholder="Search dashboard..."
              />
            </div>
          </div>
        </div>
      ) : activeTable === 'overview' ? (
        <div className="p-8 space-y-8 overflow-auto h-full">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Company Overview</h1>
                <p className="text-slate-500 font-medium">Core information and project details</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : data.length > 0 ? (
              <div className="space-y-4">
                {data.map((row, idx) => {
                  const isExpanded = expandedIndex === idx;
                  const itemKey = row._internalId || `overview-item-${idx}`;
                  return (
                    <div 
                      key={itemKey} 
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <button 
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                      >
                        {row.Item && (
                          <h2 className={`text-xl font-bold transition-colors ${isExpanded ? 'text-blue-600' : 'text-slate-800'}`}>
                            {row.Item}
                          </h2>
                        )}
                        <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </button>
                      
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <div className="px-8 pb-8 pt-2">
                              <div className="prose prose-slate max-w-none">
                                {row.Detail ? (
                                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
                                    {row.Detail}
                                  </p>
                                ) : (
                                  <p className="text-slate-400 italic">No details available.</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-slate-500">No project information found.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTable === 'positionProcess' ? (
        <PositionGallery 
          key="position-gallery-root"
          data={data}
          isLoading={loading}
          onRowClick={setSelectedRow}
        />
      ) : (
        <DataTable
          key={activeTable}
          data={data}
          columns={columnsMap[activeTable] || []}
          isLoading={loading}
          onRowClick={setSelectedRow}
          searchPlaceholder={`Search ${tableId?.replace('-', ' ') || activeTable} records...`}
          groupKey={activeTable === 'positionProcess' ? 'Team' as any : undefined}
        />
      )}
      
      <DetailPanel 
        selectedRow={selectedRow} 
        onClose={() => setSelectedRow(null)} 
        activeTable={activeTable} 
        allData={activeTable === 'employee' ? data : employees}
      />
    </>
  );
};

export default DataPage;
