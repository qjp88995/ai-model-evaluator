import { useEffect, useRef, useState } from "react";

import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { Button, message } from "antd";

// 从高亮后的 React 节点树中递归提取纯文本（用于复制功能）
function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node !== null && typeof node === "object" && "props" in node) {
    return extractText(
      (node as React.ReactElement<{ children?: React.ReactNode }>).props
        .children,
    );
  }
  return "";
}

interface CodeBlockProps {
  language: string;
  className?: string;
  children: React.ReactNode;
}

export default function CodeBlock({
  language,
  className,
  children,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = () => {
    const text = extractText(children);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        void message.success("已复制");
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        void message.error("复制失败，请手动复制");
      });
  };

  return (
    <div className="rounded-lg overflow-hidden border border-(--glass-border) my-4">
      {/* 顶栏：语言标签 + 复制按钮 */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-white/3 border-b border-(--glass-border)">
        <span className="text-xs text-slate-400 font-mono select-none">
          {language || "text"}
        </span>
        <Button
          type="text"
          size="small"
          icon={
            copied ? (
              <CheckOutlined className="text-green-400" />
            ) : (
              <CopyOutlined />
            )
          }
          onClick={handleCopy}
          className="text-slate-400 hover:text-slate-200"
        />
      </div>
      {/* 代码区：highlight.js 已处理子节点，渲染即可 */}
      <pre className="m-0 p-4 overflow-x-auto text-sm leading-relaxed bg-transparent">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
