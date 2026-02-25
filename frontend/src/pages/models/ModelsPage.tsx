import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  Tag,
  Popconfirm,
  message,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { modelsApi } from "../../services/api";
import { LlmModel } from "../../types";

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "google", label: "Google" },
  { value: "minimax", label: "MiniMax" },
  { value: "zhipu", label: "智谱 AI" },
  { value: "moonshot", label: "Moonshot" },
  { value: "qianwen", label: "通义千问" },
  { value: "custom", label: "自定义" },
];

const PROVIDER_DEFAULT_URLS: Record<string, string> = {
  deepseek: "https://api.deepseek.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta/openai/",
  minimax: "https://api.minimax.chat/v1",
  zhipu: "https://open.bigmodel.cn/api/paas/v4",
  moonshot: "https://api.moonshot.cn/v1",
  qianwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
};

export default function ModelsPage() {
  const [models, setModels] = useState<LlmModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LlmModel | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await modelsApi.list();
      setModels(res.data);
    } catch {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 2048,
      timeout: 30000,
      retryCount: 2,
      isJudge: false,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (model: LlmModel) => {
    setEditing(model);
    form.setFieldsValue({ ...model, apiKey: "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (editing && !values.apiKey) delete values.apiKey;
    try {
      if (editing) {
        await modelsApi.update(editing.id, values);
        message.success("更新成功");
      } else {
        await modelsApi.create(values);
        message.success("创建成功");
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      message.error(err.response?.data?.message ?? "操作失败");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await modelsApi.delete(id);
      message.success("删除成功");
      load();
    } catch {
      message.error("删除失败");
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const res = await modelsApi.test(id);
      if (res.data.success) {
        message.success(`连通成功: ${res.data.response}`);
      } else {
        message.error(`连通失败: ${res.data.error}`);
      }
    } catch {
      message.error("测试请求失败");
    } finally {
      setTesting(null);
    }
  };

  const providerColors: Record<string, string> = {
    openai: "green",
    anthropic: "orange",
    zhipu: "blue",
    moonshot: "purple",
    qianwen: "cyan",
    deepseek: "volcano",
    google: "geekblue",
    minimax: "magenta",
    custom: "default",
  };

  const columns = [
    { title: "名称", dataIndex: "name", key: "name", width: 150 },
    {
      title: "服务商",
      dataIndex: "provider",
      key: "provider",
      width: 100,
      render: (v: string) => (
        <Tag color={providerColors[v] ?? "default"}>{v}</Tag>
      ),
    },
    { title: "Model ID", dataIndex: "modelId", key: "modelId", width: 180 },
    { title: "温度", dataIndex: "temperature", key: "temperature", width: 70 },
    {
      title: "Max Tokens",
      dataIndex: "maxTokens",
      key: "maxTokens",
      width: 100,
    },
    {
      title: "裁判模型",
      dataIndex: "isJudge",
      key: "isJudge",
      width: 90,
      render: (v: boolean) => (v ? <Tag color="gold">裁判</Tag> : null),
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      width: 80,
      render: (v: boolean) => (
        <Tag color={v ? "green" : "red"}>{v ? "启用" : "禁用"}</Tag>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 160,
      render: (_: any, record: LlmModel) => (
        <Space>
          <Tooltip title="测试连通性">
            <Button
              size="small"
              icon={<ApiOutlined />}
              loading={testing === record.id}
              onClick={() => handleTest(record.id)}
            />
          </Tooltip>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="确认删除?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="glass-card px-6 py-5">
      <div className="mb-4 flex justify-between items-center">
        <span className="text-slate-400 text-[13px]">
          共 {models.length} 个模型
        </span>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          className="bg-[var(--gradient-primary)] border-none shadow-[var(--shadow-btn)]"
        >
          添加模型
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={models}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? "编辑模型" : "添加模型"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="显示名称" rules={[{ required: true }]}>
            <Input placeholder="例: GPT-4o" />
          </Form.Item>

          <Form.Item
            name="provider"
            label="服务商"
            rules={[{ required: true }]}
          >
            <Select
              options={PROVIDERS}
              onChange={(v) => {
                if (PROVIDER_DEFAULT_URLS[v]) {
                  form.setFieldValue("baseUrl", PROVIDER_DEFAULT_URLS[v]);
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label={editing ? "API Key（留空保持不变）" : "API Key"}
            rules={editing ? [] : [{ required: true }]}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Form.Item name="baseUrl" label="Base URL（OpenAI 兼容接口自定义）">
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item
            name="modelId"
            label="Model ID"
            rules={[{ required: true }]}
          >
            <Input placeholder="gpt-4o / claude-3-5-sonnet-20241022" />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="temperature" label="Temperature">
              <InputNumber min={0} max={2} step={0.1} className="w-full" />
            </Form.Item>
            <Form.Item name="topP" label="Top P">
              <InputNumber min={0} max={1} step={0.1} className="w-full" />
            </Form.Item>
            <Form.Item name="maxTokens" label="Max Tokens">
              <InputNumber min={1} max={128000} className="w-full" />
            </Form.Item>
          </div>

          <Form.Item name="systemPrompt" label="系统提示词">
            <Input.TextArea rows={3} placeholder="可选" />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="timeout" label="超时(ms)">
              <InputNumber min={1000} className="w-full" />
            </Form.Item>
            <Form.Item name="retryCount" label="重试次数">
              <InputNumber min={0} max={5} className="w-full" />
            </Form.Item>
          </div>

          <div className="flex gap-8">
            <Form.Item
              name="isJudge"
              label="可作为裁判模型"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item name="isActive" label="启用" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
