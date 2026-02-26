import { useState } from 'react';

import { App, Form, Input, Modal, Select } from 'antd';

import { evalApi } from '@/services/api';
import { LlmModel, TestSet } from '@/types';

interface Props {
  open: boolean;
  models: LlmModel[];
  testSets: TestSet[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BatchNewModal({
  open,
  models,
  testSets,
  onSuccess,
  onCancel,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const judgeModels = models.filter(m => m.isJudge);

  const handleOk = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await evalApi.createBatch(values);
      message.success('批量测评已启动，后台运行中');
      form.resetFields();
      onSuccess();
    } catch (err: any) {
      message.error(err.response?.data?.message ?? '启动失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="新建批量测评"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="开始测评"
      cancelText="取消"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item name="name" label="任务名称">
          <Input placeholder="可选，留空自动生成" />
        </Form.Item>
        <Form.Item
          name="modelIds"
          label="测评模型"
          rules={[{ required: true, message: '请选择至少一个模型' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择模型"
            options={models.map(m => ({
              value: m.id,
              label: `${m.name} (${m.modelId})`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="testSetId"
          label="测评集"
          rules={[{ required: true, message: '请选择测评集' }]}
        >
          <Select
            placeholder="选择测评集"
            options={testSets.map(s => ({
              value: s.id,
              label: `${s.name} (${s._count?.testCases ?? 0} 条)`,
            }))}
          />
        </Form.Item>
        <Form.Item name="judgeModelId" label="裁判模型（可选）">
          <Select
            placeholder="选择裁判模型进行自动评分"
            allowClear
            options={judgeModels.map(m => ({ value: m.id, label: m.name }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
