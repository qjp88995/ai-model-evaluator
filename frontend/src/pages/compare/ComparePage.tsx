import { useEffect, useRef, useState } from "react";

import {
  ClearOutlined,
  CopyOutlined,
  DownloadOutlined,
  DownOutlined,
  SendOutlined,
  UpOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Input,
  message,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import { MarkdownRenderer } from "../../components/markdown";
import { evalApi, modelsApi } from "../../services/api";
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

// 根据模型数量计算列宽：1→全宽，3→三列，其余→两列
function getColSpan(total: number): number {
  if (total === 1) return 24;
  if (total === 3) return 8;
  return 12;
}

export default function ComparePage() {
  const [models, setModels] = useState<LlmModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [running, setRunning] = useState(false);
  const [modelStates, setModelStates] = useState<ModelState[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const eventSourcesRef = useRef<EventSource[]>([]);
  const contentRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    modelsApi
      .list()
      .then((res) => setModels(res.data.filter((m: LlmModel) => m.isActive)));
  }, []);

  // 流式输出时自动滚到底部
  useEffect(() => {
    modelStates.forEach((s) => {
      if (!s.done) {
        const el = contentRefsRef.current.get(s.id);
        if (el) el.scrollTop = el.scrollHeight;
      }
    });
  }, [modelStates]);

  const handleRun = async () => {
    if (!prompt.trim()) return message.warning("请输入 Prompt");
    if (selectedIds.length === 0) return message.warning("请选择至少一个模型");

    setRunning(true);
    setSessionId(null);
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
      const sid = res.data.id;
      setSessionId(sid);

      // 关闭上一次残留的连接
      eventSourcesRef.current.forEach((es) => es.close());
      eventSourcesRef.current = [];

      let doneCount = 0;
      const total = selectedIds.length;

      selectedIds.forEach((modelId) => {
        const token = localStorage.getItem("token") ?? "";
        const es = new EventSource(
          `/api/eval/compare/${sid}/stream/${modelId}?token=${encodeURIComponent(token)}`,
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
    setSessionId(null);
    setRunning(false);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      message.success("已复制");
    });
  };

  const handleExport = async () => {
    if (!sessionId) return;
    try {
      const res = await evalApi.exportSession(sessionId);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compare-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error("导出失败");
    }
  };

  const modelOptions = models.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.modelId})`,
  }));

  const colSpan = getColSpan(modelStates.length);
  const allDone =
    modelStates.length > 0 && modelStates.every((s) => s.done) && !running;

  return (
    <div>
      <div className="glass-card px-6 py-5 mb-5">
        <Space orientation="vertical" className="w-full" size="middle">
          <Select
            mode="multiple"
            placeholder="选择对比模型（可多选）"
            options={modelOptions}
            value={selectedIds}
            onChange={setSelectedIds}
            className="w-full"
            maxTagCount={5}
          />
          {/* 系统提示词折叠区 */}
          <div>
            <button
              type="button"
              onClick={() => setShowSystemPrompt((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2 cursor-pointer bg-transparent border-0 p-0"
            >
              {showSystemPrompt ? <UpOutlined /> : <DownOutlined />}
              系统提示词（可选）
              {!showSystemPrompt && systemPrompt && (
                <span className="text-violet-400 ml-1">· 已设置</span>
              )}
            </button>
            {showSystemPrompt && (
              <TextArea
                placeholder="输入系统提示词..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={2}
                className="resize-none"
              />
            )}
          </div>
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

      {/* 空状态引导 */}
      {modelStates.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-slate-500 select-none">
          <SendOutlined className="text-4xl mb-4 opacity-20" />
          <p className="text-sm m-0">选择模型，输入 Prompt，点击「开始对比」</p>
        </div>
      )}

      {modelStates.length > 0 && (
        <>
          <Row gutter={[16, 16]}>
            {modelStates.map((state) => {
              const model = models.find((m) => m.id === state.id);
              return (
                <Col key={state.id} xs={24} sm={24} md={colSpan}>
                  <div className="glass-card px-5 py-4 flex flex-col min-h-60">
                    {/* 标题行 */}
                    <div className="flex justify-between items-start mb-3 shrink-0">
                      <div>
                        <div className="flex items-center gap-2">
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
                        </div>
                        {model && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {model.modelId} · temp {model.temperature}
                          </div>
                        )}
                      </div>
                      <Space size={4} className="shrink-0 ml-2">
                        {state.done && !state.error && (
                          <>
                            <Text type="secondary" className="text-xs">
                              {state.responseTimeMs}ms
                            </Text>
                            <Text type="secondary" className="text-xs">
                              ↑{state.tokensInput} ↓{state.tokensOutput}
                            </Text>
                            <Tooltip title="复制">
                              <Button
                                type="text"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopy(state.content)}
                                className="text-slate-400 hover:text-slate-200"
                              />
                            </Tooltip>
                          </>
                        )}
                      </Space>
                    </div>
                    {/* 内容区：限制最大高度，流式时自动滚底 */}
                    <div
                      ref={(el) => {
                        if (el) contentRefsRef.current.set(state.id, el);
                        else contentRefsRef.current.delete(state.id);
                      }}
                      className="overflow-y-auto flex-1"
                      style={{ maxHeight: "60vh" }}
                    >
                      {state.error ? (
                        <Text type="danger">{state.error}</Text>
                      ) : (
                        <MarkdownRenderer
                          content={state.content}
                          streaming={!state.done}
                        />
                      )}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>

          {/* 全部完成后显示导出按钮 */}
          {allDone && sessionId && (
            <div className="flex justify-end mt-4">
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出本次对比
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
