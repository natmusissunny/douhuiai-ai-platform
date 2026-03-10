/**
 * 工作台页面
 */
import { Card, Row, Col, Statistic, Button } from 'antd';
import { PictureOutlined, ThunderboltOutlined, WalletOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { QuotaAlert } from '../components/QuotaAlert';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">工作台</h1>

      {/* 配额预警 */}
      <QuotaAlert placement="dashboard" showRechargeButton={true} />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="配额余额"
              value={user?.quota_balance || 0}
              prefix={<WalletOutlined />}
              suffix="点"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总项目数"
              value={0}
              prefix={<PictureOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="本月使用"
              value={0}
              prefix={<ThunderboltOutlined />}
              suffix="点"
            />
          </Card>
        </Col>
      </Row>

      {/* 快速开始 */}
      <Card title="快速开始" className="mb-8">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Button
              type="primary"
              size="large"
              block
              onClick={() => navigate('/create/text2img')}
            >
              文生图
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button size="large" block onClick={() => navigate('/create/img2img')}>
              图生图
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button size="large" block disabled>
              图片编辑
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button size="large" block disabled>
              3D渲染
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 最近项目 */}
      <Card title="最近项目">
        <div className="text-center text-gray-500 py-8">
          暂无项目,开始创作您的第一个作品吧!
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
