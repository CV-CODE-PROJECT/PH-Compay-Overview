import React from 'react';
import { Database } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/30">
      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-200 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <Database className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">RESTRICTED ACCESS</h2>
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          This version of the Phuoc Hung Atlas uses a private-data architecture.
          Please sign in with your company Google account to view internal resources.
        </p>
        <button 
          onClick={onSignIn}
          className="w-full h-14 bg-white border-2 border-slate-900 text-slate-900 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-900 hover:text-white transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
          SIGN IN WITH GOOGLE
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
