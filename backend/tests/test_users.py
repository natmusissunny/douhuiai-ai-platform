"""
用户相关测试
"""

import pytest


def test_get_profile(client, user_token):
    """测试获取用户信息"""
    response = client.get(
        "/api/v1/users/profile", headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


def test_get_profile_unauthorized(client):
    """测试未登录获取用户信息"""
    response = client.get("/api/v1/users/profile")
    assert response.status_code == 403  # 没有Authorization头


def test_update_profile(client, user_token):
    """测试更新用户信息"""
    response = client.put(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"email": "newemail@example.com", "phone": "1234567890"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newemail@example.com"
    assert data["phone"] == "1234567890"


def test_get_quota(client, user_token):
    """测试获取配额信息"""
    response = client.get(
        "/api/v1/users/quota", headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "balance" in data
    assert "total_recharged" in data
    assert "total_used" in data


def test_get_quota_history(client, user_token):
    """测试获取配额历史"""
    response = client.get(
        "/api/v1/users/quota/history",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
