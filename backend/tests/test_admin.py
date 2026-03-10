"""
管理后台测试
"""

import pytest


def test_list_users_admin(client, admin_token, test_user):
    """测试管理员获取用户列表"""
    response = client.get(
        "/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data


def test_list_users_no_permission(client, user_token):
    """测试普通用户无权访问用户列表"""
    response = client.get(
        "/api/v1/admin/users", headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403


def test_get_user_detail_admin(client, admin_token, test_user):
    """测试管理员获取用户详情"""
    response = client.get(
        f"/api/v1/admin/users/{test_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert "project_count" in data
    assert "total_quota_used" in data


def test_update_user_status(client, admin_token, test_user):
    """测试更新用户状态"""
    response = client.put(
        f"/api/v1/admin/users/{test_user.id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "disabled"},
    )
    assert response.status_code == 200


def test_update_user_quota(client, admin_token, test_user):
    """测试充值用户配额"""
    response = client.post(
        f"/api/v1/admin/users/{test_user.id}/quota",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"amount": 50.0, "description": "测试充值"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "new_balance" in data
    assert data["new_balance"] == 60.0  # 原来10 + 50


def test_list_roles(client, admin_token):
    """测试获取角色列表"""
    response = client.get(
        "/api/v1/admin/roles", headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_role(client, admin_token):
    """测试创建角色"""
    response = client.post(
        "/api/v1/admin/roles",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "vip",
            "description": "VIP用户",
            "permissions": ["project.create", "project.view"],
        },
    )
    assert response.status_code == 201


def test_update_role(client, admin_token, test_role):
    """测试更新角色"""
    response = client.put(
        f"/api/v1/admin/roles/{test_role.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"description": "更新后的描述"},
    )
    assert response.status_code == 200


def test_delete_role_with_users(client, admin_token, test_role):
    """测试删除有用户的角色"""
    response = client.delete(
        f"/api/v1/admin/roles/{test_role.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400  # 有用户,不能删除


def test_get_system_stats(client, admin_token):
    """测试获取系统统计"""
    response = client.get(
        "/api/v1/admin/statistics/system",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_projects" in data


def test_get_project_stats(client, admin_token):
    """测试获取项目统计"""
    response = client.get(
        "/api/v1/admin/statistics/projects",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "by_type" in data
    assert "by_status" in data
    assert "success_rate" in data


def test_get_quota_stats(client, admin_token):
    """测试获取配额统计"""
    response = client.get(
        "/api/v1/admin/statistics/quota",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_recharged" in data
    assert "total_consumed" in data
