import { useCallback, useEffect, useState } from 'react';

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button } from 'antd';

import { modelsApi } from '@/services/api';
import { LlmModel } from '@/types';
import ModelCard from './ModelCard';
import ModelFormModal from './ModelFormModal';

export default function ModelsPage() {
  const { message } = App.useApp();
  const [models, setModels] = useState<LlmModel[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LlmModel | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await modelsApi.list();
      setModels(res.data);
    } catch {
      message.error('加载失败');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEdit = useCallback((model: LlmModel) => {
    setEditing(model);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await modelsApi.delete(id);
        message.success('删除成功');
        load();
      } catch {
        message.error('删除失败');
      }
    },
    [load]
  );

  const handleTest = useCallback(async (id: string) => {
    setTesting(id);
    try {
      const res = await modelsApi.test(id);
      if (res.data.success) {
        message.success(`连通成功: ${res.data.response}`);
      } else {
        message.error(`连通失败: ${res.data.error}`);
      }
    } catch {
      message.error('测试请求失败');
    } finally {
      setTesting(null);
    }
  }, []);

  return (
    <div className="px-6 py-5">
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold gradient-text m-0">模型管理</h2>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[13px]">
            共 {models.length} 个模型
          </span>
          <Button size="small" icon={<ReloadOutlined />} onClick={load}>
            刷新
          </Button>
        </div>
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {/* 新建卡片 */}
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="glass-card px-5 py-4 min-h-40 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50/30 cursor-pointer transition-colors text-purple-400 hover:text-purple-600"
        >
          <PlusOutlined style={{ fontSize: 28 }} />
          <span className="text-sm font-medium">添加模型</span>
        </button>

        {/* 模型卡片列表 */}
        {models.map(model => (
          <ModelCard
            key={model.id}
            model={model}
            testing={testing === model.id}
            onTest={handleTest}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* 新建/编辑 Modal */}
      <ModelFormModal
        open={modalOpen}
        editing={editing}
        onSuccess={() => {
          setModalOpen(false);
          load();
        }}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}
