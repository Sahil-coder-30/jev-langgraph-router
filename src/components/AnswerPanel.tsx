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
                  code({ inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeStr = String(children).replace(/\n$/, "");
                    return !inline ? (
                      <div className="code-block-wrapper">
                        <div className="code-block-header">
                          <div className="mac-dots">
                            <span className="dot dot-red" />
                            <span className="dot dot-yellow" />
                            <span className="dot dot-green" />
                          </div>
                          <span className="code-lang-label">{match ? match[1] : "code"}</span>
                          <CodeCopyButton code={codeStr} />
                        </div>
                        <pre className={className} {...props}>
                          <code>{children}</code>
                        </pre>
                      </div>
                    ) : (
                      <code className="inline-code" {...props}>
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
