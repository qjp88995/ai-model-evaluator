import { useCallback, useEffect, useState } from "react";

import { App, Button, Select, Space, Table, Tag } from "antd";
import dayjs from "dayjs";

import EvalResultDrawer from "@/components/EvalResultDrawer";
import { evalApi, modelsApi } from "@/services/api";
import { EvalSession, LlmModel } from "@/types";

const statusColor: Record<string, string> = {
  pending: "default",
  running: "processing",
  completed: "success",
  failed: "error",
};

export default function HistoryPage() {
  const { message } = App.useApp();
  const [sessions, setSessions] = useState<EvalSession[]>([]);
  const [models, setModels] = useState<LlmModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [detail, setDetail] = useState<EvalSession | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, modelsRes] = await Promise.all([
        evalApi.listSessions(typeFilter),
        modelsApi.list(),
      ]);
      setSessions(sessionsRes.data);
      setModels(modelsRes.data);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async (id: string) => {
    const res = await evalApi.exportSession(id);
    const blob = new Blob([JSON.stringify(res.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 80,
      render: (v: string) => (
        <Tag color={v === "compare" ? "blue" : "purple"}>{v === "compare" ? "对比" : "批量"}</Tag>
      ),
    },
    {
      title: "名称/ID",
      key: "name",
      render: (_: any, r: EvalSession) => r.name || r.id.slice(0, 8),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag>,
    },
    {
      title: "结果数",
      key: "count",
      width: 80,
      render: (_: any, r: EvalSession) => r._count?.results ?? "-",
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "完成时间",
      dataIndex: "completedAt",
      key: "completedAt",
      width: 150,
      render: (v?: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-"),
    },
    {
      title: "操作",
      key: "actions",
      width: 160,
      render: (_: any, record: EvalSession) => (
        <Space>
          <Button
            size="small"
            onClick={async () => {
              try {
                const res = await evalApi.getSession(record.id);
                setDetail(res.data);
              } catch {
                message.error("加载详情失败");
              }
            }}
          >
            详情
          </Button>
          <Button size="small" onClick={() => handleExport(record.id)}>
            导出
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="glass-card px-6 py-5">
      <div className="mb-4 flex gap-2">
        <Select
          placeholder="筛选类型"
          allowClear
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "compare", label: "实时对比" },
            { value: "batch", label: "批量测评" },
          ]}
          className="w-40"
        />
        <Button onClick={load}>刷新</Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={sessions}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <EvalResultDrawer session={detail} models={models} onClose={() => setDetail(null)} />
    </div>
  );
}
