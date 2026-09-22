"use client";

import React, { useState } from "react";
import { PipelineExecutionResult } from "@/lib/types";
import { Bot, Sparkles, ShieldAlert, Copy, Check, Clock, Hash, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AnswerPanelProps {
  result: PipelineExecutionResult | null;
  isLoading: boolean;
}

// Component for per-code-block copy button
const CodeCopyButton: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button className="code-copy-btn" onClick={onCopy} title="Copy code">
      {copied ? <Check size={12} color="var(--jev-emerald)" /> : <Copy size={12} />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
};

export const AnswerPanel: React.FC<AnswerPanelProps> = ({ result, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result?.response) return;
    navigator.clipboard.writeText(result.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result && !isLoading) {
    return (
      <div className="card-panel empty-answer-card">
        <div className="empty-answer-icon-box">
          <FileText size={24} color="var(--text-faint)" />
        </div>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Synthesized Model Output
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.25rem", maxWidth: "380px" }}>
            Click any scenario chip or type a custom prompt and click <strong>&quot;Run LangGraph Pipeline&quot;</strong> to watch live Jev probability routing.
          </p>
        </div>
      </div>
    );
  }

  const isMistral = result?.modelUsed?.includes("Mistral");
  const isGemini = result?.modelUsed?.includes("Gemini");
  const isBlocked = result?.isBlocked;

  let pillClass = "pill-gemini";
  let PillIcon = Sparkles;

  if (isMistral) {
    pillClass = "pill-mistral";
    PillIcon = Bot;
  } else if (isBlocked) {
    pillClass = "pill-security";
    PillIcon = ShieldAlert;
  }

  return (
    <div className="card-panel" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Header */}
      <div className="prompt-section-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div className="panel-icon-badge" style={{ background: "rgba(15, 23, 42, 0.06)", color: "var(--text-primary)" }}>
            <FileText size={16} />
          </div>
          <div>
            <span className="section-title">Synthesized Model Output</span>
            {result && (
              <span className={`model-pill-badge ${pillClass}`} style={{ marginLeft: "0.5rem" }}>
                <PillIcon size={12} />
                {result.modelUsed}
              </span>
            )}
          </div>
        </div>

        {result && (
          <button onClick={handleCopy} className="copy-all-btn">
            {copied ? <Check size={13} color="var(--jev-emerald)" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy Output"}</span>
          </button>
        )}
      </div>

      {isLoading && !result ? (
        <div className="answer-loading-container">
          <div className="status-pulse-ring">
            <div className="status-dot" style={{ width: 14, height: 14 }} />
          </div>
          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            Executing pipeline nodes in real-time...
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            TypeSafe Jev System One routing active
          </span>
        </div>
      ) : (
        <>
          {/* Scrollable Formatted Markdown Body */}
          <div className="answer-scroll-container">
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1({ children }) {
                    return (
                      <h1 className="text-sm sm:text-base font-bold text-white mt-4 mb-2 pb-1.5 border-b border-zinc-800/80 flex items-center gap-2">
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    return (
                      <h2 className="text-xs sm:text-sm font-bold text-zinc-100 mt-3.5 mb-1.5 flex items-center gap-2">
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }) {
                    return (
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mt-3 mb-1">
                        {children}
                      </h3>
                    );
                  },
                  h4({ children }) {
                    return (
                      <h4 className="text-xs font-semibold text-zinc-200 mt-2 mb-1">
                        {children}
                      </h4>
                    );
                  },
                  p({ children }) {
                    return <p className="leading-relaxed mb-2.5 last:mb-0 text-zinc-300">{children}</p>;
                  },
                  strong({ children }) {
                    return <strong className="font-bold text-white tracking-tight">{children}</strong>;
                  },
                  em({ children }) {
                    return <em className="italic text-zinc-200">{children}</em>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="my-3 border-l-4 border-blue-500 bg-blue-500/10 px-3.5 py-2 text-zinc-200 italic rounded-r-xl shadow-xs">
                        {children}
                      </blockquote>
                    );
                  },
                  ul({ children }) {
                    return (
                      <ul className="my-2.5 ml-4 list-disc space-y-1.5 text-zinc-300 marker:text-blue-400">
                        {children}
                      </ul>
                    );
                  },
                  ol({ children }) {
                    return (
                      <ol className="my-2.5 ml-4 list-decimal space-y-1.5 text-zinc-300 marker:text-blue-400 marker:font-bold">
                        {children}
                      </ol>
                    );
                  },
                  li({ children }) {
                    return <li className="leading-relaxed pl-0.5">{children}</li>;
                  },
                  hr() {
                    return <hr className="my-3.5 border-zinc-800" />;
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline underline-offset-2 hover:text-blue-300 font-medium"
                      >
                        {children}
                      </a>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="my-3 w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60 shadow-md">
                        <table className="w-full text-left text-xs text-zinc-300 divide-y divide-zinc-800">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return <thead className="bg-zinc-900/90 font-semibold text-zinc-100">{children}</thead>;
                  },
                  th({ children }) {
                    return <th className="px-3.5 py-2 text-[11px] font-semibold text-white">{children}</th>;
                  },
                  td({ children }) {
                    return <td className="px-3.5 py-2 text-[11px] border-t border-zinc-800/60 text-zinc-300">{children}</td>;
                  },
                  pre({ children }: any) {
                    return <>{children}</>;
                  },
                  code({ className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeStr = String(children).replace(/\n$/, "");
                    const isBlock = Boolean(match) || codeStr.includes("\n");

                    if (isBlock) {
                      const language = match ? match[1] : "code";
                      return (
                        <div className="code-block-wrapper my-3 w-full max-w-full overflow-hidden rounded-xl border border-zinc-800 bg-[#0d1117] shadow-xl">
                          <div className="code-block-header flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/90 px-3.5 py-1.5">
                            <div className="mac-dots flex items-center gap-1.5">
                              <span className="dot dot-red h-2.5 w-2.5 rounded-full bg-red-500/80" />
                              <span className="dot dot-yellow h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                              <span className="dot dot-green h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                              <span className="code-lang-label ml-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                                {language}
                              </span>
                            </div>
                            <CodeCopyButton code={codeStr} />
                          </div>
                          <div className="max-w-full overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-zinc-200">
                            <pre className="!m-0 !p-0 bg-transparent font-mono">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <code
                        className="inline-code rounded bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[11px] font-medium text-emerald-300 border border-zinc-700/50"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {result?.response || ""}
              </ReactMarkdown>
            </div>
          </div>

          {result && (
            <div className="answer-meta">
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Clock size={13} color="var(--text-muted)" />
                <strong>{result.totalLatencyMs}ms</strong> total latency ({result.jev.latencyMs}ms Jev decision)
              </span>
              {result.tokensEstimated > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Hash size={13} color="var(--text-muted)" />
                  ~{result.tokensEstimated} tokens
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
