import React from 'react';
import { X } from 'lucide-react';

interface PermissionDeniedScreenProps {
  email?: string;
  onLogout: () => void;
}

const PermissionDeniedScreen: React.FC<PermissionDeniedScreenProps> = ({ email, onLogout }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/30">
      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-200 text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <X className="w-10 h-10 text-orange-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">ACCESS DENIED</h2>
        <p className="text-slate-500 font-medium mb-6 leading-relaxed">
          You are logged in as <span className="font-bold text-slate-900">{email}</span>, 
          but you do not have permission to access this portal.
        </p>
        <div className="p-5 bg-slate-50 rounded-2xl text-left border border-slate-100 mb-8 space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Common Reasons:</h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 font-medium">
            <li>Your email is not in the <span className="font-bold">Employee</span> sheet list.</li>
            <li>The Google Sheet has not been <span className="font-bold">shared</span> with your email.</li>
            <li>(If in testing) You are not in the <span className="font-bold">Test Users</span> list.</li>
          </ul>
        </div>
        <button 
          onClick={onLogout}
          className="w-full h-12 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
        >
          Sign out of this session
        </button>
      </div>
    </div>
  );
};

export default PermissionDeniedScreen;
