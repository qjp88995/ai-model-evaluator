import { useMemo } from "react";

import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import CodeBlock from "./CodeBlock";

// ── 流式预处理 ──────────────────────────────────────────────────────────────
// 在流式输出时，代码块或 LaTeX 块可能尚未闭合，导致 remark 将其降级为普通段落，
// 待语法补全时触发布局突变（闪烁）。此函数在传入 react-markdown 前补全缺失的闭合符。
function normalizeForStreaming(content: string): string {
  let result = content;

  // 若 ``` 出现次数为奇数，说明有未闭合的代码块
  const fences = result.match(/```/g) ?? [];
  if (fences.length % 2 !== 0) {
    result += "\n```";
  }

  // 若 $$ 出现次数为奇数，说明有未闭合的 LaTeX 块
  const blockMath = result.match(/\$\$/g) ?? [];
  if (blockMath.length % 2 !== 0) {
    result += "$$";
  }

  return result;
}

// ── 插件（定义在组件外，引用稳定，避免每次渲染重建） ────────────────────────
const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeHighlight, rehypeKatex];

// ── 自定义渲染组件 ──────────────────────────────────────────────────────────
const components: Components = {
  // 不渲染默认的 <pre>，让 CodeBlock 自己负责容器
  pre({ children }) {
    return <>{children}</>;
  },
  // 代码：区分块级（有 language-xxx class）和行内
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    if (match) {
      return (
        <CodeBlock language={match[1]} className={className}>
          {children}
        </CodeBlock>
      );
    }
    // 行内代码
    return (
      <code
        className="px-1.5 py-0.5 rounded text-sm bg-white/8 border border-(--glass-border) text-violet-300 font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
};

// ── 主组件 ──────────────────────────────────────────────────────────────────
interface MarkdownRendererProps {
  /** Markdown 字符串，流式时为不断增长的字符串 */
  content: string;
  /** true 时末尾显示光标 ▊，流式结束后传 false */
  streaming?: boolean;
  /** 追加到外层容器的 Tailwind class */
  className?: string;
}

export default function MarkdownRenderer({
  content,
  streaming = false,
  className,
}: MarkdownRendererProps) {
  const processedContent = useMemo(
    () => (streaming ? normalizeForStreaming(content) : content),
    [content, streaming],
  );

  return (
    <div className={`markdown-body text-sm text-slate-200 ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
      {streaming && <span className="cursor">▊</span>}
    </div>
  );
}
