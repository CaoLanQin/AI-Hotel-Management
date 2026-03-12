import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Row, Col, Select, Tag, Button, Table, Modal, Form, Input, Switch, Radio, InputNumber, message, Popconfirm, Empty, Badge } from 'antd';
import { 
  Plus, PlayCircle, PauseCircle, Edit, Delete, Search
} from 'lucide-react';
import api from '../lib/api';

const { Option } = Select;
const { TextArea } = Input;

interface Rule {
  id: number;
  name: string;
  description: string;
  trigger_type: string;
  trigger_condition: any;
  actions: any;
  priority: number;
  is_active: boolean;
  execution_count: number;
  success_rate: number;
  last_executed_at: string;
  created_at: string;
  category: string;
}

const ruleCategories = [
  { value: 'all', label: '全部规则' },
  { value: 'device', label: '设备规则' },
  { value: 'business', label: '业务规则' },
  { value: 'security', label: '安全规则' },
];

const ruleStatus = [
  { value: 'all', label: '全部' },
  { value: 'running', label: '运行中' },
  { value: 'paused', label: '已暂停' },
  { value: 'error', label: '异常' },
];

const RulesPage = () => {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [form] = Form.useForm();

  // Get all rules
  const { data: rulesData, isLoading, refetch } = useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      const res = await api.get('/devices/rules');
      return res.data || [];
    },
  });

  // Filter rules
  const filteredRules = (rulesData || []).filter((rule: Rule) => {
    if (category !== 'all' && rule.category !== category) return false;
    if (statusFilter === 'running' && !rule.is_active) return false;
    if (statusFilter === 'paused' && rule.is_active) return false;
    if (searchKeyword && !rule.name.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
    return true;
  });

  // Toggle rule status
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return api.put(`/devices/rules/${id}`, { is_active: isActive });
    },
    onSuccess: () => {
      message.success('规则状态已更新');
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });

  // Delete rule
  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/devices/rules/${id}`),
    onSuccess: () => {
      message.success('规则已删除');
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });

  // Save rule
  const saveRuleMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingRule?.id) {
        return api.put(`/devices/rules/${editingRule.id}`, values);
      } else {
        return api.post('/devices/rules', values);
      }
    },
    onSuccess: () => {
      message.success('规则保存成功');
      setShowModal(false);
      form.resetFields();
      setEditingRule(null);
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || '保存失败');
    },
  });

  // Handle form submit
  const handleSubmit = (values: any) => {
    saveRuleMutation.mutate(values);
  };

  // Open edit modal
  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      name: rule.name,
      description: rule.description,
      category: rule.category,
      priority: rule.priority,
      trigger_type: rule.trigger_type,
      trigger_condition: JSON.stringify(rule.trigger_condition, null, 2),
      actions: JSON.stringify(rule.actions, null, 2),
      is_active: rule.is_active,
    });
    setShowModal(true);
  };

  // Statistics
  const stats = {
    total: (rulesData || []).length,
    running: (rulesData || []).filter((r: Rule) => r.is_active).length,
    paused: (rulesData || []).filter((r: Rule) => !r.is_active).length,
  };

  // Get priority tag
  const getPriorityTag = (priority: number) => {
    if (priority >= 9) return <Tag color="red">紧急</Tag>;
    if (priority >= 7) return <Tag color="orange">高</Tag>;
    if (priority >= 5) return <Tag color="blue">中</Tag>;
    return <Tag>低</Tag>;
  };

  // Get category name
  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      device: '设备规则',
      business: '业务规则',
      security: '安全规则',
    };
    return names[category] || category;
  };

  // Render trigger condition display
  const renderCondition = (condition: any) => {
    if (!condition) return '-';
    if (condition.time) {
      return `时间: ${condition.time}`;
    }
    if (condition.device_type && condition.state) {
      return `${condition.device_type} ${condition.state}`;
    }
    return JSON.stringify(condition);
  };

  // Render actions display
  const renderActions = (actions: any) => {
    if (!actions || !actions.length) return '-';
    return actions.map((action: any) => {
      if (action.device_type) {
        return `${action.device_type}: ${action.action}`;
      }
      return JSON.stringify(action);
    }).join(', ');
  };

  // Columns
  const columns = [
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        isActive ? 
          <Badge status="success" text="运行中" /> : 
          <Badge status="default" text="已暂停" />
      ),
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Rule) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-400">{record.description}</div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag>{getCategoryName(category)}</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => getPriorityTag(priority),
    },
    {
      title: '触发条件',
      key: 'trigger',
      render: (_: any, record: Rule) => (
        <div className="text-sm">
          <div>{renderCondition(record.trigger_condition)}</div>
        </div>
      ),
    },
    {
      title: '执行动作',
      key: 'actions',
      render: (_: any, record: Rule) => (
        <div className="text-sm">{renderActions(record.actions)}</div>
      ),
    },
    {
      title: '执行统计',
      key: 'stats',
      render: (_: any, record: Rule) => (
        <div className="text-xs">
          <div>执行: {record.execution_count || 0} 次</div>
          <div>成功率: {((record.success_rate || 0) * 100).toFixed(1)}%</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Rule) => (
        <div className="flex gap-1">
          <Button 
            type="link" 
            size="small"
            icon={record.is_active ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
            onClick={() => toggleRuleMutation.mutate({ id: record.id, isActive: !record.is_active })}
          >
            {record.is_active ? '暂停' : '启用'}
          </Button>
          <Button 
            type="link" 
            size="small"
            icon={<Edit size={14} />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此规则吗？"
            onConfirm={() => deleteRuleMutation.mutate(record.id)}
          >
            <Button type="link" size="small" danger icon={<Delete size={14} />}>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">⚙️ 规则引擎</h1>
        <Button 
          type="primary" 
          icon={<Plus size={18} />}
          onClick={() => {
            setEditingRule(null);
            form.resetFields();
            setShowModal(true);
          }}
        >
          新建规则
        </Button>
      </div>

      {/* Category Tabs */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {ruleCategories.map(cat => (
              <Button
                key={cat.value}
                type={category === cat.value ? 'primary' : 'default'}
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-4">
            <Tag color="green">运行中: {stats.running}</Tag>
            <Tag>暂停: {stats.paused}</Tag>
            <Tag>总计: {stats.total}</Tag>
          </div>
        </div>
      </Card>

      {/* Filter Bar */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="搜索规则名称..."
              prefix={<Search size={16} />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={8}>
            <Select
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              {ruleStatus.map(s => (
                <Option key={s.value} value={s.value}>{s.label}</Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Button onClick={() => refetch()}>刷新</Button>
          </Col>
        </Row>
      </Card>

      {/* Rules List */}
      <Card>
        <Table
          dataSource={filteredRules}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="暂无规则，请创建新规则" /> }}
        />
      </Card>

      {/* Rule Editor Modal */}
      <Modal
        title={editingRule ? '编辑规则' : '新建规则'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingRule(null);
          form.resetFields();
        }}
        width={700}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="规则名称"
                rules={[{ required: true, message: '请输入规则名称' }]}
              >
                <Input placeholder="例如：夜间自动关空调" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="优先级"
                initialValue={5}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="规则描述"
          >
            <TextArea rows={2} placeholder="描述规则的作用..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="规则分类"
                rules={[{ required: true }]}
                initialValue="device"
              >
                <Radio.Group>
                  <Radio.Button value="device">设备规则</Radio.Button>
                  <Radio.Button value="business">业务规则</Radio.Button>
                  <Radio.Button value="security">安全规则</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="trigger_type"
                label="触发类型"
                rules={[{ required: true }]}
                initialValue="time"
              >
                <Select>
                  <Option value="time">时间触发</Option>
                  <Option value="device_state">设备状态</Option>
                  <Option value="sensor">传感器</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="trigger_condition"
            label="触发条件 (JSON)"
            rules={[{ required: true, message: '请输入触发条件' }]}
            extra={'示例: {"time": "23:00", "room_status": "occupied"}'}
          >
            <TextArea 
              rows={3} 
              placeholder='{"time": "23:00", "room_status": "occupied"}'
              defaultValue='{"time": "23:00"}'
            />
          </Form.Item>

          <Form.Item
            name="actions"
            label="执行动作 (JSON)"
            rules={[{ required: true, message: '请输入执行动作' }]}
            extra={'示例: [{"device_type": "ac", "action": "off"}]'}
          >
            <TextArea 
              rows={3} 
              placeholder='[{"device_type": "ac", "action": "off"}]'
              defaultValue='[{"device_type": "ac", "action": "off"}]'
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="是否立即启用"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={saveRuleMutation.isPending}>
                保存
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RulesPage;
