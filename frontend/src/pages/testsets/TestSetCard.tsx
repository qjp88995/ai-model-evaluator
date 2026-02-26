import { DeleteOutlined, EditOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space, Tag } from "antd";

import { TestSet } from "@/types";

interface Props {
  testSet: TestSet;
  onManage: (testSet: TestSet) => void;
  onEdit: (testSet: TestSet) => void;
  onDelete: (id: string) => void;
}

export default function TestSetCard({ testSet, onManage, onEdit, onDelete }: Props) {
  return (
    <div className="glass-card px-5 py-4 flex flex-col gap-3 min-h-40">
      {/* 名称 */}
      <div className="font-semibold text-sm leading-tight">{testSet.name}</div>

      {/* 描述 */}
      {testSet.description && (
        <div className="text-xs text-gray-500 line-clamp-2">{testSet.description}</div>
      )}

      {/* 用例数 */}
      <div>
        <Tag>{testSet._count?.testCases ?? 0} 条用例</Tag>
      </div>

      {/* 操作按钮（推到底部） */}
      <Space size="small" className="mt-auto">
        <Button size="small" icon={<UnorderedListOutlined />} onClick={() => onManage(testSet)}>
          管理用例
        </Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(testSet)} />
        <Popconfirm title="确认删除?" onConfirm={() => onDelete(testSet.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    </div>
  );
}
