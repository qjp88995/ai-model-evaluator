import { useState } from "react";

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
  Upload,
} from "antd";

import { testsetsApi } from "../../services/api";
import { TestCase, TestSet } from "../../types";

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  testSet: TestSet | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (id: string) => void;
}

export default function CasesDrawer({
  testSet,
  open,
  onClose,
  onUpdated,
}: Props) {
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [caseForm] = Form.useForm();

  if (!testSet) return null;

  const handleSaveCase = async () => {
    const values = await caseForm.validateFields();
    try {
      if (editingCase) {
        await testsetsApi.updateCase(testSet.id, editingCase.id, values);
      } else {
        await testsetsApi.addCase(testSet.id, values);
      }
      message.success("保存成功");
      setCaseModalOpen(false);
      onUpdated(testSet.id);
    } catch {
      message.error("操作失败");
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      await testsetsApi.deleteCase(testSet.id, caseId);
      message.success("删除成功");
      onUpdated(testSet.id);
    } catch {
      message.error("删除失败");
    }
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const cases = lines
        .slice(1)
        .map((line) => {
          const cols = line.split(",");
          return {
            prompt: cols[0]?.trim().replace(/^"|"$/g, ""),
            referenceAnswer: cols[1]?.trim().replace(/^"|"$/g, ""),
            scoringCriteria: cols[2]?.trim().replace(/^"|"$/g, ""),
          };
        })
        .filter((c) => c.prompt);
      try {
        await testsetsApi.importCases(testSet.id, cases);
        message.success(`导入 ${cases.length} 条用例`);
        onUpdated(testSet.id);
      } catch {
        message.error("导入失败");
      }
    };
    reader.readAsText(file);
    return false;
  };

  const caseColumns = [
    { title: "Prompt", dataIndex: "prompt", key: "prompt", ellipsis: true },
    {
      title: "参考答案",
      dataIndex: "referenceAnswer",
      key: "referenceAnswer",
      ellipsis: true,
    },
    {
      title: "评分标准",
      dataIndex: "scoringCriteria",
      key: "scoringCriteria",
      ellipsis: true,
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: TestCase) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCase(record);
              caseForm.setFieldsValue(record);
              setCaseModalOpen(true);
            }}
          />
          <Popconfirm
            title="确认删除?"
            onConfirm={() => handleDeleteCase(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={testSet.name}
        open={open}
        onClose={onClose}
        size="large"
        extra={
          <Space>
            <Upload
              accept=".csv"
              beforeUpload={handleImportCSV}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>导入 CSV</Button>
            </Upload>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingCase(null);
                caseForm.resetFields();
                setCaseModalOpen(true);
              }}
              className="bg-(--gradient-primary) border-none shadow-(--shadow-btn)"
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
          dataSource={testSet.testCases ?? []}
          pagination={{ pageSize: 10 }}
        />
      </Drawer>

      <Modal
        title={editingCase ? "编辑用例" : "添加用例"}
        open={caseModalOpen}
        onOk={handleSaveCase}
        onCancel={() => setCaseModalOpen(false)}
        destroyOnHidden
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
    </>
  );
}
