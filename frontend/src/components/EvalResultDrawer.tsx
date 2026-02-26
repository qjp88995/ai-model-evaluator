import { useEffect, useState } from "react";

import { Drawer, Tag } from "antd";

import { EvalResult, EvalSession, LlmModel } from "../types";
import { MarkdownRenderer } from "./markdown";

interface Props {
  session: EvalSession | null;
  models: LlmModel[];
  onClose: () => void;
}

export default function EvalResultDrawer({ session, models, onClose }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [session?.id]);

  const results = session?.results ?? [];

  const promptGroups = results.reduce<Record<string, EvalResult[]>>(
    (acc, r) => {
      if (!acc[r.prompt]) acc[r.prompt] = [];
      acc[r.prompt].push(r);
      return acc;
    },
    {},
  );
  const prompts = Object.keys(promptGroups);
  const selectedPrompt = prompts[selectedIndex] ?? "";
  const selectedResults = promptGroups[selectedPrompt] ?? [];

  const scoreMap: Record<string, number[]> = {};
  for (const r of results) {
    if (r.score != null) {
      if (!scoreMap[r.modelId]) scoreMap[r.modelId] = [];
      scoreMap[r.modelId].push(r.score);
    }
  }

  const modelIds = [...new Set(results.map((r) => r.modelId))];

  return (
    <Drawer
      title={
        session
          ? (session.name || session.id.slice(0, 8)) + " — 结果详情"
          : "结果详情"
      }
      open={!!session}
      onClose={onClose}
      size="large"
      styles={{
        wrapper: { width: "75%" },
        body: {
          padding: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        },
      }}
    >
      {/* 摘要栏 */}
      {Object.keys(scoreMap).length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-5 py-3 border-b border-gray-200 text-sm shrink-0">
          {Object.entries(scoreMap).map(([modelId, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const name =
              models.find((m) => m.id === modelId)?.name ?? modelId.slice(0, 8);
            return (
              <span key={modelId}>
                {name}:{" "}
                <span className="font-semibold text-primary">
                  {avg.toFixed(1)} 分
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* 主体 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧 Prompt 列表 */}
        <div className="w-48 shrink-0 border-r border-gray-200 overflow-y-auto">
          {prompts.map((prompt, idx) => (
            <div
              key={prompt}
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-2 text-xs cursor-pointer leading-relaxed border-b border-gray-100 hover:bg-gray-50 ${
                idx === selectedIndex
                  ? "bg-purple-50 text-primary font-medium"
                  : "text-gray-600"
              }`}
            >
              <span className="line-clamp-3">{prompt}</span>
            </div>
          ))}
          {prompts.length === 0 && (
            <div className="px-3 py-4 text-xs text-gray-400 text-center">
              暂无数据
            </div>
          )}
        </div>

        {/* 右侧各模型回答 */}
        <div className="flex-1 overflow-y-auto">
          {modelIds.length > 0 ? (
            <div className="flex divide-x divide-gray-200 min-h-full">
              {modelIds.map((modelId) => {
                const result = selectedResults.find(
                  (r) => r.modelId === modelId,
                );
                const modelName =
                  models.find((m) => m.id === modelId)?.name ??
                  modelId.slice(0, 8);
                return (
                  <div key={modelId} className="flex-1 px-4 py-4 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-sm">{modelName}</span>
                      {result?.score != null && (
                        <Tag color="blue">{result.score.toFixed(1)} 分</Tag>
                      )}
                      {result?.status === "failed" && (
                        <Tag color="error">失败</Tag>
                      )}
                    </div>
                    {result?.error ? (
                      <div className="text-red-500 text-sm">{result.error}</div>
                    ) : (
                      <MarkdownRenderer content={result?.response ?? ""} />
                    )}
                    {result?.scoreComment && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <span className="font-medium">评语：</span>
                        {result.scoreComment}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              暂无结果
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
