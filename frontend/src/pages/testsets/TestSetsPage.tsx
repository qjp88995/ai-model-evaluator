import { useCallback, useEffect, useState } from 'react';

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button } from 'antd';

import { testsetsApi } from '@/services/api';
import { TestSet } from '@/types';

import CasesDrawer from './CasesDrawer';
import TestSetCard from './TestSetCard';
import TestSetFormModal from './TestSetFormModal';

export default function TestSetsPage() {
  const { message } = App.useApp();
  const [sets, setSets] = useState<TestSet[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<TestSet | null>(null);
  // drawerSet !== null 即视为 Drawer 打开，避免冗余布尔 state
  const [drawerSet, setDrawerSet] = useState<TestSet | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await testsetsApi.list();
      setSets(res.data);
    } catch {
      message.error('测评集列表加载失败');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleNewSet = useCallback(() => {
    setEditingSet(null);
    setModalOpen(true);
  }, []);

  const handleManage = useCallback(async (testSet: TestSet) => {
    try {
      const res = await testsetsApi.get(testSet.id);
      setDrawerSet(res.data);
    } catch {
      message.error('测评集详情加载失败');
    }
  }, []);

  const handleEdit = useCallback((testSet: TestSet) => {
    setEditingSet(testSet);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await testsetsApi.delete(id);
        message.success('删除成功');
        load();
      } catch {
        message.error('删除失败');
      }
    },
    [load]
  );

  const handleCaseUpdated = useCallback(async (id: string) => {
    try {
      const res = await testsetsApi.get(id);
      setDrawerSet(res.data);
    } catch {
      message.error('刷新失败');
    }
  }, []);

  const handleModalSuccess = useCallback(() => {
    setModalOpen(false);
    load();
  }, [load]);

  const handleModalCancel = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerSet(null);
  }, []);

  return (
    <div className="px-6 py-5">
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold gradient-text m-0">测评集管理</h2>
        <Button size="small" icon={<ReloadOutlined />} onClick={load}>
          刷新
        </Button>
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {/* 新建卡片 */}
        <button
          onClick={handleNewSet}
          className="glass-card px-5 py-4 min-h-40 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50/30 cursor-pointer transition-colors text-purple-400 hover:text-purple-600"
        >
          <PlusOutlined style={{ fontSize: 28 }} />
          <span className="text-sm font-medium">新建测评集</span>
        </button>

        {/* 测评集卡片 */}
        {sets.map(set => (
          <TestSetCard
            key={set.id}
            testSet={set}
            onManage={handleManage}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* 新建/编辑 Modal */}
      <TestSetFormModal
        open={modalOpen}
        editing={editingSet}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
      />

      {/* 用例管理 Drawer */}
      <CasesDrawer
        testSet={drawerSet}
        open={drawerSet !== null}
        onClose={handleDrawerClose}
        onUpdated={handleCaseUpdated}
      />
    </div>
  );
}
