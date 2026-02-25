import { Outlet, useLocation, useNavigate } from "react-router";

import {
  BarChartOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  LogoutOutlined,
  OrderedListOutlined,
  RobotOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Menu, Tooltip } from "antd";

const menuItems = [
  { key: "models", icon: <SettingOutlined />, label: "模型管理" },
  { key: "compare", icon: <RobotOutlined />, label: "实时对比" },
  { key: "batch", icon: <ExperimentOutlined />, label: "批量测评" },
  { key: "testsets", icon: <OrderedListOutlined />, label: "测评集管理" },
  { key: "history", icon: <HistoryOutlined />, label: "历史记录" },
  { key: "stats", icon: <BarChartOutlined />, label: "用量统计" },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 从路径中提取当前页面 key，如 "/models" → "models"
  const current = location.pathname.replace(/^\//, "") || "models";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const currentLabel = menuItems.find((m) => m.key === current)?.label;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-55 shrink-0 flex flex-col bg-(--bg-sidebar) backdrop-blur-[20px] [border-right:1px_solid_var(--glass-border)] overflow-y-auto">
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
          onClick={({ key }) => navigate(`/${key}`)}
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
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 顶部标题栏 */}
        <header className="h-16 shrink-0 flex items-center px-6 bg-(--bg-header) backdrop-blur-md [border-bottom:1px_solid_rgba(139,92,246,0.1)]">
          <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-(--gradient-primary) shadow-[0_0_8px_rgba(124,58,237,0.8)] inline-block" />
            {currentLabel}
          </span>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
