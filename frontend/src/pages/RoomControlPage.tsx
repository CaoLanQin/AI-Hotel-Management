import { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Select, Button, Spin, message } from 'antd';
import { 
  Lamp, 
  Snowflake,
  Monitor,
  Wifi,
  Plug
} from 'lucide-react';
import api from '../lib/api';

const { Option } = Select;

const deviceIcons: Record<string, any> = {
  ac: <Snowflake size={28} style={{ color: '#fbbf24' }} />,
  light: <Lamp size={28} style={{ color: '#fbbf24' }} />,
  curtain: <Wifi size={28} style={{ color: '#fbbf24' }} />,
  tv: <Monitor size={28} style={{ color: '#fbbf24' }} />,
};

const deviceNames: Record<string, string> = {
  ac: '空调',
  light: '灯光',
  curtain: '窗帘',
  tv: '电视',
};

const RoomControlPage = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [scenesList, setScenesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 使用对象存储每个设备的实时值
  const [sliderValues, setSliderValues] = useState<Record<number, number>>({});

  useEffect(() => {
    api.get('/rooms').then(res => {
      setRooms(res.data || []);
      if (res.data?.length > 0) {
        setSelectedRoom(res.data[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    api.get('/devices/scenes').then(res => {
      setScenesList(res.data || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;
    setLoading(true);
    api.get(`/devices/room/${selectedRoom}`)
      .then(res => {
        const devObj = res.data?.devices || {};
        const deviceList = [
          ...(devObj.light || []),
          ...(devObj.curtain || []),
          ...(devObj.tv || []),
          ...(devObj.ac || []),
        ];
        setDevices(deviceList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedRoom]);

  const handleControl = async (device: any, action: string, value?: any) => {
    try {
      await api.post('/devices/control', {
        device_id: device.id,
        action,
        value,
      });
      message.success(`${deviceNames[device.type] || device.name || '设备'}已控制`);
      refreshDevices();
    } catch (err: any) {
      message.error(err.response?.data?.detail || '控制失败');
    }
  };

  const refreshDevices = async () => {
    if (!selectedRoom) return;
    const res = await api.get(`/devices/room/${selectedRoom}`);
    const devObj = res.data?.devices || {};
    setDevices([
      ...(devObj.light || []),
      ...(devObj.curtain || []),
      ...(devObj.tv || []),
      ...(devObj.ac || []),
    ]);
  };

  const handleScene = async (sceneId: number) => {
    if (!selectedRoom) {
      message.warning('请先选择房间');
      return;
    }
    try {
      await api.post(`/devices/scene/${sceneId}/execute?room_id=${selectedRoom}`);
      message.success('场景执行成功');
      refreshDevices();
    } catch (err: any) {
      message.error(err.response?.data?.detail || '场景执行失败');
    }
  };

  // 自定义滑块
  const CustomSlider = ({ deviceId, min, max, value, onChangeComplete, color }: any) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    
    // 使用全局状态存储实时值
    const currentValue = sliderValues[deviceId] ?? value;
    const percent = ((currentValue - min) / (max - min)) * 100;

    const updateValue = (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newValue = Math.round(min + percent * (max - min));
      setSliderValues(prev => ({ ...prev, [deviceId]: newValue }));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      updateValue(e.clientX);
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        updateValue(moveEvent.clientX);
      };
      
      const handleMouseUp = () => {
        onChangeComplete(sliderValues[deviceId] ?? value);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    return (
      <div 
        ref={sliderRef}
        style={{ 
          width: '100%', 
          height: '8px', 
          background: 'rgba(255,255,255,0.3)', 
          borderRadius: '4px', 
          position: 'relative',
          cursor: 'pointer',
          marginTop: '8px'
        }}
        onMouseDown={handleMouseDown}
      >
        <div 
          style={{ 
            width: `${percent}%`, 
            height: '100%', 
            background: color, 
            borderRadius: '4px'
          }} 
        />
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: `${percent}%`,
            transform: 'translate(-50%, -50%)',
            width: '18px',
            height: '18px',
            background: '#fff',
            borderRadius: '50%',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            cursor: 'grab',
            zIndex: 10
          }}
        />
      </div>
    );
  };

  // 渲染设备卡片
  const renderDeviceCard = (device: any) => {
    const isOn = device.state?.power === 'on';
    const deviceType = device.type;
    
    // 优先使用滑块的实时值
    const displayValue = sliderValues[device.id] ?? device.state?.[deviceType === 'light' ? 'brightness' : 'temperature'] 
      ?? (deviceType === 'light' ? 50 : 26);
    
    return (
      <Card 
        className="text-center"
        style={{ 
          background: isOn ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
          color: isOn ? '#fff' : '#333',
          borderRadius: '12px',
          height: '180px',
          position: 'relative'
        }}
      >
        <Button
          type="primary"
          shape="circle"
          size="small"
          onClick={() => handleControl(device, isOn ? 'off' : 'on')}
          style={{ 
            position: 'absolute',
            top: 8,
            right: 8,
            background: isOn ? '#4ade80' : '#999',
            border: 'none'
          }}
        >
          <Plug size={12} />
        </Button>

        <div className="mb-1 mt-2">{deviceIcons[deviceType] || <Plug size={28} />}</div>
        <div className="font-bold mb-1" style={{ fontSize: '14px' }}>
          {device.name || deviceNames[deviceType]}
        </div>
        <div className="text-sm mb-2" style={{ opacity: isOn ? 0.9 : 0.5 }}>
          {isOn ? '工作中' : '已关闭'}
          {isOn && deviceType === 'light' && ` · ${displayValue}%`}
          {isOn && deviceType === 'ac' && ` · ${displayValue}°C`}
        </div>
        
        <div style={{ height: '50px', padding: '0 8px' }}>
          {isOn && deviceType === 'light' && (
            <CustomSlider
              deviceId={device.id}
              min={0}
              max={100}
              value={device.state?.brightness || 50}
              onChangeComplete={(val: number) => handleControl(device, 'brightness', val)}
              color="#fbbf24"
            />
          )}
          {isOn && deviceType === 'ac' && (
            <CustomSlider
              deviceId={device.id}
              min={18}
              max={30}
              value={device.state?.temperature || 26}
              onChangeComplete={(val: number) => handleControl(device, 'temperature', val)}
              color="#4ade80"
            />
          )}
          {!isOn && <div style={{ height: '24px' }}></div>}
        </div>
      </Card>
    );
  };

  const acDevice = devices.find(d => d.type === 'ac');
  const lightDevice = devices.find(d => d.type === 'light');
  const curtainDevice = devices.find(d => d.type === 'curtain');
  const tvDevice = devices.find(d => d.type === 'tv');

  return (
    <div className="p-6" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#fff' }}>客房智控</h1>
      
      <Row gutter={16}>
        <Col span={24} className="mb-4">
          <Card>
            <Select
              style={{ width: 200 }}
              value={selectedRoom}
              onChange={setSelectedRoom}
              placeholder="选择房间"
            >
              {rooms.map(room => (
                <Option key={room.id} value={room.id}>
                  {room.number} - {room.room_type?.name || '标准间'}
                </Option>
              ))}
            </Select>
          </Card>
        </Col>

        <Col span={24} className="mb-4">
          <Card title="场景模式" style={{ background: 'rgba(255,255,255,0.9)' }}>
            <Row gutter={16}>
              {(scenesList.length > 0 ? scenesList : [
                { id: 1, name: '欢迎模式', icon: '👋' },
                { id: 2, name: '阅读模式', icon: '📖' },
                { id: 3, name: '睡眠模式', icon: '😴' },
                { id: 4, name: '离家模式', icon: '🏠' },
              ]).map((scene: any) => (
                <Col key={scene.id} span={6}>
                  <Card 
                    hoverable 
                    onClick={() => handleScene(scene.id)}
                    style={{ background: '#fff', border: '1px solid #ddd' }}
                    className="text-center"
                  >
                    <div className="text-2xl mb-2">{scene.icon || '🎬'}</div>
                    <div>{scene.name}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card style={{ background: 'rgba(255,255,255,0.9)' }}>
            {loading ? (
              <div className="text-center p-8"><Spin /></div>
            ) : (
              <Row gutter={16}>
                {lightDevice && (
                  <Col span={12} className="mb-4">
                    {renderDeviceCard(lightDevice)}
                  </Col>
                )}
                {acDevice && (
                  <Col span={12} className="mb-4">
                    {renderDeviceCard(acDevice)}
                  </Col>
                )}
                {tvDevice && (
                  <Col span={12} className="mb-4">
                    {renderDeviceCard(tvDevice)}
                  </Col>
                )}
                {curtainDevice && (
                  <Col span={12} className="mb-4">
                    {renderDeviceCard(curtainDevice)}
                  </Col>
                )}
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RoomControlPage;
