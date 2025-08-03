import React from 'react';
import Loading from "@/app/components/ui/loading/Loading";

interface CodeOutputProps {
  isOutputExpand: boolean;
  codeOutput: string;
  loading: boolean;
  codeStatus: string;
  onToggleOutputVisibility: () => void;
  onRunCode: () => void;
}

const CodeOutput: React.FC<CodeOutputProps> = ({
  isOutputExpand,
  codeOutput,
  loading,
  codeStatus,
  onToggleOutputVisibility,
  onRunCode
}) => {
  return (
    <div className={isOutputExpand ? "h-[40%]" : "h-[10%]"}>
      <div className="bg-[#252522] border-t border-gray-600">
        <div
          onClick={onToggleOutputVisibility}
          className="bg-[#1e1e1e] cursor-pointer flex items-center justify-between text-green-500 px-4 py-2 font-semibold hover:bg-[#2a2a2a] transition-colors duration-200"
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Output
          </span>
          <span>
            <svg
              className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
                isOutputExpand ? "rotate-180" : "rotate-0"
              }`}
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5 5 1 1 5"
              />
            </svg>
          </span>
        </div>
        {isOutputExpand && (
          <div className="relative">
            <textarea
              value={codeOutput}
              readOnly
              className="px-5 py-2 w-full h-[160px] outline-none bg-[#252522] text-white overflow-auto resize-none font-mono text-sm"
              placeholder="Code output will appear here..."
            />
            {codeOutput && (
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => navigator.clipboard.writeText(codeOutput)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors duration-200"
                  title="Copy output"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between items-center px-5 py-2 border-t border-gray-600 bg-[#1e1e1e]">
        <div className="text-xs text-gray-400">
          {loading && <span>Running code...</span>}
          {codeStatus && !loading && <span>Status: {codeStatus}</span>}
        </div>
        <button
          type="button"
          onClick={onRunCode}
          className="py-2 px-6 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-green-500 hover:bg-green-400 text-black transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <Loading status={codeStatus} />
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Run
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CodeOutput; 