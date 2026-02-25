import { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Space, Popconfirm, message,
  Drawer, Tag, Upload, Typography,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UnorderedListOutlined, UploadOutlined,
} from '@ant-design/icons';
import { testsetsApi } from '../../services/api';
import { TestSet, TestCase } from '../../types';

const { TextArea } = Input;
const { Text } = Typography;

export default function TestSetsPage() {
  const [sets, setSets] = useState<TestSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<TestSet | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentSet, setCurrentSet] = useState<TestSet | null>(null);
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [setForm] = Form.useForm();
  const [caseForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await testsetsApi.list();
      setSets(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadSet = async (id: string) => {
    const res = await testsetsApi.get(id);
    setCurrentSet(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleSaveSet = async () => {
    const values = await setForm.validateFields();
    try {
      if (editingSet) {
        await testsetsApi.update(editingSet.id, values);
        message.success('更新成功');
      } else {
        await testsetsApi.create(values);
        message.success('创建成功');
      }
      setSetModalOpen(false);
      load();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDeleteSet = async (id: string) => {
    await testsetsApi.delete(id);
    message.success('删除成功');
    load();
  };

  const openDrawer = async (set: TestSet) => {
    await loadSet(set.id);
    setDrawerOpen(true);
  };

  const handleSaveCase = async () => {
    const values = await caseForm.validateFields();
    try {
      if (editingCase) {
        await testsetsApi.updateCase(currentSet!.id, editingCase.id, values);
      } else {
        await testsetsApi.addCase(currentSet!.id, values);
      }
      message.success('保存成功');
      setCaseModalOpen(false);
      loadSet(currentSet!.id);
    } catch {
      message.error('操作失败');
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    await testsetsApi.deleteCase(currentSet!.id, caseId);
    message.success('删除成功');
    loadSet(currentSet!.id);
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(Boolean);
      const cases = lines.slice(1).map((line) => {
        const cols = line.split(',');
        return {
          prompt: cols[0]?.trim().replace(/^"|"$/g, ''),
          referenceAnswer: cols[1]?.trim().replace(/^"|"$/g, ''),
          scoringCriteria: cols[2]?.trim().replace(/^"|"$/g, ''),
        };
      }).filter((c) => c.prompt);
      try {
        await testsetsApi.importCases(currentSet!.id, cases);
        message.success(`导入 ${cases.length} 条用例`);
        loadSet(currentSet!.id);
      } catch {
        message.error('导入失败');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const setColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '用例数', key: 'count',
      render: (_: any, r: TestSet) => <Tag>{r._count?.testCases ?? 0}</Tag>,
    },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: TestSet) => (
        <Space>
          <Button size="small" icon={<UnorderedListOutlined />} onClick={() => openDrawer(record)}>
            管理用例
          </Button>
          <Button
            size="small" icon={<EditOutlined />}
            onClick={() => {
              setEditingSet(record);
              setForm.setFieldsValue(record);
              setSetModalOpen(true);
            }}
          />
          <Popconfirm title="确认删除?" onConfirm={() => handleDeleteSet(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const caseColumns = [
    { title: 'Prompt', dataIndex: 'prompt', key: 'prompt', ellipsis: true },
    { title: '参考答案', dataIndex: 'referenceAnswer', key: 'referenceAnswer', ellipsis: true },
    { title: '评分标准', dataIndex: 'scoringCriteria', key: 'scoringCriteria', ellipsis: true },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: TestCase) => (
        <Space>
          <Button
            size="small" icon={<EditOutlined />}
            onClick={() => {
              setEditingCase(record);
              caseForm.setFieldsValue(record);
              setCaseModalOpen(true);
            }}
          />
          <Popconfirm title="确认删除?" onConfirm={() => handleDeleteCase(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="glass-card px-6 py-5">
      <div className="mb-4 flex justify-end">
        <Button
          type="primary" icon={<PlusOutlined />}
          onClick={() => {
            setEditingSet(null);
            setForm.resetFields();
            setSetModalOpen(true);
          }}
          className="!bg-[linear-gradient(135deg,#7c3aed,#3b82f6)] !border-none shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
        >
          新建测评集
        </Button>
      </div>

      <Table rowKey="id" columns={setColumns} dataSource={sets} loading={loading} />

      <Modal
        title={editingSet ? '编辑测评集' : '新建测评集'}
        open={setModalOpen}
        onOk={handleSaveSet}
        onCancel={() => setSetModalOpen(false)}
        destroyOnClose
      >
        <Form form={setForm} layout="vertical" className="mt-4">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={currentSet?.name}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={800}
        extra={
          <Space>
            <Upload accept=".csv" beforeUpload={handleImportCSV} showUploadList={false}>
              <Button icon={<UploadOutlined />}>导入 CSV</Button>
            </Upload>
            <Button
              type="primary" icon={<PlusOutlined />}
              onClick={() => {
                setEditingCase(null);
                caseForm.resetFields();
                setCaseModalOpen(true);
              }}
              className="!bg-[linear-gradient(135deg,#7c3aed,#3b82f6)] !border-none shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
            >
              添加用例
            </Button>
          </Space>
        }
      >
        <Text type="secondary" className="block mb-2">
          CSV 格式：prompt,referenceAnswer,scoringCriteria（第一行为表头）
        </Text>
        <Table
          rowKey="id"
          size="small"
          columns={caseColumns}
          dataSource={currentSet?.testCases ?? []}
          pagination={{ pageSize: 10 }}
        />
      </Drawer>

      <Modal
        title={editingCase ? '编辑用例' : '添加用例'}
        open={caseModalOpen}
        onOk={handleSaveCase}
        onCancel={() => setCaseModalOpen(false)}
        destroyOnClose
      >
        <Form form={caseForm} layout="vertical" className="mt-4">
          <Form.Item name="prompt" label="Prompt" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="referenceAnswer" label="参考答案">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="scoringCriteria" label="评分标准">
            <Input placeholder="例: 准确性、完整性、简洁性" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
