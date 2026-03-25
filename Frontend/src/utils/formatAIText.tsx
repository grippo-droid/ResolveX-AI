// src/utils/formatAIText.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

/**
 * Parses AI-generated markdown text into beautifully formatted React elements.
 * Replaces manual AST parsing with robust react-markdown.
 */
export function formatAIText(text: string): React.ReactNode {
  if (!text?.trim()) return null;

  return (
    <div className="flex flex-col gap-1 text-[13px] text-[#3a3a3a] leading-relaxed w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-[17px] font-extrabold text-[#0A0A0A] mt-5 mb-2.5 tracking-tight border-b border-black/5 pb-1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-[15px] font-extrabold text-[#0A0A0A] mt-4 mb-2 tracking-tight" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-[14px] font-extrabold text-[#0A0A0A] mt-3 mb-1.5 tracking-tight" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-[13px] font-bold text-[#0A0A0A] mt-2 mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="my-1.5 leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="flex flex-col gap-1.5 my-2.5 pl-5 list-disc marker:text-[#FF4D00]" {...props} />,
          ol: ({ node, ...props }) => <ol className="flex flex-col gap-1.5 my-2.5 pl-5 list-decimal marker:font-bold marker:text-[#FF4D00]" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-[#0A0A0A]" {...props} />,
          em: ({ node, ...props }) => <em className="text-[#555] italic" {...props} />,
          a: ({ node, ...props }) => (
            <a className="text-[#FF4D00] font-medium hover:underline underline-offset-2 transition-all" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-[3px] border-[#FF4D00] pl-3.5 py-1.5 my-3 bg-[#FF4D00]/[0.03] text-[#555] max-w-full rounded-r-xl italic" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            return !inline ? (
              <div className="my-3 overflow-hidden rounded-xl border border-black/[0.08] shadow-sm">
                {match && match[1] && (
                  <div className="bg-[#f0f0f0] px-3 py-1.5 flex items-center text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider border-b border-black/[0.05]">
                    {match[1]}
                  </div>
                )}
                <pre className="bg-[#1C1C1C] text-[#E0E0E0] p-4 overflow-x-auto text-[12px] font-mono leading-relaxed">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-black/[0.05] text-[#FF4D00] text-[11.5px] font-mono px-1.5 py-0.5 rounded-md border border-black/[0.03]" {...props}>
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-black/10">
              <table className="w-full text-left border-collapse text-[12.5px]" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-[#F5F5F5] border-b border-black/10" {...props} />,
          th: ({ node, ...props }) => <th className="py-2.5 px-4 font-bold text-[#0A0A0A] whitespace-nowrap" {...props} />,
          td: ({ node, ...props }) => <td className="py-2.5 px-4 border-b border-black/5 last:border-0" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-4 border-black/10" {...props} />
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
