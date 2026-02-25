import { useEffect, useState } from "react";

import { PlayCircleOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import dayjs from "dayjs";

import { MarkdownRenderer } from "../../components/markdown";
import { evalApi, modelsApi, testsetsApi } from "../../services/api";
import { EvalResult, EvalSession, LlmModel, TestSet } from "../../types";

export default function BatchPage() {
  const [models, setModels] = useState<LlmModel[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [sessions, setSessions] = useState<EvalSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<EvalSession | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    const [modelsRes, setsRes, sessionsRes] = await Promise.all([
      modelsApi.list(),
      testsetsApi.list(),
      evalApi.listSessions("batch"),
    ]);
    setModels(modelsRes.data.filter((m: LlmModel) => m.isActive));
    setTestSets(setsRes.data);
    setSessions(sessionsRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleStart = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await evalApi.createBatch(values);
      message.success("批量测评已启动，后台运行中");
      form.resetFields();
      load();
    } catch (err: any) {
      message.error(err.response?.data?.message ?? "启动失败");
    } finally {
      setLoading(false);
    }
  };

  const judgeModels = models.filter((m) => m.isJudge);

  const statusColor: Record<string, string> = {
    pending: "default",
    running: "processing",
    completed: "success",
    failed: "error",
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (v: string, r: EvalSession) => v || r.id.slice(0, 8),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag>,
    },
    {
      title: "结果数",
      key: "count",
      render: (_: any, r: EvalSession) => r._count?.results ?? "-",
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => dayjs(v).format("MM-DD HH:mm"),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: EvalSession) => (
        <Space>
          <Button
            size="small"
            onClick={async () => {
              const res = await evalApi.getSession(record.id);
              setDetailModal(res.data);
            }}
          >
            查看结果
          </Button>
          <Button
            size="small"
            onClick={async () => {
              const res = await evalApi.exportSession(record.id);
              const blob = new Blob([JSON.stringify(res.data, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `batch-${record.id.slice(0, 8)}.json`;
              a.click();
            }}
          >
            导出
          </Button>
        </Space>
      ),
    },
  ];

  const resultColumns = [
    { title: "Prompt", dataIndex: "prompt", key: "prompt", ellipsis: true },
    {
      title: "模型",
      dataIndex: "modelId",
      key: "modelId",
      width: 150,
      render: (v: string) => models.find((m) => m.id === v)?.name ?? v,
    },
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
      width: 70,
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
      title: "耗时(ms)",
      dataIndex: "responseTimeMs",
      key: "responseTimeMs",
      width: 90,
    },
  ];

  return (
    <div className="glass-card px-6 py-5">
      <div className="glass-card px-6 py-5 mb-4">
        <div className="font-semibold text-base mb-4">新建批量测评</div>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="任务名称">
            <Input placeholder="可选，留空自动生成" />
          </Form.Item>
          <Form.Item
            name="modelIds"
            label="测评模型"
            rules={[{ required: true }]}
          >
            <Select
              mode="multiple"
              placeholder="选择模型"
              options={models.map((m) => ({
                value: m.id,
                label: `${m.name} (${m.modelId})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="testSetId"
            label="测评集"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="选择测评集"
              options={testSets.map((s) => ({
                value: s.id,
                label: `${s.name} (${s._count?.testCases ?? 0} 条)`,
              }))}
            />
          </Form.Item>
          <Form.Item name="judgeModelId" label="裁判模型（可选）">
            <Select
              placeholder="选择裁判模型进行自动评分"
              allowClear
              options={judgeModels.map((m) => ({ value: m.id, label: m.name }))}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={loading}
              onClick={handleStart}
              className="bg-(--gradient-primary) border-none shadow-(--shadow-btn)"
            >
              开始测评
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div className="glass-card px-6 py-5">
        <div className="flex justify-between items-center mb-4">
          <div className="font-semibold text-base">测评历史</div>
          <Button size="small" onClick={load}>
            刷新
          </Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={sessions}
          pagination={{ pageSize: 5 }}
        />
      </div>

      <Modal
        title="测评结果详情"
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={null}
        width={900}
      >
        <Table
          rowKey="id"
          size="small"
          columns={resultColumns}
          dataSource={detailModal?.results ?? []}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record: EvalResult) => (
              <div>
                <div>
                  <strong>回答：</strong>
                  <MarkdownRenderer content={record.response ?? ""} />
                </div>
                {record.scoreComment && (
                  <div>
                    <strong>评语：</strong>
                    {record.scoreComment}
                  </div>
                )}
                {record.error && (
                  <div className="text-red-500">
                    <strong>错误：</strong>
                    {record.error}
                  </div>
                )}
              </div>
            ),
          }}
        />
      </Modal>
    </div>
  );
}
