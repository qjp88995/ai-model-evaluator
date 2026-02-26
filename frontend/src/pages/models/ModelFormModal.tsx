import { useState } from 'react';

import { App, Form, Input, InputNumber, Modal, Select, Switch } from 'antd';

import { modelsApi } from '@/services/api';
import { LlmModel } from '@/types';

import { PROVIDER_DEFAULT_URLS, PROVIDERS } from './providerConfig';

interface Props {
  open: boolean;
  editing: LlmModel | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ModelFormModal({
  open,
  editing,
  onSuccess,
  onCancel,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const initForm = () => {
    if (editing) {
      form.setFieldsValue({ ...editing, apiKey: '' });
    } else {
      form.resetFields();
      form.setFieldsValue({
        temperature: 0.7,
        topP: 1.0,
        maxTokens: 2048,
        timeout: 30000,
        retryCount: 2,
        isJudge: false,
        isActive: true,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      if (editing && !values.apiKey) delete values.apiKey;
      if (editing) {
        await modelsApi.update(editing.id, values);
        message.success('更新成功');
      } else {
        await modelsApi.create(values);
        message.success('创建成功');
      }
      onSuccess();
    } catch (err: any) {
      // validateFields 校验失败时 err.errorFields 存在，antd 已显示字段错误，无需额外提示
      if (!err?.errorFields) {
        message.error(err.response?.data?.message ?? '操作失败');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? '编辑模型' : '添加模型'}
      open={open}
      onOk={handleSave}
      onCancel={onCancel}
      confirmLoading={saving}
      okText={editing ? '保存' : '添加'}
      cancelText="取消"
      width={640}
      destroyOnHidden
      afterOpenChange={visible => {
        if (visible) initForm();
      }}
      styles={{ body: { maxHeight: '65vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item name="name" label="显示名称" rules={[{ required: true }]}>
          <Input placeholder="例: GPT-4o" />
        </Form.Item>

        <Form.Item name="provider" label="服务商" rules={[{ required: true }]}>
          <Select
            options={PROVIDERS}
            onChange={v => {
              form.setFieldValue('baseUrl', PROVIDER_DEFAULT_URLS[v] ?? '');
            }}
          />
        </Form.Item>

        <Form.Item
          name="apiKey"
          label={editing ? 'API Key（留空保持不变）' : 'API Key'}
          rules={editing ? [] : [{ required: true }]}
        >
          <Input.Password placeholder="sk-..." />
        </Form.Item>

        <Form.Item name="baseUrl" label="Base URL（OpenAI 兼容接口自定义）">
          <Input placeholder="https://api.openai.com/v1" />
        </Form.Item>

        <Form.Item name="modelId" label="Model ID" rules={[{ required: true }]}>
          <Input placeholder="gpt-4o / claude-3-5-sonnet-20241022" />
        </Form.Item>

        <div className="grid grid-cols-3 gap-4">
          <Form.Item name="temperature" label="Temperature">
            <InputNumber min={0} max={2} step={0.1} className="w-full" />
          </Form.Item>
          <Form.Item name="topP" label="Top P">
            <InputNumber min={0} max={1} step={0.1} className="w-full" />
          </Form.Item>
          <Form.Item name="maxTokens" label="Max Tokens">
            <InputNumber min={1} max={128000} className="w-full" />
          </Form.Item>
        </div>

        <Form.Item name="systemPrompt" label="系统提示词">
          <Input.TextArea rows={3} placeholder="可选" />
        </Form.Item>

        <div className="grid grid-cols-3 gap-4">
          <Form.Item name="timeout" label="超时(ms)">
            <InputNumber min={1000} className="w-full" />
          </Form.Item>
          <Form.Item name="retryCount" label="重试次数">
            <InputNumber min={0} max={5} className="w-full" />
          </Form.Item>
        </div>

        <div className="flex gap-8">
          <Form.Item
            name="isJudge"
            label="可作为裁判模型"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
