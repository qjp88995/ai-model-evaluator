import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { authApi } from '../../services/api';

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values.username, values.password);
      localStorage.setItem('token', res.data.access_token);
      onLogin();
    } catch {
      message.error('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景光晕装饰 */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
          top: '-100px',
          left: '-100px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.12) 0%, transparent 70%)',
          bottom: '-50px',
          right: '10%',
          pointerEvents: 'none',
        }}
      />

      {/* 登录卡片 */}
      <div
        className="glass-card"
        style={{ width: 380, padding: '40px 36px' }}
      >
        {/* 图标 + 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 30px rgba(124, 58, 237, 0.4)',
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <h1
            className="gradient-text"
            style={{ fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.3 }}
          >
            大模型评测平台
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '6px 0 0' }}>
            AI Model Evaluation System
          </p>
        </div>

        {/* 表单 */}
        <Form onFinish={handleSubmit} autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
              placeholder="用户名"
              size="large"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: 8,
              }}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="密码"
              size="large"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: 8,
              }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                height: 44,
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
