import React from 'react';

export const Section: React.FC<React.PropsWithChildren<{ title: string; enabled: boolean; onToggle: (enabled: boolean) => void; }>> = ({ title, enabled, onToggle, children }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center cursor-pointer" onClick={() => onToggle(!enabled)}>
        <h3 className="font-bold text-lg text-white">{title}</h3>
        <div className={`relative inline-block w-12 h-6 rounded-full transition-colors duration-300 ${enabled ? 'bg-purple-500' : 'bg-gray-700'}`}>
          <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${enabled ? 'transform translate-x-6' : ''}`}></span>
        </div>
      </div>
      {enabled && (
        <div className="p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};
