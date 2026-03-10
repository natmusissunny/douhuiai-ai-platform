"""
认证相关测试
"""

import pytest
from fastapi.testclient import TestClient


def test_register_success(client):
    """测试用户注册成功"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "user_id" in data
    assert data["message"] == "User registered successfully"


def test_register_duplicate_username(client, test_user):
    """测试注册重复用户名"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",  # 已存在
            "email": "another@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_register_duplicate_email(client, test_user):
    """测试注册重复邮箱"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "anotheruser",
            "email": "test@example.com",  # 已存在
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login_success(client, test_user):
    """测试登录成功"""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "testuser", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    """测试登录密码错误"""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "testuser", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]


def test_login_nonexistent_user(client):
    """测试登录不存在的用户"""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "nonexistent", "password": "password123"},
    )
    assert response.status_code == 401


def test_refresh_token(client, test_user):
    """测试刷新令牌"""
    # 先登录
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "testuser", "password": "password123"},
    )
    refresh_token = login_response.json()["refresh_token"]

    # 刷新令牌
    response = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_change_password(client, user_token):
    """测试修改密码"""
    response = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"old_password": "password123", "new_password": "newpassword123"},
    )
    assert response.status_code == 200


def test_change_password_wrong_old(client, user_token):
    """测试修改密码 - 旧密码错误"""
    response = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"old_password": "wrongpassword", "new_password": "newpassword123"},
    )
    assert response.status_code == 400


def test_logout(client, user_token):
    """测试登出"""
    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
