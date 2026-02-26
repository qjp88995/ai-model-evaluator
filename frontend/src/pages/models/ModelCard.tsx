import { ApiOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space, Tag, Tooltip } from "antd";

import { LlmModel } from "../../types";
import { PROVIDER_COLORS, PROVIDERS } from "./providerConfig";

interface Props {
  model: LlmModel;
  testing: boolean;
  onTest: (id: string) => void;
  onEdit: (model: LlmModel) => void;
  onDelete: (id: string) => void;
}

export default function ModelCard({
  model,
  testing,
  onTest,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="glass-card px-5 py-4 flex flex-col gap-3 min-h-40">
      {/* 标题行：名称 + 服务商 Tag */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-sm leading-tight break-all">
          {model.name}
        </span>
        <Tag
          color={PROVIDER_COLORS[model.provider] ?? "default"}
          className="shrink-0"
        >
          {PROVIDERS.find((p) => p.value === model.provider)?.label ??
            model.provider}
        </Tag>
      </div>

      {/* Model ID */}
      <div className="text-xs text-gray-400 font-mono break-all">
        {model.modelId}
      </div>

      {/* 状态 Tag 行 */}
      <div className="flex flex-wrap gap-1.5">
        {model.isJudge && <Tag color="gold">裁判</Tag>}
        <Tag color={model.isActive ? "green" : "red"}>
          {model.isActive ? "启用" : "禁用"}
        </Tag>
      </div>

      {/* 关键参数 */}
      <div className="text-xs text-gray-500">
        温度 {model.temperature} · MaxTokens {model.maxTokens}
      </div>

      {/* 操作按钮（推到底部） */}
      <Space size="small" className="mt-auto">
        <Tooltip title="测试连通性">
          <Button
            size="small"
            icon={<ApiOutlined />}
            loading={testing}
            onClick={() => onTest(model.id)}
          />
        </Tooltip>
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => onEdit(model)}
        />
        <Popconfirm title="确认删除?" onConfirm={() => onDelete(model.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    </div>
  );
}
