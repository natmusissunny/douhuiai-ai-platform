/**
 * 配额预警组件
 * 在余额不足时显示警告提示
 */

import React from 'react';
import { Alert, Button } from 'antd';
import { useAuthStore } from '../stores/authStore';

interface QuotaAlertProps {
  /** 显示位置 (dashboard/create/profile) */
  placement?: 'dashboard' | 'create' | 'profile';
  /** 是否显示充值按钮 */
  showRechargeButton?: boolean;
  /** 样式类名 */
  className?: string;
}

export const QuotaAlert: React.FC<QuotaAlertProps> = ({
  showRechargeButton = true,
  className = '',
}) => {
  const { user } = useAuthStore();

  const quotaBalance = user?.quota_balance || 0;

  // 配额充足,不显示警告
  if (quotaBalance >= 2.0) {
    return null;
  }

  // 余额为0,显示严重警告
  if (quotaBalance === 0) {
    return (
      <Alert
        type="error"
        showIcon
        message="配额已用完"
        description={
          <div>
            <p>您的配额余额为 <strong>0点</strong>,无法创建新的AI任务。</p>
            {showRechargeButton && (
              <Button
                type="primary"
                danger
                onClick={() => {
                  // TODO: 跳转到充值页面(待实现)
                  alert('充值功能开发中,请联系管理员充值');
                }}
              >
                立即充值
              </Button>
            )}
          </div>
        }
        className={className}
        style={{ marginBottom: 16 }}
      />
    );
  }

  // 余额 < 0.5,显示严重警告
  if (quotaBalance < 0.5) {
    return (
      <Alert
        type="error"
        showIcon
        message="配额余额严重不足"
        description={
          <div>
            <p>
              您的配额余额仅剩 <strong className="text-red-600">{quotaBalance.toFixed(2)}点</strong>,
              可能无法完成AI生成任务,请尽快充值。
            </p>
            {showRechargeButton && (
              <Button
                type="primary"
                danger
                size="small"
                onClick={() => {
                  alert('充值功能开发中,请联系管理员充值');
                }}
              >
                立即充值
              </Button>
            )}
          </div>
        }
        className={className}
        style={{ marginBottom: 16 }}
      />
    );
  }

  // 余额 < 2.0,显示警告
  return (
    <Alert
      type="warning"
      showIcon
      message="配额余额不足"
      description={
        <div>
          <p>
            您的配额余额为 <strong className="text-orange-600">{quotaBalance.toFixed(2)}点</strong>,
            建议及时充值以免影响使用。
          </p>
          {showRechargeButton && (
            <Button
              type="primary"
              size="small"
              style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
              onClick={() => {
                alert('充值功能开发中,请联系管理员充值');
              }}
            >
              前往充值
            </Button>
          )}
        </div>
      }
      className={className}
      style={{ marginBottom: 16 }}
    />
  );
};

/**
 * 创建任务时的配额检查组件
 */
interface QuotaCheckProps {
  /** 需要的配额 */
  requiredQuota: number;
  /** 操作名称 */
  actionName?: string;
}

export const QuotaCheck: React.FC<QuotaCheckProps> = ({
  requiredQuota,
  actionName = '此操作',
}) => {
  const { user } = useAuthStore();
  const quotaBalance = user?.quota_balance || 0;

  const isInsufficient = quotaBalance < requiredQuota;

  return (
    <div className="quota-check">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">所需配额:</span>
        <span className="font-semibold">{requiredQuota.toFixed(2)} 点</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">当前余额:</span>
        <span className={`font-semibold ${isInsufficient ? 'text-red-600' : 'text-green-600'}`}>
          {quotaBalance.toFixed(2)} 点
        </span>
      </div>
      {isInsufficient && (
        <Alert
          type="error"
          message="配额不足"
          description={`${actionName}需要 ${requiredQuota.toFixed(2)} 点配额,但您的余额只有 ${quotaBalance.toFixed(2)} 点。`}
          showIcon
          className="mt-2"
        />
      )}
    </div>
  );
};
