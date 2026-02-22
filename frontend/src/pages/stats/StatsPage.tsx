import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Table, Tag } from 'antd';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer,
} from 'recharts';
import { statsApi } from '../../services/api';
import { StatsOverview } from '../../types';

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10a37f', anthropic: '#d4a96a', zhipu: '#1677ff',
  moonshot: '#722ed1', qianwen: '#13c2c2', custom: '#8c8c8c',
};

export default function StatsPage() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [modelStats, setModelStats] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [days, setDays] = useState(7);

  const load = async () => {
    const [overviewRes, modelsRes, trendRes] = await Promise.all([
      statsApi.overview(),
      statsApi.models(),
      statsApi.trend(days),
    ]);
    setOverview(overviewRes.data);
    setModelStats(modelsRes.data);
    setTrend(trendRes.data);
  };

  useEffect(() => { load(); }, [days]);

  const modelColumns = [
    { title: '模型', dataIndex: 'modelName', key: 'modelName' },
    { title: '服务商', dataIndex: 'provider', key: 'provider', render: (v: string) => <Tag>{v}</Tag> },
    { title: '请求数', dataIndex: 'requestCount', key: 'requestCount' },
    { title: '输入Token', dataIndex: 'tokensInput', key: 'tokensInput' },
    { title: '输出Token', dataIndex: 'tokensOutput', key: 'tokensOutput' },
    { title: '总Token', key: 'total', render: (_: any, r: any) => (r.tokensInput ?? 0) + (r.tokensOutput ?? 0) },
  ];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card><Statistic title="总请求数" value={overview?.totalRequests ?? 0} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="输入 Token" value={overview?.totalTokensInput ?? 0} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="输出 Token" value={overview?.totalTokensOutput ?? 0} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="总 Token" value={(overview?.totalTokensInput ?? 0) + (overview?.totalTokensOutput ?? 0)} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="活跃模型" value={overview?.activeModels ?? 0} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="评测会话" value={overview?.totalSessions ?? 0} /></Card>
        </Col>
      </Row>

      <Card
        title="Token 用量趋势"
        style={{ marginBottom: 16 }}
        extra={
          <Select
            value={days}
            onChange={setDays}
            options={[
              { value: 7, label: '近 7 天' },
              { value: 30, label: '近 30 天' },
              { value: 90, label: '近 90 天' },
            ]}
            style={{ width: 120 }}
          />
        }
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="tokensInput" name="输入Token" stackId="1" stroke="#1677ff" fill="#e6f4ff" />
            <Area type="monotone" dataKey="tokensOutput" name="输出Token" stackId="1" stroke="#52c41a" fill="#f6ffed" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card title="各模型用量排行">
            <Table
              rowKey="modelId"
              size="small"
              columns={modelColumns}
              dataSource={modelStats}
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="模型请求数对比">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={modelStats.slice(0, 8)} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="modelName" width={80} />
                <Tooltip />
                <Bar dataKey="requestCount" name="请求数" fill="#1677ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </>
  );
}
