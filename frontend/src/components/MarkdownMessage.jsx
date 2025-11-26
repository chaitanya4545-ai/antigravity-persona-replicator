import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownMessage({ content }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                // Headings
                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100" {...props} />,

                // Paragraphs
                p: ({ node, ...props }) => <p className="mb-3 text-slate-700 dark:text-slate-300" {...props} />,

                // Lists
                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 space-y-1 text-slate-700 dark:text-slate-300" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-slate-700 dark:text-slate-300" {...props} />,
                li: ({ node, ...props }) => <li className="ml-4" {...props} />,

                // Code
                code: ({ node, inline, ...props }) =>
                    inline ? (
                        <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400" {...props} />
                    ) : (
                        <code className="block bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3 text-slate-800 dark:text-slate-200" {...props} />
                    ),
                pre: ({ node, ...props }) => <pre className="mb-3" {...props} />,

                // Blockquotes
                blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-indigo-500 pl-4 italic mb-3 text-slate-600 dark:text-slate-400" {...props} />
                ),

                // Links
                a: ({ node, ...props }) => (
                    <a className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                ),

                // Text formatting
                strong: ({ node, ...props }) => <strong className="font-bold text-slate-800 dark:text-slate-100" {...props} />,
                em: ({ node, ...props }) => <em className="italic" {...props} />,
                del: ({ node, ...props }) => <del className="line-through text-slate-500" {...props} />,

                // Tables
                table: ({ node, ...props }) => (
                    <div className="overflow-x-auto mb-3">
                        <table className="border-collapse border border-slate-300 dark:border-slate-600 w-full" {...props} />
                    </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-slate-100 dark:bg-slate-800" {...props} />,
                th: ({ node, ...props }) => (
                    <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 font-bold text-left text-slate-800 dark:text-slate-100" {...props} />
                ),
                td: ({ node, ...props }) => (
                    <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-slate-700 dark:text-slate-300" {...props} />
                ),

                // Horizontal rule
                hr: ({ node, ...props }) => <hr className="my-4 border-slate-300 dark:border-slate-600" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
