import { useState } from "react";

import { App, Form, Input, Modal } from "antd";

import { testsetsApi } from "../../services/api";
import { TestSet } from "../../types";

interface Props {
  open: boolean;
  editing: TestSet | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TestSetFormModal({
  open,
  editing,
  onSuccess,
  onCancel,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      if (editing) {
        await testsetsApi.update(editing.id, values);
        message.success("更新成功");
      } else {
        await testsetsApi.create(values);
        message.success("创建成功");
      }
      onSuccess();
    } catch (err: unknown) {
      if (!(err instanceof Object && "errorFields" in err)) {
        message.error("操作失败");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? "编辑测评集" : "新建测评集"}
      open={open}
      onOk={handleSave}
      onCancel={onCancel}
      okText={editing ? "保存" : "新建"}
      cancelText="取消"
      confirmLoading={saving}
      destroyOnHidden
      afterOpenChange={(visible) => {
        if (visible) {
          if (editing) {
            form.setFieldsValue(editing);
          } else {
            form.resetFields();
          }
        }
      }}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item name="name" label="名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
