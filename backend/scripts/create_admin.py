#!/usr/bin/env python3
"""
创建管理员账号脚本
Usage: python scripts/create_admin.py
"""

import sys
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from getpass import getpass

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.user import User
from app.models.role import Role
from app.utils.security import get_password_hash
from app.database import Base


def create_admin_role(db):
    """创建或获取管理员角色"""
    admin_role = db.query(Role).filter(Role.name == "admin").first()

    if not admin_role:
        print("📝 创建管理员角色...")
        admin_role = Role(
            name="admin",
            display_name="超级管理员",
            description="拥有所有权限的超级管理员",
            permissions=["*"],  # 所有权限
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)
        print("✅ 管理员角色创建成功")
    else:
        print("✅ 管理员角色已存在")

    return admin_role


def create_admin_user(db, admin_role):
    """创建管理员用户"""
    print("\n" + "=" * 50)
    print("🔧 创建超级管理员账号")
    print("=" * 50)

    # 输入用户名
    while True:
        username = input("\n请输入管理员用户名 (默认: admin): ").strip() or "admin"

        # 检查用户名是否已存在
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"❌ 用户名 '{username}' 已存在，请使用其他用户名")
            continue

        if len(username) < 3:
            print("❌ 用户名至少3个字符")
            continue

        break

    # 输入邮箱
    while True:
        email = input("请输入管理员邮箱: ").strip()

        if not email:
            print("❌ 邮箱不能为空")
            continue

        # 检查邮箱是否已存在
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            print(f"❌ 邮箱 '{email}' 已被使用")
            continue

        if "@" not in email:
            print("❌ 请输入有效的邮箱地址")
            continue

        break

    # 输入密码
    while True:
        password = getpass("请输入管理员密码 (至少6位): ").strip()

        if len(password) < 6:
            print("❌ 密码至少6个字符")
            continue

        password_confirm = getpass("请再次输入密码: ").strip()

        if password != password_confirm:
            print("❌ 两次密码不一致，请重新输入")
            continue

        break

    # 创建管理员用户
    print("\n📝 创建管理员账号...")

    admin_user = User(
        username=username,
        email=email,
        password_hash=get_password_hash(password),
        role_id=admin_role.id,
        quota_balance=1000.00,  # 管理员赠送1000点配额
        status="active",
        is_verified=True,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    print("\n" + "=" * 50)
    print("✅ 管理员账号创建成功!")
    print("=" * 50)
    print(f"👤 用户名: {username}")
    print(f"📧 邮箱: {email}")
    print(f"🔑 密码: ******")
    print(f"💰 配额: 1000.00 点")
    print(f"🆔 用户ID: {admin_user.id}")
    print("=" * 50)

    return admin_user


def main():
    """主函数"""
    print("=" * 50)
    print("🚀 豆绘AI平台 - 管理员账号创建工具")
    print("=" * 50)

    # 连接数据库
    try:
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()

        print("✅ 数据库连接成功")

        # 确保表已创建
        Base.metadata.create_all(bind=engine)

        # 创建管理员角色
        admin_role = create_admin_role(db)

        # 创建管理员用户
        admin_user = create_admin_user(db, admin_role)

        print("\n🎉 完成! 现在可以使用管理员账号登录系统了")

    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        db.close()


if __name__ == "__main__":
    main()
