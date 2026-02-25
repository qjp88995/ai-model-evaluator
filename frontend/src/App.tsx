import { useState } from "react";
import { Layout, Menu, Button, Tooltip } from "antd";
import {
  LogoutOutlined,
  RobotOutlined,
  SettingOutlined,
  BarChartOutlined,
  OrderedListOutlined,
  HistoryOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import ModelsPage from "./pages/models/ModelsPage";
import ComparePage from "./pages/compare/ComparePage";
import BatchPage from "./pages/batch/BatchPage";
import TestSetsPage from "./pages/testsets/TestSetsPage";
import HistoryPage from "./pages/history/HistoryPage";
import StatsPage from "./pages/stats/StatsPage";
import LoginPage from "./pages/auth/LoginPage";

const { Sider, Content } = Layout;

const menuItems = [
  { key: "models", icon: <SettingOutlined />, label: "模型管理" },
  { key: "compare", icon: <RobotOutlined />, label: "实时对比" },
  { key: "batch", icon: <ExperimentOutlined />, label: "批量测评" },
  { key: "testsets", icon: <OrderedListOutlined />, label: "测评集管理" },
  { key: "history", icon: <HistoryOutlined />, label: "历史记录" },
  { key: "stats", icon: <BarChartOutlined />, label: "用量统计" },
];

const pageMap: Record<string, React.ReactNode> = {
  models: <ModelsPage />,
  compare: <ComparePage />,
  batch: <BatchPage />,
  testsets: <TestSetsPage />,
  history: <HistoryPage />,
  stats: <StatsPage />,
};

export default function App() {
  const [current, setCurrent] = useState("models");
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token"),
  );

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const currentLabel = menuItems.find((m) => m.key === current)?.label;

  return (
    <Layout className="min-h-screen bg-transparent">
      {/* 侧边栏 */}
      <Sider
        width={220}
        className="bg-[var(--bg-sidebar)] backdrop-blur-[20px] [border-right:1px_solid_var(--glass-border)] fixed h-screen z-[100] flex flex-col"
      >
        {/* Logo 区 */}
        <div className="h-16 flex items-center justify-center [border-bottom:1px_solid_var(--glass-border)] shrink-0">
          <span className="gradient-text text-base font-bold tracking-wider">
            ⚡ 大模型评测
          </span>
        </div>

        {/* 导航菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[current]}
          items={menuItems}
          onClick={({ key }) => setCurrent(key)}
          className="bg-transparent border-none flex-1 mt-2"
        />

        {/* 底部退出按钮 */}
        <div className="p-4 [border-top:1px_solid_var(--glass-border)]">
          <Tooltip title="退出登录" placement="right">
            <Button
              icon={<LogoutOutlined />}
              type="text"
              block
              onClick={handleLogout}
              className="text-slate-400 text-left"
            >
              退出登录
            </Button>
          </Tooltip>
        </div>
      </Sider>

      {/* 主内容区 */}
      <Layout className="ml-55 bg-transparent min-h-screen">
        {/* 顶部标题栏 */}
        <div className="h-14 flex items-center px-6 bg-[var(--bg-header)] backdrop-blur-md [border-bottom:1px_solid_rgba(139,92,246,0.1)] sticky top-0 z-[99]">
          <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gradient-primary)] shadow-[0_0_8px_rgba(124,58,237,0.8)] inline-block" />
            {currentLabel}
          </span>
        </div>

        {/* 页面内容 */}
        <Content className="p-6 min-h-[calc(100vh-56px)]">
          {pageMap[current]}
        </Content>
      </Layout>
    </Layout>
  );
}
