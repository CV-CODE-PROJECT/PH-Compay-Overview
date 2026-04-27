import React from 'react';
import { X } from 'lucide-react';

interface ConfigErrorScreenProps {
  configError: string;
  googleClientId: string | null;
}

const ConfigErrorScreen: React.FC<ConfigErrorScreenProps> = ({ configError, googleClientId }) => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-8 font-sans">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center border border-red-100 mb-6 group">
        <X className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
      </div>
      <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Configuration Error</h1>
      <p className="text-slate-500 text-center max-w-md font-medium leading-relaxed mb-8 text-sm">
        {configError}
      </p>
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 w-full max-w-sm">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Details</p>
        <code className="text-[11px] font-mono text-slate-600 block break-all">
          auth_module_init: {googleClientId ? 'OK' : 'MISSING_CLIENT_ID'}
        </code>
      </div>
    </div>
  );
};

export default ConfigErrorScreen;
