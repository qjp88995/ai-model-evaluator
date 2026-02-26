import { useCallback, useEffect, useState } from "react";

import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Button } from "antd";

import EvalResultDrawer from "../../components/EvalResultDrawer";
import { evalApi, modelsApi, testsetsApi } from "../../services/api";
import { EvalSession, LlmModel, TestSet } from "../../types";
import BatchNewModal from "./BatchNewModal";
import BatchSessionCard from "./BatchSessionCard";

export default function BatchPage() {
  const { message } = App.useApp();
  const [models, setModels] = useState<LlmModel[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [sessions, setSessions] = useState<EvalSession[]>([]);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [drawerSession, setDrawerSession] = useState<EvalSession | null>(null);

  const load = useCallback(async () => {
    const [modelsRes, setsRes, sessionsRes] = await Promise.all([
      modelsApi.list(),
      testsetsApi.list(),
      evalApi.listSessions("batch"),
    ]);
    setModels(modelsRes.data.filter((m: LlmModel) => m.isActive));
    setTestSets(setsRes.data);
    setSessions(sessionsRes.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCardUpdate = useCallback((updated: EvalSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setDrawerSession((prev) => (prev?.id === updated.id ? updated : prev));
  }, []);

  const handleViewResult = useCallback(async (session: EvalSession) => {
    try {
      const res = await evalApi.getSession(session.id);
      setDrawerSession(res.data);
    } catch {
      message.error("加载结果失败");
    }
  }, []);

  const handleExport = useCallback(async (session: EvalSession) => {
    try {
      const res = await evalApi.exportSession(session.id);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch-${session.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error("导出失败");
    }
  }, []);

  return (
    <div className="px-6 py-5">
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold gradient-text m-0">批量测评</h2>
        <Button size="small" icon={<ReloadOutlined />} onClick={load}>
          刷新
        </Button>
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {/* 新建卡片 */}
        <button
          onClick={() => setNewModalOpen(true)}
          className="glass-card px-5 py-4 min-h-40 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50/30 cursor-pointer transition-colors text-purple-400 hover:text-purple-600"
        >
          <PlusOutlined style={{ fontSize: 28 }} />
          <span className="text-sm font-medium">新建测评</span>
        </button>

        {/* 历史卡片 */}
        {sessions.map((session) => (
          <BatchSessionCard
            key={session.id}
            session={session}
            models={models}
            onUpdate={handleCardUpdate}
            onViewResult={handleViewResult}
            onExport={handleExport}
          />
        ))}
      </div>

      {/* 新建 Modal */}
      <BatchNewModal
        open={newModalOpen}
        models={models}
        testSets={testSets}
        onSuccess={() => {
          setNewModalOpen(false);
          load();
        }}
        onCancel={() => setNewModalOpen(false)}
      />

      {/* 结果 Drawer */}
      <EvalResultDrawer
        session={drawerSession}
        models={models}
        onClose={() => setDrawerSession(null)}
      />
    </div>
  );
}
