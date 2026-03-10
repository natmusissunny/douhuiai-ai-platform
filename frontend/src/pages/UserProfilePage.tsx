/**
 * 用户个人中心页面
 */
import { Card, Descriptions, Tag, Row, Col, Statistic } from 'antd';
import { useAuthStore } from '../stores/authStore';

const UserProfilePage = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <div>加载中...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">个人中心</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="基本信息">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="用户名">
                {user.username}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item label="手机号">
                {user.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color="blue">{user.role.name}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={user.status === 'active' ? 'green' : 'red'}>
                  {user.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {new Date(user.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="配额信息" className="mb-4">
            <Statistic
              title="当前余额"
              value={user.quota_balance}
              suffix="点"
              precision={2}
            />
          </Card>

          <Card title="权限列表">
            <div className="flex flex-wrap gap-2">
              {user.role.permissions.map((permission, index) => (
                <Tag key={index} color="blue">
                  {permission}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfilePage;
