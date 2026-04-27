import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import DetailPanel from '../components/detail/DetailPanel';
import DataTable from '../components/tables/DataTable';
import PositionGallery from '../components/visuals/PositionGallery';
import { getColumnsMap } from '../constants/columns';
import { fetchSheetData } from '../services/sheetService';
import type { ProjectInfoRow, TableType } from '../types';

interface DataPageProps {
  token: string;
  spreadsheetId: string;
  onLogout: () => void;
  setDataSource: (source: 'live' | 'fallback') => void;
  setError: (error: string | null) => void;
  table?: TableType;
}

const TABLE_MAP: Record<string, TableType> = {
  employee: 'employee',
  'employee-position': 'employeePosition',
  position: 'position',
  'position-process': 'positionProcess',
  team: 'team',
  department: 'department',
  'reporting-lines': 'reportingLines',
  workflows: 'workflows',
  dashboard: 'dashboard',
  overview: 'overview',
};

const POSITION_GALLERY_TABLES = new Set<TableType>(['positionProcess']);
const POSITION_DETAIL_TABLES = new Set<TableType>(['position', 'positionProcess']);

const DataPage: React.FC<DataPageProps> = ({
  token,
  spreadsheetId,
  onLogout,
  setDataSource,
  setError,
  table: propTable,
}) => {
  const { tableId } = useParams<{ tableId: string }>();
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const activeTable = propTable || TABLE_MAP[tableId || ''] || 'employee';
  const columnsMap = getColumnsMap();

  useEffect(() => {
    if (!token || !spreadsheetId) {
      return;
    }

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        if (activeTable === 'employee') {
          const [employeeResponse, employeePositionResponse] = await Promise.all([
            fetchSheetData('employee', token, spreadsheetId),
            fetchSheetData('employeePosition', token, spreadsheetId),
          ]);

          if (employeeResponse.authRequired || employeePositionResponse.authRequired) {
            onLogout();
            return;
          }

          const positionsByEmployeeId = new Map<string, any[]>();
          employeePositionResponse.data.forEach((positionRow: any) => {
            const employeeId = positionRow['Employee ID'];
            if (!positionsByEmployeeId.has(employeeId)) {
              positionsByEmployeeId.set(employeeId, []);
            }
            positionsByEmployeeId.get(employeeId)?.push(positionRow);
          });

          const mergedEmployees = employeeResponse.data.map((employee: any) => ({
            ...employee,
            _positions: positionsByEmployeeId.get(employee['Employee ID']) || [],
          }));

          setData(mergedEmployees);
          setEmployees(mergedEmployees);
          setDataSource(employeeResponse.source);

          if (employeeResponse.source === 'fallback' && employeeResponse.error) {
            setError(employeeResponse.error);
          }
        } else {
          const response = await fetchSheetData(activeTable, token, spreadsheetId);
          if (response.authRequired) {
            onLogout();
            return;
          }

          setData(response.data);
          setDataSource(response.source);

          if (POSITION_DETAIL_TABLES.has(activeTable)) {
            const employeeResponse = await fetchSheetData('employee', token, spreadsheetId);
            if (!employeeResponse.authRequired) {
              setEmployees(employeeResponse.data);
            }
          }

          if (response.source === 'fallback' && response.error) {
            setError(response.error);
          }
        }
      } catch (err) {
        console.error('Data load error:', err);
        setError('Failed to load table data.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
    setSelectedRow(null);
  }, [activeTable, onLogout, setDataSource, setError, spreadsheetId, token]);

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
              <p className="text-3xl font-extrabold text-blue-600">{new Set((employees.length ? employees : data).map((entry) => entry.Team)).size}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Active Roles</h3>
              <p className="text-3xl font-extrabold text-indigo-600">{new Set((employees.length ? employees : data).map((entry) => entry.Position)).size}</p>
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
                columns={columnsMap.employee}
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
                {data.map((row: ProjectInfoRow & { _internalId?: string }, index: number) => {
                  const isExpanded = expandedIndex === index;
                  const itemKey = row._internalId || `overview-item-${index}`;

                  return (
                    <div key={itemKey} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                      >
                        {row.Item && (
                          <h2 className={`text-xl font-bold transition-colors ${isExpanded ? 'text-blue-600' : 'text-slate-800'}`}>{row.Item}</h2>
                        )}
                        <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            <div className="px-8 pb-8 pt-2">
                              <div className="prose prose-slate max-w-none">
                                {row.Detail ? (
                                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">{row.Detail}</p>
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
      ) : POSITION_GALLERY_TABLES.has(activeTable) ? (
        <PositionGallery key="position-gallery-root" data={data} isLoading={loading} onRowClick={setSelectedRow} />
      ) : (
        <DataTable
          key={activeTable}
          data={data}
          columns={columnsMap[activeTable] || []}
          isLoading={loading}
          onRowClick={setSelectedRow}
          searchPlaceholder={`Search ${tableId?.replace('-', ' ') || activeTable} records...`}
        />
      )}

      <DetailPanel selectedRow={selectedRow} onClose={() => setSelectedRow(null)} activeTable={activeTable} allData={activeTable === 'employee' ? data : employees} />
    </>
  );
};

export default DataPage;
