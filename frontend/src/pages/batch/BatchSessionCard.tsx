import { useEffect, useRef } from "react";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExportOutlined,
  EyeOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Button, Progress, Space, Tag } from "antd";
import dayjs from "dayjs";

import { evalApi } from "../../services/api";
import { EvalSession, LlmModel } from "../../types";

interface Props {
  session: EvalSession;
  models: LlmModel[];
  onUpdate: (session: EvalSession) => void;
  onViewResult: (session: EvalSession) => void;
  onExport: (session: EvalSession) => void;
}

const STATUS_CONFIG = {
  pending: { color: "default" as const, icon: <ClockCircleOutlined />, label: "等待中" },
  running: { color: "processing" as const, icon: <LoadingOutlined />, label: "运行中" },
  completed: { color: "success" as const, icon: <CheckCircleOutlined />, label: "已完成" },
  failed: { color: "error" as const, icon: <CloseCircleOutlined />, label: "失败" },
};

export default function BatchSessionCard({
  session,
  models,
  onUpdate,
  onViewResult,
  onExport,
}: Props) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (session.status === "pending" || session.status === "running") {
      timerRef.current = setInterval(async () => {
        const res = await evalApi.getSession(session.id);
        onUpdate(res.data);
      }, 3000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session.id, session.status, onUpdate]);

  const statusCfg = STATUS_CONFIG[session.status];
  const total = session._count?.results ?? 0;
  const completedCount =
    session.results?.filter(
      (r) => r.status === "success" || r.status === "failed"
    ).length ?? 0;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // 各模型平均分（completed + 有评分时）
  const scoreMap: Record<string, number[]> = {};
  if (session.status === "completed" && session.results) {
    for (const r of session.results) {
      if (r.score != null) {
        if (!scoreMap[r.modelId]) scoreMap[r.modelId] = [];
        scoreMap[r.modelId].push(r.score);
      }
    }
  }
  const avgScores = Object.entries(scoreMap).map(([modelId, scores]) => ({
    name: models.find((m) => m.id === modelId)?.name ?? modelId.slice(0, 8),
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
  }));

  const isActive = session.status === "pending" || session.status === "running";

  return (
    <div className="glass-card px-5 py-4 flex flex-col gap-3 min-h-40">
      {/* 标题行 */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-sm leading-tight break-all">
          {session.name || session.id.slice(0, 8)}
        </span>
        <Tag icon={statusCfg.icon} color={statusCfg.color} className="shrink-0">
          {statusCfg.label}
        </Tag>
      </div>

      {/* 进度条（pending/running 且有总数时显示） */}
      {isActive && total > 0 && (
        <Progress
          percent={percent}
          size="small"
          format={() => `${completedCount}/${total}`}
        />
      )}

      {/* 平均分摘要 */}
      {avgScores.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          {avgScores.map(({ name, avg }) => (
            <span key={name}>
              {name}:{" "}
              <span className="font-medium text-primary">{avg.toFixed(1)}</span>
            </span>
          ))}
        </div>
      )}

      {/* 结果数 */}
      <div className="text-xs text-gray-500">
        结果数：{session._count?.results ?? "-"}
      </div>

      {/* 时间 */}
      <div className="text-xs text-gray-400">
        {dayjs(session.createdAt).format("MM-DD HH:mm")}
      </div>

      {/* 操作按钮（推到底部） */}
      <Space size="small" className="mt-auto">
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onViewResult(session)}
        >
          查看结果
        </Button>
        <Button
          size="small"
          icon={<ExportOutlined />}
          onClick={() => onExport(session)}
        >
          导出
        </Button>
      </Space>
    </div>
  );
}
