// src/utils/formatAIText.tsx
import React from "react";

/**
 * Parses AI-generated text with **bold**, numbered lists,
 * bullet points and paragraphs into formatted React elements.
 */
export function formatAIText(text: string): React.ReactNode {
  if (!text?.trim()) return null;

  // ── Split into blocks by double newline or bold headings ──────────────
  const lines = text
    .replace(/\*\*([^*]+)\*\*/g, "\n**$1**\n") // ensure headings get their own line
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const elements: React.ReactNode[] = [];
  let numberedItems: string[] = [];
  let bulletItems:   string[] = [];
  let key = 0;

  const flushNumbered = () => {
    if (numberedItems.length === 0) return;
    elements.push(
      <ol key={key++} className="flex flex-col gap-2 my-2 pl-1">
        {numberedItems.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold mt-0.5"
              style={{ background: "#FF4D00", color: "white", minWidth: 20 }}
            >
              {i + 1}
            </span>
            <span className="text-[13px] text-[#3a3a3a] leading-relaxed">
              {renderInline(item)}
            </span>
          </li>
        ))}
      </ol>
    );
    numberedItems = [];
  };

  const flushBullets = () => {
    if (bulletItems.length === 0) return;
    elements.push(
      <ul key={key++} className="flex flex-col gap-1.5 my-2 pl-1">
        {bulletItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span
              className="shrink-0 w-1.5 h-1.5 rounded-full mt-2"
              style={{ background: "#FF4D00", minWidth: 6 }}
            />
            <span className="text-[13px] text-[#3a3a3a] leading-relaxed">
              {renderInline(item)}
            </span>
          </li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  for (const line of lines) {
    // ── Numbered list: "1. text" or "1) text" ──
    const numberedMatch = line.match(/^\d+[.)]\s+(.+)/);
    if (numberedMatch) {
      flushBullets();
      numberedItems.push(numberedMatch[1]);
      continue;
    }

    // ── Bullet list: "- text" or "* text" or "• text" ──
    const bulletMatch = line.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      flushNumbered();
      bulletItems.push(bulletMatch[1]);
      continue;
    }

    // ── Bold heading: **Text** on its own line ──
    const headingMatch = line.match(/^\*\*([^*]+)\*\*:?$/);
    if (headingMatch) {
      flushNumbered();
      flushBullets();
      elements.push(
        <p key={key++} className="text-[13px] font-extrabold text-[#0A0A0A] mt-3 mb-0.5 tracking-tight">
          {headingMatch[1].replace(/:$/, "")}
        </p>
      );
      continue;
    }

    // ── Regular paragraph ──
    flushNumbered();
    flushBullets();
    elements.push(
      <p key={key++} className="text-[13px] text-[#3a3a3a] leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  // flush any remaining lists
  flushNumbered();
  flushBullets();

  return <div className="flex flex-col gap-1">{elements}</div>;
}

/**
 * Renders inline **bold** and `code` within a line of text.
 */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-[#0A0A0A]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-black/[0.07] text-[#FF4D00] text-[11px] font-mono px-1.5 py-0.5 rounded-md">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
