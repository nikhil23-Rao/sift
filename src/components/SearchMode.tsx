import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion';

interface Source {
  id: number;
  title: string;
  url: string;
  favicon: string;
}

interface SearchModeProps {
  query: string;
  school?: string;
}

const SearchMode: React.FC<SearchModeProps> = ({ query, school }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    `Searching for "${query}"...`,
    "Gathering resources...",
    "Synthesizing with Gemini...",
    "Finalizing resources..."
  ];

  const getSourceStyle = (url: string) => {
    if (url.includes('reddit.com')) return 'hover:border-orange-500/50 hover:bg-orange-500/5';
    if (url.includes('youtube.com')) return 'hover:border-red-500/50 hover:bg-red-500/5';
    if (url.includes('khanacademy.org')) return 'hover:border-green-500/50 hover:bg-green-500/5';
    return 'hover:bg-white/[0.06] hover:border-white/[0.1]';
  };

  const getSourceIcon = (url: string) => {
    if (url.includes('reddit.com')) return <span className="text-[10px] text-orange-500/80 font-black mr-1">R/</span>;
    if (url.includes('youtube.com')) return <span className="text-[10px] text-red-500/80 font-black mr-1">YT</span>;
    return null;
  };

  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      setError(null);
      setLoadingStep(0);

      // Simulate step progression
      const stepInterval = setInterval(() => {
        setLoadingStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1500);

      try {
        // @ts-ignore - window.api is injected by preload
        const result = await window.api.studentSearch(query, school);
        setResponse(result.answer);
        setSources(result.sources);
      } catch (err: any) {
        console.error('Search failed:', err);
        setError(err.message || 'Failed to perform search');
      } finally {
        clearInterval(stepInterval);
        setIsLoading(false);
      }
    };

    if (query) {
      performSearch();
    }
  }, [query, school]);

  return (
    <div className="h-full flex flex-col p-8 pt-2 overflow-y-auto custom-scrollbar no-drag">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center flex-1 space-y-6 py-12"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500/10 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm font-medium animate-pulse">
                {steps[loadingStep]}
              </p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center flex-1 space-y-4 text-center py-12"
          >
            <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Markdown Content */}
            <div className="prose prose-invert prose-blue max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <p className="text-white/80 leading-relaxed mb-4">{children}</p>,
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-3 mt-6">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold text-white mb-2 mt-4">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 text-white/70">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4 text-white/70">{children}</ol>,
                  li: ({ children }) => <li className="marker:text-blue-400">{children}</li>,
                  code: ({ children }) => (
                    <code className="bg-white/5 rounded px-1.5 py-0.5 text-blue-300 font-mono text-sm">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-black/40 rounded-xl p-4 overflow-x-auto border border-white/5 my-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500/50 pl-4 italic text-white/60 my-4">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {response}
              </ReactMarkdown>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Resources Found</h4>
              <div className="flex flex-wrap gap-3">
                {sources.map(source => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-2 px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl transition-all group no-drag ${getSourceStyle(source.url)}`}
                  >
                    <div className="relative">
                      <img src={source.favicon} alt="" className="w-3.5 h-3.5 rounded group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex items-center">
                      {getSourceIcon(source.url)}
                      <span className="text-[11px] font-bold text-white/40 group-hover:text-white/80 truncate max-w-[150px]">
                        {source.title}
                      </span>
                    </div>
                    <span className="text-[9px] font-black text-white/10 group-hover:text-blue-400">
                      [{source.id}]
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchMode;
