import { useCallback, useEffect, useMemo, useState } from 'react';

import { ReloadOutlined } from '@ant-design/icons';
import { App, Button, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';

import EvalResultDrawer from '@/components/EvalResultDrawer';
import { evalApi, modelsApi } from '@/services/api';
import { EvalSession, LlmModel } from '@/types';

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: '待运行' },
  running: { color: 'processing', label: '运行中' },
  completed: { color: 'success', label: '已完成' },
  failed: { color: 'error', label: '失败' },
};

export default function HistoryPage() {
  const { message } = App.useApp();
  const [sessions, setSessions] = useState<EvalSession[]>([]);
  const [models, setModels] = useState<LlmModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [detail, setDetail] = useState<EvalSession | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  // models 不随 typeFilter 变化，只加载一次
  useEffect(() => {
    modelsApi
      .list()
      .then(res => setModels(res.data))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await evalApi.listSessions(typeFilter);
      setSessions(res.data);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleViewDetail = useCallback(async (record: EvalSession) => {
    setDetailLoadingId(record.id);
    try {
      const res = await evalApi.getSession(record.id);
      setDetail(res.data);
    } catch {
      message.error('加载详情失败');
    } finally {
      setDetailLoadingId(null);
    }
  }, []);

  const handleExport = useCallback(async (id: string) => {
    try {
      const res = await evalApi.exportSession(id);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('导出失败');
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        width: 80,
        render: (v: string) => (
          <Tag color={v === 'compare' ? 'blue' : 'purple'}>
            {v === 'compare' ? '对比' : '批量'}
          </Tag>
        ),
      },
      {
        title: '名称/ID',
        key: 'name',
        render: (_: any, r: EvalSession) => r.name || r.id.slice(0, 8),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (v: string) => {
          const cfg = statusConfig[v] ?? { color: 'default', label: v };
          return <Tag color={cfg.color}>{cfg.label}</Tag>;
        },
      },
      {
        title: '结果数',
        key: 'count',
        width: 80,
        render: (_: any, r: EvalSession) => r._count?.results ?? '-',
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 150,
        render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: '完成时间',
        dataIndex: 'completedAt',
        key: 'completedAt',
        width: 150,
        render: (v?: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 160,
        render: (_: any, record: EvalSession) => (
          <Space>
            <Button
              size="small"
              loading={detailLoadingId === record.id}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
            <Button size="small" onClick={() => handleExport(record.id)}>
              导出
            </Button>
          </Space>
        ),
      },
    ],
    [detailLoadingId, handleViewDetail, handleExport]
  );

  return (
    <div className="px-6 py-5">
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold gradient-text m-0">历史记录</h2>
        <div className="flex items-center gap-3">
          <Select
            placeholder="筛选类型"
            allowClear
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'compare', label: '实时对比' },
              { value: 'batch', label: '批量测评' },
            ]}
            className="w-32"
          />
          <Button size="small" icon={<ReloadOutlined />} onClick={load}>
            刷新
          </Button>
        </div>
      </div>

      <div className="glass-card px-6 py-5">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={sessions}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <EvalResultDrawer
        session={detail}
        models={models}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
