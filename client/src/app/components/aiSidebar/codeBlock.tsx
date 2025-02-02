import React from 'react';
import { Copy, Check } from 'lucide-react';


interface CodeBlockProps {
    code: string;
  }
  
const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative group">
      <pre className="text-sm bg-black/50 p-3 rounded-md overflow-x-auto font-mono border border-zinc-800">
        <code className="text-zinc-200">{code}</code>
      </pre>
      
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 rounded-md 
                 bg-zinc-800 hover:bg-zinc-700 
                 transition-colors duration-200
                 opacity-0 group-hover:opacity-100
                 focus:opacity-100 focus:outline-none
                 text-zinc-400 hover:text-zinc-200"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default CodeBlock;