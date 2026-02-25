import { useState, useEffect } from "react";
import { Select, Table, Tag } from "antd";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { statsApi } from "../../services/api";
import { StatsOverview } from "../../types";

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

  useEffect(() => {
    load();
  }, [days]);

  const modelColumns = [
    { title: "模型", dataIndex: "modelName", key: "modelName" },
    {
      title: "服务商",
      dataIndex: "provider",
      key: "provider",
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: "请求数", dataIndex: "requestCount", key: "requestCount" },
    { title: "输入Token", dataIndex: "tokensInput", key: "tokensInput" },
    { title: "输出Token", dataIndex: "tokensOutput", key: "tokensOutput" },
    {
      title: "总Token",
      key: "total",
      render: (_: any, r: any) => (r.tokensInput ?? 0) + (r.tokensOutput ?? 0),
    },
  ];

  const tooltipStyle = {
    contentStyle: {
      background: "rgba(26, 16, 64, 0.95)",
      border: "1px solid rgba(139, 92, 246, 0.3)",
      borderRadius: 8,
      color: "#e2e8f0",
    },
  };

  const axisProps = {
    stroke: "#94a3b8",
    tick: { fill: "#94a3b8", fontSize: 12 },
  };

  return (
    <>
      {/* 统计卡片行 */}
      <div className="grid grid-cols-6 gap-4 mb-5">
        {[
          {
            title: "总请求数",
            value: overview?.totalRequests ?? 0,
            color: "#a78bfa",
          },
          {
            title: "输入 Token",
            value: overview?.totalTokensInput ?? 0,
            color: "#60a5fa",
          },
          {
            title: "输出 Token",
            value: overview?.totalTokensOutput ?? 0,
            color: "#34d399",
          },
          {
            title: "总 Token",
            value:
              (overview?.totalTokensInput ?? 0) +
              (overview?.totalTokensOutput ?? 0),
            color: "#fbbf24",
          },
          {
            title: "活跃模型",
            value: overview?.activeModels ?? 0,
            color: "#f472b6",
          },
          {
            title: "评测会话",
            value: overview?.totalSessions ?? 0,
            color: "#a78bfa",
          },
        ].map((item) => (
          <div key={item.title} className="glass-card px-5 py-4">
            <div className="text-xs text-slate-400 mb-2 tracking-[0.05em]">
              {item.title}
            </div>
            <div
              className="text-[22px] font-bold"
              style={{ color: item.color }}
            >
              {item.value.toLocaleString()}
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
              { value: 7, label: "近 7 天" },
              { value: 30, label: "近 30 天" },
              { value: 90, label: "近 90 天" },
            ]}
            className="w-30"
          />
        </div>
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
