import React from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { formatDateValue, parseDriveImage, parseMultiValue } from '../../services/sheetService';
import Badge from '../ui/Badge';

interface DetailPanelProps {
  selectedRow: any | null;
  onClose: () => void;
  activeTable: string;
  allData?: any[];
}

const EMPLOYEE_FIELDS = ['Employee ID', 'Phone', 'Birth Date', 'Start Date', 'Official Date', 'End Date', 'Email', 'Employee Type', 'Status'];
const POSITION_FIELDS = ['Level', 'Team'];

const DetailPanel: React.FC<DetailPanelProps> = ({ selectedRow, onClose, activeTable, allData = [] }) => {
  if (!selectedRow) {
    return null;
  }

  const isEmployee = activeTable === 'employee';
  const isPosition = activeTable === 'position' || activeTable === 'positionProcess';

  const reporters = isEmployee && selectedRow.Employee ? allData.filter((employee) => employee['Report to'] === selectedRow.Employee) : [];
  const deptEmployees =
    isPosition && selectedRow.Team ? allData.filter((employee) => String(employee.Team || '').trim() === String(selectedRow.Team || '').trim()) : [];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/10 z-40 backdrop-blur-[1px]" />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
        className="absolute right-0 top-0 bottom-0 w-[420px] bg-white border-l border-slate-200 z-50 shadow-2xl flex flex-col"
      >
        <div className="h-[76px] px-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Operation Inspect</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors group">
            <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-10 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden shadow-inner mb-6">
              {(() => {
                const rawImage = selectedRow['Image Link'] || selectedRow.Image || selectedRow._colT || selectedRow._colJ;
                const imageUrl = parseDriveImage(rawImage);

                return imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-200 bg-slate-50">
                    {(selectedRow.Employee || selectedRow.Team || selectedRow.Position)?.charAt(0)}
                  </div>
                );
              })()}
            </div>
            <h4 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">{selectedRow.Employee || selectedRow.Position || selectedRow.Team}</h4>
            <p className="text-blue-600 font-bold text-sm mt-2 uppercase tracking-wide">{selectedRow.Position || selectedRow.Manager || activeTable.replace(/([A-Z])/g, ' $1')}</p>
          </div>

          <div className="space-y-8">
            {Object.entries(selectedRow).map(([key, value]) => {
              const excludedKeys = ['Image', 'Image Link', '', 'Employee', 'Team', 'Position'];
              if (excludedKeys.includes(key) || key.startsWith('_') || !value) {
                return null;
              }

              if (isEmployee && !EMPLOYEE_FIELDS.includes(key)) {
                return null;
              }

              if (isPosition && !POSITION_FIELDS.includes(key)) {
                return null;
              }

              const isMultiValue = key === 'Team' || key === 'Position' || key === 'Department';

              return (
                <div key={key} className="space-y-2">
                  <label className="text-[9px] uppercase font-black text-slate-300 tracking-[0.15em] block">{key}</label>
                  <div className="text-sm font-bold text-slate-700">
                    {isMultiValue ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {parseMultiValue(String(value)).map((part, index) => (
                          <Badge key={index}>{part}</Badge>
                        ))}
                      </div>
                    ) : key === 'Email' ? (
                      <a href={`mailto:${value}`} className="text-blue-600 underline decoration-blue-200 underline-offset-4">
                        {String(value)}
                      </a>
                    ) : key === 'Phone' ? (
                      <a href={`tel:${value}`} className="font-mono tracking-tighter tabular-nums">
                        {String(value)}
                      </a>
                    ) : key.toLowerCase().includes('date') ? (
                      <span className="leading-relaxed">{formatDateValue(value)}</span>
                    ) : (
                      <span className="leading-relaxed">{String(value)}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {isEmployee && reporters.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <label className="text-[9px] uppercase font-black text-slate-300 tracking-[0.15em] block">Members Reporting To</label>
                <div className="flex flex-col gap-2">
                  {reporters.map((reporter, index) => (
                    <div key={`${reporter._internalId || 'rep'}-${index}`} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                        {reporter.Employee?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 leading-none">{reporter.Employee}</span>
                        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">{reporter.Position}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isPosition && deptEmployees.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <label className="text-[9px] uppercase font-black text-slate-300 tracking-[0.15em] block">Department Members</label>
                <div className="flex flex-col gap-2">
                  {deptEmployees.map((employee, index) => (
                    <div key={`${employee._internalId || 'emp'}-${index}`} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                        {employee.Employee?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 leading-none">{employee.Employee}</span>
                        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">{employee.Position}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:shadow-slate-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Confirm & Back
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

export default DetailPanel;
