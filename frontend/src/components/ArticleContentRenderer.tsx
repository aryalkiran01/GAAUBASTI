import React from "react";
import { Quote } from "lucide-react";

interface ArticleContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline formatting: **bold**, *italic*, [text](url)
 */
function renderInlineText(text: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  // Match bold (**text**), italic (*text*), or markdown link ([text](url))
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={keyIdx++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={keyIdx++} className="italic text-foreground/85 font-serif">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={keyIdx++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gaun-green hover:underline font-medium decoration-gaun-green/40 hover:decoration-gaun-green underline-offset-4"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    } else {
      parts.push(token);
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

export default function ArticleContentRenderer({ content, className = "" }: ArticleContentRendererProps) {
  if (!content) return null;

  // Split content into structural paragraphs/blocks
  const rawBlocks = content.split(/\n\n+/);

  return (
    <div className={`article-content-body space-y-6 text-foreground font-sans ${className}`}>
      {rawBlocks.map((block, blockIndex) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Heading 2 (## Title)
        if (trimmed.startsWith("## ")) {
          const headingText = trimmed.replace(/^##\s+/, "");
          return (
            <div key={blockIndex} className="pt-8 first:pt-0 mt-6 first:mt-0 border-t first:border-0 border-border/60">
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground leading-snug flex items-center gap-2.5">
                <span className="h-6 w-1 rounded-full bg-gaun-green shrink-0" />
                <span>{renderInlineText(headingText)}</span>
              </h2>
            </div>
          );
        }

        // 2. Heading 3 (### Subtitle)
        if (trimmed.startsWith("### ")) {
          const headingText = trimmed.replace(/^###\s+/, "");
          return (
            <div key={blockIndex} className="pt-4 mt-4">
              <h3 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground leading-snug">
                {renderInlineText(headingText)}
              </h3>
            </div>
          );
        }

        // 3. Blockquote (> Quote)
        if (trimmed.startsWith(">")) {
          const quoteLines = trimmed
            .split("\n")
            .map((line) => line.replace(/^>\s*/, "").trim())
            .filter(Boolean)
            .join(" ");

          return (
            <blockquote
              key={blockIndex}
              className="my-8 rounded-2xl bg-gradient-to-r from-gaun-green/10 via-gaun-green/5 to-transparent border-l-4 border-gaun-green p-6 sm:p-7 shadow-sm"
            >
              <div className="flex gap-3.5 items-start">
                <Quote className="h-7 w-7 text-gaun-green/60 shrink-0 rotate-180 mt-0.5" />
                <p className="text-lg sm:text-xl font-serif italic text-foreground/90 leading-relaxed">
                  {renderInlineText(quoteLines)}
                </p>
              </div>
            </blockquote>
          );
        }

        // 4. Ordered list (1. ..., 2. ...)
        const lines = trimmed.split("\n");
        const isOrderedList = lines.every((l) => /^\d+\.\s+/.test(l.trim()));
        if (isOrderedList) {
          return (
            <ol key={blockIndex} className="space-y-4 my-6 list-none pl-0">
              {lines.map((line, liIdx) => {
                const match = line.trim().match(/^(\d+)\.\s+(.*)/);
                const num = match ? match[1] : String(liIdx + 1);
                const itemText = match ? match[2] : line;

                return (
                  <li key={liIdx} className="flex items-start gap-3.5 group">
                    <span className="h-6 w-6 rounded-full bg-gaun-green/15 text-gaun-green font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:bg-gaun-green group-hover:text-white transition-colors">
                      {num}
                    </span>
                    <div className="text-[16px] sm:text-[17.5px] leading-[1.8] text-foreground/90 flex-1">
                      {renderInlineText(itemText)}
                    </div>
                  </li>
                );
              })}
            </ol>
          );
        }

        // 5. Unordered list (- ... or * ...)
        const isUnorderedList = lines.every((l) => /^[-*]\s+/.test(l.trim()));
        if (isUnorderedList) {
          return (
            <ul key={blockIndex} className="space-y-3.5 my-6 list-none pl-0">
              {lines.map((line, liIdx) => {
                const itemText = line.trim().replace(/^[-*]\s+/, "");
                return (
                  <li key={liIdx} className="flex items-start gap-3.5 group">
                    <span className="h-2 w-2 rounded-full bg-gaun-green shrink-0 mt-2.5 group-hover:scale-125 transition-transform" />
                    <div className="text-[16px] sm:text-[17.5px] leading-[1.8] text-foreground/90 flex-1">
                      {renderInlineText(itemText)}
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        }

        // 6. Mixed list with leading intro text (e.g. "When visiting Ghandruk:\n- Always ask...\n- Remove...")
        if (lines.length > 1 && lines.slice(1).every((l) => /^[-*]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim()))) {
          const intro = lines[0];
          const listItems = lines.slice(1);
          const isItemOrdered = /^\d+\.\s+/.test(listItems[0].trim());

          return (
            <div key={blockIndex} className="space-y-3 my-5">
              <p className="text-[16.5px] sm:text-[17.5px] font-medium text-foreground leading-relaxed">
                {renderInlineText(intro)}
              </p>
              {isItemOrdered ? (
                <ol className="space-y-3.5 list-none pl-0">
                  {listItems.map((li, idx) => {
                    const match = li.trim().match(/^(\d+)\.\s+(.*)/);
                    const num = match ? match[1] : String(idx + 1);
                    const itemText = match ? match[2] : li;
                    return (
                      <li key={idx} className="flex items-start gap-3.5">
                        <span className="h-6 w-6 rounded-full bg-gaun-green/15 text-gaun-green font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {num}
                        </span>
                        <div className="text-[16px] sm:text-[17.5px] leading-[1.8] text-foreground/90 flex-1">
                          {renderInlineText(itemText)}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <ul className="space-y-3 list-none pl-0">
                  {listItems.map((li, idx) => (
                    <li key={idx} className="flex items-start gap-3.5">
                      <span className="h-2 w-2 rounded-full bg-gaun-green shrink-0 mt-2.5" />
                      <div className="text-[16px] sm:text-[17.5px] leading-[1.8] text-foreground/90 flex-1">
                        {renderInlineText(li.trim().replace(/^[-*]\s+/, ""))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        }

        // 7. Regular Paragraph
        return (
          <p
            key={blockIndex}
            className="text-[16.5px] sm:text-[18px] leading-[1.85] sm:leading-[1.9] text-foreground/90 tracking-normal font-sans"
          >
            {renderInlineText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
