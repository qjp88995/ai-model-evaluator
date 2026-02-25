import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { authApi } from "../../services/api";

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: {
    username: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values.username, values.password);
      localStorage.setItem("token", res.data.access_token);
      onLogin();
    } catch {
      message.error("用户名或密码错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 背景光晕装饰 */}
      <div className="absolute w-150 h-150 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,transparent_70%)] -top-25 -left-25 pointer-events-none" />
      <div className="absolute w-100 h-100 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.12)_0%,transparent_70%)] -bottom-[50px] right-[10%] pointer-events-none" />

      {/* 登录卡片 */}
      <div className="glass-card w-95 px-9 py-10">
        {/* 图标 + 标题 */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--gradient-primary)] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(124,58,237,0.4)]">
            <ThunderboltOutlined className="text-2xl text-white" />
          </div>
          <h1 className="gradient-text text-[22px] font-bold m-0 leading-[1.3]">
            大模型评测平台
          </h1>
          <p className="text-slate-400 text-[13px] m-0 mt-1.5">
            AI Model Evaluation System
          </p>
        </div>

        {/* 表单 */}
        <Form onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input
              prefix={<UserOutlined className="text-slate-400" />}
              placeholder="用户名"
              size="large"
              className="bg-[rgba(255,255,255,0.06)] [border:1px_solid_rgba(139,92,246,0.25)] rounded-lg"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-slate-400" />}
              placeholder="密码"
              size="large"
              className="bg-[rgba(255,255,255,0.06)] [border:1px_solid_rgba(139,92,246,0.25)] rounded-lg"
            />
          </Form.Item>
          <Form.Item className="mb-0 mt-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="bg-[var(--gradient-primary)] border-none rounded-lg font-semibold h-11 shadow-[var(--shadow-btn-lg)]"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
