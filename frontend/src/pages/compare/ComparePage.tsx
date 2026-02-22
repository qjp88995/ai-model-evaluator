import { useState, useEffect, useRef } from 'react';
import { Button, Select, Input, Card, Row, Col, Space, Tag, Typography, message, Spin } from 'antd';
import { SendOutlined, ClearOutlined } from '@ant-design/icons';
import { modelsApi, evalApi } from '../../services/api';
import { LlmModel } from '../../types';

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
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [modelStates, setModelStates] = useState<ModelState[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    modelsApi.list().then((res) => setModels(res.data.filter((m: LlmModel) => m.isActive)));
  }, []);

  const handleRun = async () => {
    if (!prompt.trim()) return message.warning('请输入 Prompt');
    if (selectedIds.length === 0) return message.warning('请选择至少一个模型');

    setRunning(true);
    const initialStates = selectedIds.map((id) => ({
      id,
      name: models.find((m) => m.id === id)?.name ?? id,
      content: '',
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

      const es = new EventSource(`/api/eval/compare/${sessionId}/stream`);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setModelStates((prev) =>
          prev.map((s) => {
            if (s.id !== data.modelId) return s;
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
            return { ...s, content: s.content + (data.chunk ?? '') };
          }),
        );
      };

      es.onerror = () => {
        es.close();
        setRunning(false);
      };

      es.addEventListener('close', () => {
        es.close();
        setRunning(false);
      });

      // 检测是否全部完成
      const checkDone = setInterval(() => {
        setModelStates((prev) => {
          if (prev.length > 0 && prev.every((s) => s.done)) {
            clearInterval(checkDone);
            es.close();
            setRunning(false);
          }
          return prev;
        });
      }, 500);
    } catch (err: any) {
      message.error(err.response?.data?.message ?? '启动失败');
      setRunning(false);
    }
  };

  const handleClear = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setModelStates([]);
    setRunning(false);
  };

  const modelOptions = models.map((m) => ({ value: m.id, label: `${m.name} (${m.modelId})` }));

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Select
            mode="multiple"
            placeholder="选择对比模型（可多选）"
            options={modelOptions}
            value={selectedIds}
            onChange={setSelectedIds}
            style={{ width: '100%' }}
            maxTagCount={5}
          />
          <TextArea
            placeholder="系统提示词（可选）"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            style={{ resize: 'none' }}
          />
          <TextArea
            placeholder="输入 Prompt，所有模型同时响应..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            style={{ resize: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button icon={<ClearOutlined />} onClick={handleClear} disabled={running}>
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
      </Card>

      {modelStates.length > 0 && (
        <Row gutter={[16, 16]}>
          {modelStates.map((state) => (
            <Col key={state.id} xs={24} sm={24} md={modelStates.length === 1 ? 24 : 12}>
              <Card
                title={
                  <Space>
                    <span>{state.name}</span>
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
                }
                extra={
                  state.done && !state.error && (
                    <Space size={4}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {state.responseTimeMs}ms
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ↑{state.tokensInput} ↓{state.tokensOutput}
                      </Text>
                    </Space>
                  )
                }
                bodyStyle={{ minHeight: 200 }}
              >
                {state.error ? (
                  <Text type="danger">{state.error}</Text>
                ) : (
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit', fontSize: 14 }}>
                    {state.content}
                    {!state.done && <span className="cursor">▊</span>}
                  </pre>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
