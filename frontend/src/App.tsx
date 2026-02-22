import { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  RobotOutlined,
  SettingOutlined,
  BarChartOutlined,
  OrderedListOutlined,
  HistoryOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import ModelsPage from './pages/models/ModelsPage';
import ComparePage from './pages/compare/ComparePage';
import BatchPage from './pages/batch/BatchPage';
import TestSetsPage from './pages/testsets/TestSetsPage';
import HistoryPage from './pages/history/HistoryPage';
import StatsPage from './pages/stats/StatsPage';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: 'models', icon: <SettingOutlined />, label: '模型管理' },
  { key: 'compare', icon: <RobotOutlined />, label: '实时对比' },
  { key: 'batch', icon: <ExperimentOutlined />, label: '批量测评' },
  { key: 'testsets', icon: <OrderedListOutlined />, label: '测评集管理' },
  { key: 'history', icon: <HistoryOutlined />, label: '历史记录' },
  { key: 'stats', icon: <BarChartOutlined />, label: '用量统计' },
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
  const [current, setCurrent] = useState('models');
  const { token } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: token.colorPrimary,
            fontSize: 16,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          大模型评测平台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[current]}
          items={menuItems}
          onClick={({ key }) => setCurrent(key)}
          style={{ marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {menuItems.find((m) => m.key === current)?.label}
          </span>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          {pageMap[current]}
        </Content>
      </Layout>
    </Layout>
  );
}
