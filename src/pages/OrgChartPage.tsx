import React, { useState, useEffect } from 'react';
import OrgChartView from '../components/visuals/OrgChartView';
import { fetchSheetData } from '../services/sheetService';

interface OrgChartPageProps {
  token: string;
  spreadsheetId: string;
  onLogout: () => void;
  setDataSource: (source: 'live' | 'fallback') => void;
  setError: (error: string | null) => void;
}

const OrgChartPage: React.FC<OrgChartPageProps> = ({ 
  token, 
  spreadsheetId, 
  onLogout,
  setDataSource,
  setError
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !spreadsheetId) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchSheetData('orgChart', token, spreadsheetId);
        if (res.authRequired) {
          onLogout();
          return;
        }

        setData(res.data);
        setDataSource(res.source);
        if (res.source === 'fallback' && res.error) {
          setError(res.error);
        }
      } catch (err) {
        console.error("Org Chart Load Error:", err);
        setError("Failed to load organizational hierarchy");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token, spreadsheetId]);

  return (
    <div className="flex-1 overflow-hidden relative bg-slate-50/30">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm z-30">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Plotting Hierarchy...</p>
        </div>
      ) : (
        <OrgChartView data={data} />
      )}
    </div>
  );
};

export default OrgChartPage;
