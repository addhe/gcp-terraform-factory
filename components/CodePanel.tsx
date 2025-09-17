
import React, { useState, useEffect } from 'react';
import type { GeneratedFiles } from '../types';
import { ClipboardIcon, CheckIcon, ExclamationIcon } from './icons';

interface CodePanelProps {
  files: GeneratedFiles | null;
  isLoading: boolean;
  error: string | null;
}

type TabName = keyof GeneratedFiles | 'setup_sh' | 'license';

const TAB_NAMES: { key: TabName, name: string }[] = [
  { key: 'main_tf', name: 'main.tf' },
  { key: 'variables_tf', name: 'variables.tf' },
  { key: 'outputs_tf', name: 'outputs.tf' },
  { key: 'readme_md', name: 'README.md' },
  { key: 'setup_sh', name: 'setup.sh' },
  { key: 'license', name: 'LICENSE' },
];

export const CodePanel: React.FC<CodePanelProps> = ({ files, isLoading, error }) => {
  const [activeTab, setActiveTab] = useState<TabName>('main_tf');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (files) {
      setActiveTab('main_tf');
    }
  }, [files]);
  
  const handleCopy = () => {
    if (files && files[activeTab]) {
      navigator.clipboard.writeText(files[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <svg className="animate-spin h-10 w-10 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg">Generating your infrastructure code...</p>
          <p className="text-sm">Gemini is thinking. This may take a moment.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400 p-4">
          <ExclamationIcon className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-bold mb-2">Generation Failed</h3>
          <p className="text-center text-red-300">{error}</p>
        </div>
      );
    }

    if (!files) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <h3 className="text-xl font-bold">Your generated code will appear here.</h3>
          <p>Configure your resources on the left and click "Generate".</p>
        </div>
      );
    }

    return (
      <div className="relative h-full">
        <pre className="h-full w-full overflow-auto p-4 bg-transparent text-gray-300 text-sm font-mono whitespace-pre-wrap break-words">
          <code>
            {files[activeTab]}
          </code>
        </pre>
        <button 
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 bg-gray-700/50 rounded-lg text-gray-400 hover:bg-gray-600/50 hover:text-white transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-gray-800">
        <div className="flex space-x-2 px-2 overflow-x-auto">
          {TAB_NAMES.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-b-2 border-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-grow overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
};
