import { useState, useEffect } from "react";
import { Table, Tag, Button, Space, Modal, Select, message } from "antd";
import { evalApi, modelsApi } from "../../services/api";
import { EvalSession, EvalResult, LlmModel } from "../../types";
import dayjs from "dayjs";

const statusColor: Record<string, string> = {
  pending: "default",
  running: "processing",
  completed: "success",
  failed: "error",
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<EvalSession[]>([]);
  const [models, setModels] = useState<LlmModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [detail, setDetail] = useState<EvalSession | null>(null);

  const load = async () => {
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
  };

  useEffect(() => {
    load();
  }, [typeFilter]);

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
        <Tag color={v === "compare" ? "blue" : "purple"}>
          {v === "compare" ? "对比" : "批量"}
        </Tag>
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
              const res = await evalApi.getSession(record.id);
              setDetail(res.data);
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

  const resultColumns = [
    {
      title: "模型",
      dataIndex: "modelId",
      key: "modelId",
      width: 150,
      render: (v: string) => models.find((m) => m.id === v)?.name ?? v,
    },
    { title: "Prompt", dataIndex: "prompt", key: "prompt", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag>,
    },
    {
      title: "分数",
      dataIndex: "score",
      key: "score",
      width: 60,
      render: (v: number) => (v != null ? v.toFixed(1) : "-"),
    },
    {
      title: "输入Token",
      dataIndex: "tokensInput",
      key: "tokensInput",
      width: 90,
    },
    {
      title: "输出Token",
      dataIndex: "tokensOutput",
      key: "tokensOutput",
      width: 90,
    },
    {
      title: "耗时",
      dataIndex: "responseTimeMs",
      key: "responseTimeMs",
      width: 80,
      render: (v: number) => (v ? `${v}ms` : "-"),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <Select
          placeholder="筛选类型"
          allowClear
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "compare", label: "实时对比" },
            { value: "batch", label: "批量测评" },
          ]}
          style={{ width: 160 }}
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

      <Modal
        title="会话详情"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={900}
      >
        <Table
          rowKey="id"
          size="small"
          columns={resultColumns}
          dataSource={detail?.results ?? []}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (r: EvalResult) => (
              <div>
                <div>
                  <strong>回答：</strong>
                  <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                    {r.response}
                  </pre>
                </div>
                {r.scoreComment && (
                  <div>
                    <strong>评语：</strong>
                    {r.scoreComment}
                  </div>
                )}
                {r.error && (
                  <div style={{ color: "red" }}>
                    <strong>错误：</strong>
                    {r.error}
                  </div>
                )}
              </div>
            ),
          }}
        />
      </Modal>
    </>
  );
}
