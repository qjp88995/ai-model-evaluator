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
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      {/* 侧边栏 */}
      <Sider
        width={220}
        style={{
          background: "rgba(15, 10, 40, 0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(139, 92, 246, 0.15)",
          position: "fixed",
          height: "100vh",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo 区 */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(139, 92, 246, 0.15)",
            flexShrink: 0,
          }}
        >
          <span
            className="gradient-text"
            style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.05em" }}
          >
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
          style={{
            background: "transparent",
            border: "none",
            flex: 1,
            marginTop: 8,
          }}
        />

        {/* 底部退出按钮 */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid rgba(139, 92, 246, 0.15)",
          }}
        >
          <Tooltip title="退出登录" placement="right">
            <Button
              icon={<LogoutOutlined />}
              type="text"
              block
              onClick={handleLogout}
              style={{ color: "#94a3b8", textAlign: "left" }}
            >
              退出登录
            </Button>
          </Tooltip>
        </div>
      </Sider>

      {/* 主内容区 */}
      <Layout
        style={{
          marginLeft: 220,
          background: "transparent",
          minHeight: "100vh",
        }}
      >
        {/* 顶部标题栏 */}
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            background: "rgba(15, 10, 40, 0.5)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(139, 92, 246, 0.1)",
            position: "sticky",
            top: 0,
            zIndex: 99,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 15,
              fontWeight: 600,
              color: "#e2e8f0",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                boxShadow: "0 0 8px rgba(124, 58, 237, 0.8)",
                display: "inline-block",
              }}
            />
            {currentLabel}
          </span>
        </div>

        {/* 页面内容 */}
        <Content style={{ padding: 24, minHeight: "calc(100vh - 56px)" }}>
          {pageMap[current]}
        </Content>
      </Layout>
    </Layout>
  );
}
