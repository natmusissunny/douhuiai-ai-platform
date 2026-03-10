"""
Pytest 配置文件
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.role import Role
from app.utils.security import get_password_hash


# 使用内存数据库进行测试
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """创建测试数据库会话"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """创建测试客户端"""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_role(db):
    """创建测试角色"""
    role = Role(
        name="test_user",
        display_name="测试用户",
        description="测试用户角色",
        permissions=["project.create", "project.view", "user.view"],
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture(scope="function")
def admin_role(db):
    """创建管理员角色"""
    role = Role(
        name="admin",
        display_name="管理员",
        description="管理员",
        permissions=["*"],  # 所有权限
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture(scope="function")
def test_user(db, test_role):
    """创建测试用户"""
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash=get_password_hash("password123"),
        role_id=test_role.id,
        quota_balance=10.0,
        status="active",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_user(db, admin_role):
    """创建管理员用户"""
    user = User(
        username="admin",
        email="admin@example.com",
        password_hash=get_password_hash("admin123"),
        role_id=admin_role.id,
        quota_balance=100.0,
        status="active",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def user_token(client, test_user):
    """获取测试用户的访问令牌"""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "testuser", "password": "password123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture(scope="function")
def admin_token(client, admin_user):
    """获取管理员的访问令牌"""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]
