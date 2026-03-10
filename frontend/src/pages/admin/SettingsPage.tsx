/**
 * 管理后台 - 系统设置页面
 */

import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  InputNumber,
  Space,
  Typography,
  Divider,
  message,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Mock初始值 - 实际应该从API获取
  const initialValues = {
    site_name: '豆绘AI平台',
    site_description: '专业的AI创作平台',
    allow_registration: true,
    require_email_verification: true,
    default_quota: 100,
    quota_per_yuan: 10,
    text2img_base_cost: 5,
    img2img_base_cost: 8,
    edit_base_cost: 10,
    '3d_base_cost': 15,
    max_concurrent_projects: 5,
  };

  const handleSave = async (_values: any) => {
    setLoading(true);
    try {
      // Mock保存 - 实际应该调用API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success('设置保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>系统设置</Title>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSave}
      >
        {/* 基本设置 */}
        <Card title="基本设置" className="mb-6">
          <Form.Item
            label="网站名称"
            name="site_name"
            rules={[{ required: true, message: '请输入网站名称' }]}
          >
            <Input placeholder="请输入网站名称" maxLength={50} />
          </Form.Item>

          <Form.Item
            label="网站描述"
            name="site_description"
            rules={[{ required: true, message: '请输入网站描述' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入网站描述"
              maxLength={200}
            />
          </Form.Item>
        </Card>

        {/* 用户设置 */}
        <Card title="用户设置" className="mb-6">
          <Form.Item
            label="允许用户注册"
            name="allow_registration"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="需要邮箱验证"
            name="require_email_verification"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="新用户默认配额"
            name="default_quota"
            rules={[
              { required: true, message: '请输入默认配额' },
              {
                type: 'number',
                min: 0,
                max: 10000,
                message: '配额必须在 0-10000 之间',
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入默认配额"
              precision={2}
            />
          </Form.Item>

          <Form.Item
            label="用户最大并发项目数"
            name="max_concurrent_projects"
            rules={[
              { required: true, message: '请输入最大并发数' },
              { type: 'number', min: 1, max: 50, message: '必须在 1-50 之间' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入最大并发项目数"
            />
          </Form.Item>
        </Card>

        {/* 配额设置 */}
        <Card title="配额设置" className="mb-6">
          <Form.Item
            label="充值比例 (配额/元)"
            name="quota_per_yuan"
            rules={[
              { required: true, message: '请输入充值比例' },
              {
                type: 'number',
                min: 1,
                max: 1000,
                message: '比例必须在 1-1000 之间',
              },
            ]}
            help="1元可以充值多少配额"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入充值比例"
              precision={2}
            />
          </Form.Item>

          <Divider />

          <Text strong>项目基础配额消耗</Text>
          <div className="mt-4 space-y-4">
            <Form.Item
              label="文生图基础配额"
              name="text2img_base_cost"
              rules={[
                { required: true, message: '请输入配额' },
                { type: 'number', min: 0.1, message: '配额必须大于 0.1' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入配额"
                precision={2}
              />
            </Form.Item>

            <Form.Item
              label="图生图基础配额"
              name="img2img_base_cost"
              rules={[
                { required: true, message: '请输入配额' },
                { type: 'number', min: 0.1, message: '配额必须大于 0.1' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入配额"
                precision={2}
              />
            </Form.Item>

            <Form.Item
              label="图像编辑基础配额"
              name="edit_base_cost"
              rules={[
                { required: true, message: '请输入配额' },
                { type: 'number', min: 0.1, message: '配额必须大于 0.1' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入配额"
                precision={2}
              />
            </Form.Item>

            <Form.Item
              label="3D渲染基础配额"
              name="3d_base_cost"
              rules={[
                { required: true, message: '请输入配额' },
                { type: 'number', min: 0.1, message: '配额必须大于 0.1' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入配额"
                precision={2}
              />
            </Form.Item>
          </div>
        </Card>

        {/* 提交按钮 */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              保存设置
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};
