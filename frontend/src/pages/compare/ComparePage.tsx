import { useState, useEffect, useRef } from "react";
import {
  Button,
  Select,
  Input,
  Row,
  Col,
  Space,
  Tag,
  Typography,
  message,
  Spin,
} from "antd";
import { SendOutlined, ClearOutlined } from "@ant-design/icons";
import { modelsApi, evalApi } from "../../services/api";
import { LlmModel } from "../../types";

const { TextArea } = Input;
const { Text } = Typography;

interface ModelState {
  id: string;
  name: string;
  content: string;
  done: boolean;
  tokensInput?: number;
  tokensOutput?: number;
  responseTimeMs?: number;
  error?: string;
}

export default function ComparePage() {
  const [models, setModels] = useState<LlmModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [modelStates, setModelStates] = useState<ModelState[]>([]);
  const eventSourcesRef = useRef<EventSource[]>([]);

  useEffect(() => {
    modelsApi
      .list()
      .then((res) => setModels(res.data.filter((m: LlmModel) => m.isActive)));
  }, []);

  const handleRun = async () => {
    if (!prompt.trim()) return message.warning("请输入 Prompt");
    if (selectedIds.length === 0) return message.warning("请选择至少一个模型");

    setRunning(true);
    const initialStates = selectedIds.map((id) => ({
      id,
      name: models.find((m) => m.id === id)?.name ?? id,
      content: "",
      done: false,
    }));
    setModelStates(initialStates);

    try {
      const res = await evalApi.createCompare({
        modelIds: selectedIds,
        prompt: prompt.trim(),
        systemPrompt: systemPrompt.trim() || undefined,
      });
      const sessionId = res.data.id;

      // 关闭上一次残留的连接
      eventSourcesRef.current.forEach((es) => es.close());
      eventSourcesRef.current = [];

      let doneCount = 0;
      const total = selectedIds.length;

      selectedIds.forEach((modelId) => {
        const token = localStorage.getItem("token") ?? "";
        const es = new EventSource(
          `/api/eval/compare/${sessionId}/stream/${modelId}?token=${encodeURIComponent(token)}`,
        );
        eventSourcesRef.current.push(es);

        es.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setModelStates((prev) =>
            prev.map((s) => {
              if (s.id !== modelId) return s;
              if (data.done) {
                return {
                  ...s,
                  done: true,
                  tokensInput: data.tokensInput,
                  tokensOutput: data.tokensOutput,
                  responseTimeMs: data.responseTimeMs,
                  error: data.error,
                };
              }
              return { ...s, content: s.content + (data.chunk ?? "") };
            }),
          );

          if (data.done) {
            es.close();
            doneCount += 1;
            if (doneCount >= total) {
              setRunning(false);
            }
          }
        };

        es.onerror = () => {
          es.close();
          setModelStates((prev) =>
            prev.map((s) =>
              s.id === modelId && !s.done
                ? { ...s, done: true, error: "连接中断" }
                : s,
            ),
          );
          doneCount += 1;
          if (doneCount >= total) {
            setRunning(false);
          }
        };
      });
    } catch (err: any) {
      message.error(err.response?.data?.message ?? "启动失败");
      setRunning(false);
    }
  };

  const handleClear = () => {
    eventSourcesRef.current.forEach((es) => es.close());
    eventSourcesRef.current = [];
    setModelStates([]);
    setRunning(false);
  };

  const modelOptions = models.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.modelId})`,
  }));

  return (
    <div>
      <div className="glass-card px-6 py-5 mb-5">
        <Space direction="vertical" className="w-full" size="middle">
          <Select
            mode="multiple"
            placeholder="选择对比模型（可多选）"
            options={modelOptions}
            value={selectedIds}
            onChange={setSelectedIds}
            className="w-full"
            maxTagCount={5}
          />
          <TextArea
            placeholder="系统提示词（可选）"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <TextArea
            placeholder="输入 Prompt，所有模型同时响应..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button
              icon={<ClearOutlined />}
              onClick={handleClear}
              disabled={running}
            >
              清除
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleRun}
              loading={running}
              disabled={!prompt.trim() || selectedIds.length === 0}
            >
              开始对比
            </Button>
          </div>
        </Space>
      </div>

      {modelStates.length > 0 && (
        <Row gutter={[16, 16]}>
          {modelStates.map((state) => (
            <Col
              key={state.id}
              xs={24}
              sm={24}
              md={modelStates.length === 1 ? 24 : 12}
            >
              <div className="glass-card px-5 py-4 min-h-60">
                {/* 标题行 */}
                <div className="flex justify-between items-center mb-3">
                  <Space>
                    <span className="font-semibold text-slate-200">
                      {state.name}
                    </span>
                    {state.done ? (
                      state.error ? (
                        <Tag color="red">失败</Tag>
                      ) : (
                        <Tag color="green">完成</Tag>
                      )
                    ) : (
                      <Spin size="small" />
                    )}
                  </Space>
                  {state.done && !state.error && (
                    <Space size={4}>
                      <Text type="secondary" className="text-xs">
                        {state.responseTimeMs}ms
                      </Text>
                      <Text type="secondary" className="text-xs">
                        ↑{state.tokensInput} ↓{state.tokensOutput}
                      </Text>
                    </Space>
                  )}
                </div>
                {/* 内容区 */}
                {state.error ? (
                  <Text type="danger">{state.error}</Text>
                ) : (
                  <pre className="whitespace-pre-wrap break-words m-0 font-[inherit] text-sm text-slate-200">
                    {state.content}
                    {!state.done && <span className="cursor">▊</span>}
                  </pre>
                )}
              </div>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
