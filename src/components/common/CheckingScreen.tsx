import React from 'react';

const CheckingScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Verifying Identity...</p>
    </div>
  );
};

export default CheckingScreen;
