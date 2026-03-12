import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Row, Col, Select, Button, Table, message, Modal, Radio, Input } from 'antd';
import { ArrowUp, ArrowDown, DollarSign, User, Home, Calendar, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface CheckInData {
  id: number;
  check_in_no: string;
  guest: {
    id: number;
    name: string;
    phone: string;
    vip_level?: string;
  };
  room: {
    id: number;
    number: string;
    room_type: {
      id: number;
      name: string;
      base_price: number;
    };
  };
  check_in_time: string;
  check_out_time: string;
  actual_check_in_time: string;
  room_rate: number;
  status: string;
}

interface RoomType {
  id: number;
  name: string;
  base_price: number;
  floor?: number;
  max_occupancy?: number;
}

const UpgradePage = () => {
  const queryClient = useQueryClient();
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckInData | null>(null);
  const [upgradeType, setUpgradeType] = useState<'upgrade' | 'downgrade'>('upgrade');
  const [selectedNewRoomType, setSelectedNewRoomType] = useState<RoomType | null>(null);
  const [selectedNewRoom, setSelectedNewRoom] = useState<any>(null);
  const [reasonType, setReasonType] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  // Get current in-house guests
  const { data: checkInList, isLoading } = useQuery({
    queryKey: ['checkins'],
    queryFn: async () => {
      const res = await api.get('/checkin');
      return res.data.filter((c: CheckInData) => c.status === 'checked_in');
    },
  });

  // Get room types
  const { data: roomTypes } = useQuery({
    queryKey: ['room-types'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data?.room_types || [];
    },
  });

  // Get available rooms for new room type
  const { data: availableRooms } = useQuery({
    queryKey: ['available-rooms', selectedNewRoomType?.id],
    queryFn: async () => {
      if (!selectedNewRoomType) return [];
      const res = await api.get('/rooms/available');
      return res.data?.filter((r: any) => 
        r.room_type?.id === selectedNewRoomType.id && r.status === 'available'
      ) || [];
    },
    enabled: !!selectedNewRoomType,
  });

  // Calculate remaining nights
  const getRemainingNights = (checkIn: CheckInData): number => {
    const checkOutDate = dayjs(checkIn.check_out_time);
    const now = dayjs();
    const nights = checkOutDate.diff(now, 'day');
    return nights > 0 ? nights : 0;
  };

  // Calculate price difference
  const calculatePriceDiff = (): { perNight: number; total: number } => {
    if (!selectedCheckIn || !selectedNewRoomType) {
      return { perNight: 0, total: 0 };
    }
    const oldRate = selectedCheckIn.room_rate;
    const newRate = selectedNewRoomType.base_price;
    const diff = newRate - oldRate;
    const nights = getRemainingNights(selectedCheckIn);
    return {
      perNight: diff,
      total: diff * nights,
    };
  };

  // Upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCheckIn || !selectedNewRoomType || !selectedNewRoom) {
        throw new Error('Missing required fields');
      }
      const priceDiff = calculatePriceDiff();
      
      return api.post(`/checkin/upgrade?check_in_id=${selectedCheckIn.id}&upgrade_type=${upgradeType === 'upgrade' ? 1 : 2}&old_room_type=${selectedCheckIn.room.room_type.id}&new_room_type=${selectedNewRoomType.id}&new_room_id=${selectedNewRoom.id}&old_rate=${selectedCheckIn.room_rate}&new_rate=${selectedNewRoomType.base_price}&rate_diff=${priceDiff.perNight}&nights=${getRemainingNights(selectedCheckIn)}&total_diff=${priceDiff.total}&upgrade_reason=${reasonType}&is_free=${reasonType === 2 || reasonType === 3 || reasonType === 4 ? 1 : 0}&notes=${encodeURIComponent(reason)}`);
    },
    onSuccess: () => {
      message.success('房间变更成功');
      setShowModal(false);
      setSelectedCheckIn(null);
      setSelectedNewRoomType(null);
      setSelectedNewRoom(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || '变更失败');
    },
  });

  const priceDiff = calculatePriceDiff();

  const columns = [
    {
      title: '入住编号',
      dataIndex: 'check_in_no',
      key: 'check_in_no',
    },
    {
      title: '客人',
      dataIndex: ['guest', 'name'],
      key: 'guest_name',
    },
    {
      title: '当前房间',
      key: 'current_room',
      render: (_: any, record: CheckInData) => (
        <span>
          {record.room?.number} - {record.room?.room_type?.name}
        </span>
      ),
    },
    {
      title: '当前房价',
      dataIndex: 'room_rate',
      key: 'room_rate',
      render: (val: number) => `¥${val}`,
    },
    {
      title: '入住日期',
      dataIndex: 'actual_check_in_time',
      key: 'check_in_date',
      render: (val: string) => val ? dayjs(val).format('MM-DD') : '-',
    },
    {
      title: '预计退房',
      dataIndex: 'check_out_time',
      key: 'check_out_date',
      render: (val: string) => dayjs(val).format('MM-DD'),
    },
    {
      title: '剩余晚数',
      key: 'remaining_nights',
      render: (_: any, record: CheckInData) => getRemainingNights(record),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: CheckInData) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            size="small"
            icon={<ArrowUp size={14} />}
            onClick={() => {
              setSelectedCheckIn(record);
              setUpgradeType('upgrade');
              setShowModal(true);
            }}
          >
            升级
          </Button>
          <Button
            size="small"
            icon={<ArrowDown size={14} />}
            onClick={() => {
              setSelectedCheckIn(record);
              setUpgradeType('downgrade');
              setShowModal(true);
            }}
          >
            降级
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🏨 升级/降级处理</h1>

      <Card>
        <Table
          dataSource={checkInList}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Upgrade/Downgrade Modal */}
      <Modal
        title={upgradeType === 'upgrade' ? '房间升级' : '房间降级'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setSelectedCheckIn(null);
          setSelectedNewRoomType(null);
          setSelectedNewRoom(null);
          setReason('');
        }}
        width={800}
        footer={null}
      >
        {selectedCheckIn && (
          <div className="space-y-4">
            {/* Current Check-in Info */}
            <Card size="small" className="bg-blue-50">
              <Row gutter={16}>
                <Col span={8}>
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>客人: {selectedCheckIn.guest?.name}</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="flex items-center gap-2">
                    <Home size={16} />
                    <span>当前: {selectedCheckIn.room?.number}</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} />
                    <span>¥{selectedCheckIn.room_rate}/晚</span>
                  </div>
                </Col>
              </Row>
              <Row gutter={16} className="mt-2">
                <Col span={12}>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>入住: {dayjs(selectedCheckIn.actual_check_in_time).format('MM-DD')}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="flex items-center gap-2">
                    <span>剩余: {getRemainingNights(selectedCheckIn)}晚</span>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Change Type */}
            <div>
              <label className="font-medium mb-2 block">变更类型</label>
              <Radio.Group
                value={upgradeType}
                onChange={(e) => setUpgradeType(e.target.value)}
              >
                <Radio.Button value="upgrade">升级房型</Radio.Button>
                <Radio.Button value="downgrade">降级房型</Radio.Button>
              </Radio.Group>
            </div>

            {/* Room Type Selection */}
            <div>
              <label className="font-medium mb-2 block">
                {upgradeType === 'upgrade' ? '选择升级房型' : '选择降级房型'}
              </label>
              <Row gutter={12}>
                {roomTypes
                  ?.filter((rt: RoomType) => {
                    if (upgradeType === 'upgrade') {
                      return rt.base_price > selectedCheckIn.room_rate;
                    } else {
                      return rt.base_price < selectedCheckIn.room_rate;
                    }
                  })
                  .map((rt: RoomType) => (
                    <Col span={8} key={rt.id}>
                      <Card
                        hoverable
                        onClick={() => {
                          setSelectedNewRoomType(rt);
                          setSelectedNewRoom(null);
                        }}
                        style={{
                          border: selectedNewRoomType?.id === rt.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                        }}
                        size="small"
                      >
                        <div className="text-center">
                          <div className="font-medium">{rt.name}</div>
                          <div className="text-primary-600">¥{rt.base_price}/晚</div>
                          <div className="text-sm text-gray-500">
                            {upgradeType === 'upgrade' ? (
                              <span className="text-green-600">升+¥{rt.base_price - selectedCheckIn.room_rate}</span>
                            ) : (
                              <span className="text-red-600">降-¥{selectedCheckIn.room_rate - rt.base_price}</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
              </Row>
            </div>

            {/* Room Number Selection */}
            {selectedNewRoomType && (
              <div>
                <label className="font-medium mb-2 block">选择新房号</label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="选择房间号"
                  value={selectedNewRoom?.id}
                  onChange={(value) => {
                    const room = availableRooms.find((r: any) => r.id === value);
                    setSelectedNewRoom(room);
                  }}
                >
                  {availableRooms.map((room: any) => (
                    <Option key={room.id} value={room.id}>
                      {room.number} - {room.room_type?.name}
                    </Option>
                  ))}
                </Select>
                {availableRooms?.length === 0 && (
                  <div className="text-yellow-600 mt-2">暂无该房型可用的房间</div>
                )}
              </div>
            )}

            {/* Price Calculation */}
            {selectedNewRoomType && selectedNewRoom && (
              <Card size="small" className="bg-gray-50">
                <div>
                  <label className="font-medium mb-2 block">费用计算</label>
                  <Radio.Group
                    value={reasonType}
                    onChange={(e) => setReasonType(e.target.value)}
                    className="mb-3"
                  >
                    <Radio.Button value={1}>付费升级</Radio.Button>
                    <Radio.Button value={2}>会员权益</Radio.Button>
                    <Radio.Button value={3}>投诉补偿</Radio.Button>
                    <Radio.Button value={4}>超售安排</Radio.Button>
                  </Radio.Group>

                  <div className="space-y-2">
                    <div>
                      房价差额: ¥{priceDiff.perNight}/晚 × {getRemainingNights(selectedCheckIn)}晚 = 
                      <span className="font-bold ml-2">¥{priceDiff.total}</span>
                    </div>
                    <div className="text-lg font-bold">
                      应收金额: 
                      <span className={priceDiff.total > 0 ? 'text-red-600' : 'text-green-600'} style={{ marginLeft: 8 }}>
                        ¥{priceDiff.total}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Reason */}
            {(reasonType === 2 || reasonType === 3) && (
              <div>
                <label className="font-medium mb-2 block">升级原因</label>
                <TextArea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请输入升级原因..."
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={() => setShowModal(false)}>取消</Button>
              <Button
                type="primary"
                icon={<CheckCircle size={16} />}
                disabled={!selectedNewRoomType || !selectedNewRoom}
                onClick={() => upgradeMutation.mutate()}
                loading={upgradeMutation.isPending}
              >
                确认变更
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UpgradePage;
