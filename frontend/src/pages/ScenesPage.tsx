import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Row, Col, Select, Button, Table, Modal, Form, Input, Switch, Tag, message, Popconfirm, Empty, Badge, Statistic } from 'antd';
import { 
  Plus, PlayCircle, Edit, Delete, Search, Layers
} from 'lucide-react';
import api from '../lib/api';

const { Option } = Select;
const { TextArea } = Input;

interface Scene {
  id: number;
  name: string;
  code: string;
  description: string;
  room_id: number;
  actions: any[];
  is_active: boolean;
  execution_count: number;
  created_at: string;
  room?: {
    number: string;
  };
}

const ScenesPage = () => {
  const queryClient = useQueryClient();
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [form] = Form.useForm();

  // Get all scenes
  const { data: scenesData, isLoading, refetch } = useQuery({
    queryKey: ['scenes'],
    queryFn: async () => {
      const res = await api.get('/devices/scenes');
      return res.data || [];
    },
  });

  // Get all rooms for filter
  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data?.rooms || res.data || [];
    },
  });

  // Filter scenes
  const filteredScenes = (scenesData || []).filter((scene: Scene) => {
    if (selectedRoom && scene.room_id !== selectedRoom) return false;
    if (searchKeyword && !scene.name.toLowerCase().includes(searchKeyword.toLowerCase()) && 
        !scene.code?.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
    return true;
  });

  // Execute scene
  const executeSceneMutation = useMutation({
    mutationFn: async (sceneId: number) => {
      return api.post(`/devices/scene/${sceneId}/execute`);
    },
    onSuccess: () => {
      message.success('场景执行成功');
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
    },
    onError: () => {
      message.error('场景执行失败');
    },
  });

  // Delete scene
  const deleteSceneMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/devices/scenes/${id}`),
    onSuccess: () => {
      message.success('场景已删除');
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
    },
  });

  // Save scene
  const saveSceneMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingScene?.id) {
        return api.put(`/devices/scenes/${editingScene.id}`, values);
      } else {
        return api.post('/devices/scenes', values);
      }
    },
    onSuccess: () => {
      message.success('场景保存成功');
      setShowModal(false);
      form.resetFields();
      setEditingScene(null);
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || '保存失败');
    },
  });

  // Handle form submit
  const handleSubmit = (values: any) => {
    saveSceneMutation.mutate(values);
  };

  // Open edit modal
  const handleEdit = (scene: Scene) => {
    setEditingScene(scene);
    form.setFieldsValue({
      name: scene.name,
      code: scene.code,
      description: scene.description,
      room_id: scene.room_id,
      actions: JSON.stringify(scene.actions, null, 2),
      is_active: scene.is_active,
    });
    setShowModal(true);
  };

  // Statistics
  const stats = {
    total: (scenesData || []).length,
    active: (scenesData || []).filter((s: Scene) => s.is_active).length,
    totalExecutions: (scenesData || []).reduce((sum: number, s: Scene) => sum + (s.execution_count || 0), 0),
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
          <Badge status="success" text="启用" /> : 
          <Badge status="default" text="停用" />
      ),
    },
    {
      title: '场景名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Scene) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-400">编码: {record.code}</div>
        </div>
      ),
    },
    {
      title: '适用房间',
      key: 'room',
      render: (_: any, record: Scene) => record.room?.number || '全局',
    },
    {
      title: '执行动作',
      key: 'actions',
      render: (_: any, record: Scene) => (
        <div className="flex flex-wrap gap-1">
          {(record.actions || []).slice(0, 3).map((action: any, idx: number) => (
            <Tag key={idx} color="blue">
              {action.device_type}: {action.action}
            </Tag>
          ))}
          {(record.actions || []).length > 3 && (
            <Tag>+{(record.actions || []).length - 3}</Tag>
          )}
        </div>
      ),
    },
    {
      title: '执行次数',
      dataIndex: 'execution_count',
      key: 'execution_count',
      render: (count: number) => count || 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Scene) => (
        <div className="flex gap-1">
          <Button 
            type="primary"
            size="small"
            icon={<PlayCircle size={14} />}
            onClick={() => executeSceneMutation.mutate(record.id)}
            loading={executeSceneMutation.isPending}
          >
            执行
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
            title="确定删除此场景吗？"
            onConfirm={() => deleteSceneMutation.mutate(record.id)}
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
        <h1 className="text-2xl font-bold">🎬 场景管理</h1>
        <Button 
          type="primary" 
          icon={<Plus size={18} />}
          onClick={() => {
            setEditingScene(null);
            form.resetFields();
            setShowModal(true);
          }}
        >
          新建场景
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card>
            <Statistic title="场景总数" value={stats.total} prefix={<Layers />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="启用中" value={stats.active} prefix={<PlayCircle />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="累计执行" value={stats.totalExecutions} />
          </Card>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="搜索场景名称/编码..."
              prefix={<Search size={16} />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={8}>
            <Select
              style={{ width: 200 }}
              placeholder="筛选房间"
              value={selectedRoom}
              onChange={setSelectedRoom}
              allowClear
            >
              {(roomsData || []).map((room: any) => (
                <Option key={room.id} value={room.id}>
                  {room.number}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Button onClick={() => refetch()}>刷新</Button>
          </Col>
        </Row>
      </Card>

      {/* Scenes List */}
      <Card>
        <Table
          dataSource={filteredScenes}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="暂无场景，请创建新场景" /> }}
        />
      </Card>

      {/* Scene Editor Modal */}
      <Modal
        title={editingScene ? '编辑场景' : '新建场景'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingScene(null);
          form.resetFields();
        }}
        width={600}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="场景名称"
            rules={[{ required: true, message: '请输入场景名称' }]}
          >
            <Input placeholder="例如：迎宾模式" />
          </Form.Item>

          <Form.Item
            name="code"
            label="场景编码"
            rules={[{ required: true, message: '请输入场景编码' }]}
          >
            <Input placeholder="例如：welcome" />
          </Form.Item>

          <Form.Item
            name="description"
            label="场景描述"
          >
            <TextArea rows={2} placeholder="描述场景的作用..." />
          </Form.Item>

          <Form.Item
            name="room_id"
            label="适用房间"
            tooltip="留空表示全局场景，适用于所有房间"
          >
            <Select placeholder="选择房间（可选）" allowClear>
              {(roomsData || []).map((room: any) => (
                <Option key={room.id} value={room.id}>
                  {room.number} - {room.room_type?.name || '未知房型'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="actions"
            label="执行动作 (JSON)"
            rules={[{ required: true, message: '请输入执行动作' }]}
            extra={'示例: [{"device_type": "light", "action": "on", "value": {"brightness": 100}}]'}
          >
            <TextArea 
              rows={4} 
              placeholder='[{"device_type": "light", "action": "on"}]'
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="是否启用"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={saveSceneMutation.isPending}>
                保存
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScenesPage;
