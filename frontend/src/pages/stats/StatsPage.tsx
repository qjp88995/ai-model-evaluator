import { useCallback, useEffect, useMemo, useState } from 'react';

import { App, Select, Table, Tag } from 'antd';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { statsApi } from '@/services/api';
import { ModelStat, StatsOverview, TrendPoint } from '@/types';

// 静态样式常量提取到组件外，避免每次渲染重新创建
const tooltipStyle = {
  contentStyle: {
    background: 'rgba(26, 16, 64, 0.95)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: 8,
    color: '#e2e8f0',
  },
};

const axisProps = {
  stroke: '#94a3b8',
  tick: { fill: '#94a3b8', fontSize: 12 },
};

const modelColumns = [
  { title: '模型', dataIndex: 'modelName', key: 'modelName' },
  {
    title: '服务商',
    dataIndex: 'provider',
    key: 'provider',
    render: (v: string) => <Tag>{v}</Tag>,
  },
  { title: '请求数', dataIndex: 'requestCount', key: 'requestCount' },
  { title: '输入Token', dataIndex: 'tokensInput', key: 'tokensInput' },
  { title: '输出Token', dataIndex: 'tokensOutput', key: 'tokensOutput' },
  {
    title: '总Token',
    key: 'total',
    render: (_: unknown, r: ModelStat) =>
      (r.tokensInput ?? 0) + (r.tokensOutput ?? 0),
  },
];

export default function StatsPage() {
  const { message } = App.useApp();
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [modelStats, setModelStats] = useState<ModelStat[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);

  // overview 和 modelStats 与天数无关，只加载一次
  useEffect(() => {
    setLoading(true);
    Promise.all([statsApi.overview(), statsApi.models()])
      .then(([overviewRes, modelsRes]) => {
        setOverview(overviewRes.data);
        setModelStats(modelsRes.data);
      })
      .catch(() => message.error('加载统计数据失败'))
      .finally(() => setLoading(false));
  }, [message]);

  // trend 随 days 变化重新加载
  const loadTrend = useCallback(async () => {
    setTrendLoading(true);
    try {
      const res = await statsApi.trend(days);
      setTrend(res.data);
    } catch {
      // trend 加载失败不影响其他区块，静默处理
    } finally {
      setTrendLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadTrend();
  }, [loadTrend]);

  const summaryCards = useMemo(
    () => [
      {
        title: '总请求数',
        value: overview?.totalRequests ?? 0,
        colorClass: 'text-violet-400',
      },
      {
        title: '输入 Token',
        value: overview?.totalTokensInput ?? 0,
        colorClass: 'text-blue-400',
      },
      {
        title: '输出 Token',
        value: overview?.totalTokensOutput ?? 0,
        colorClass: 'text-emerald-400',
      },
      {
        title: '总 Token',
        value:
          (overview?.totalTokensInput ?? 0) +
          (overview?.totalTokensOutput ?? 0),
        colorClass: 'text-amber-400',
      },
      {
        title: '活跃模型',
        value: overview?.activeModels ?? 0,
        colorClass: 'text-pink-400',
      },
      {
        title: '评测会话',
        value: overview?.totalSessions ?? 0,
        colorClass: 'text-violet-400',
      },
    ],
    [overview]
  );

  return (
    <>
      {/* 统计卡片行 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
        {summaryCards.map(item => (
          <div key={item.title} className="glass-card px-5 py-4">
            <div className="text-xs text-slate-400 mb-2 tracking-wider">
              {item.title}
            </div>
            <div className={`text-[22px] font-bold ${item.colorClass}`}>
              {loading ? '—' : item.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Token 趋势图 */}
      <div className="glass-card px-6 py-5 mb-5">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-slate-200">Token 用量趋势</span>
          <Select
            value={days}
            onChange={setDays}
            options={[
              { value: 7, label: '近 7 天' },
              { value: 30, label: '近 30 天' },
              { value: 90, label: '近 90 天' },
            ]}
            className="w-30"
          />
        </div>
        <div
          style={{
            opacity: trendLoading ? 0.4 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={trend}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(139, 92, 246, 0.1)"
              />
              <XAxis dataKey="date" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Legend />
              <Area
                type="monotone"
                dataKey="tokensInput"
                name="输入Token"
                stackId="1"
                stroke="#7c3aed"
                fill="rgba(124, 58, 237, 0.15)"
              />
              <Area
                type="monotone"
                dataKey="tokensOutput"
                name="输出Token"
                stackId="1"
                stroke="#34d399"
                fill="rgba(52, 211, 153, 0.15)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 底部两列 */}
      <div className="grid grid-cols-[14fr_10fr] gap-4">
        <div className="glass-card px-6 py-5">
          <div className="font-semibold text-slate-200 mb-4">
            各模型用量排行
          </div>
          <Table
            rowKey="modelId"
            size="small"
            columns={modelColumns}
            dataSource={modelStats}
            loading={loading}
            pagination={false}
          />
        </div>
        <div className="glass-card px-6 py-5">
          <div className="font-semibold text-slate-200 mb-4">
            模型请求数对比
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={modelStats.slice(0, 8)}
              layout="vertical"
              margin={{ left: 80 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(139, 92, 246, 0.1)"
              />
              <XAxis type="number" {...axisProps} />
              <YAxis
                type="category"
                dataKey="modelName"
                width={80}
                {...axisProps}
              />
              <Tooltip {...tooltipStyle} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <Bar
                dataKey="requestCount"
                name="请求数"
                fill="url(#barGradient)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
