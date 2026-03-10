"""
项目相关测试
"""

import pytest


def test_create_text2img(client, user_token):
    """测试创建文生图任务"""
    response = client.post(
        "/api/v1/projects/text2img",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "prompt": "a cute cat",
            "width": 512,
            "height": 512,
            "num_images": 1,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "text2img"
    assert data["status"] == "pending"
    assert data["quota_cost"] == 1.0


def test_create_text2img_insufficient_quota(client, user_token):
    """测试配额不足创建任务"""
    # 创建需要大量配额的任务
    response = client.post(
        "/api/v1/projects/text2img",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "prompt": "a cute cat",
            "width": 2048,
            "height": 2048,
            "num_images": 4,  # 需要 1.0 * 2.0 * 4 = 8.0 点 (用户只有10点)
        },
    )
    # 第一次应该成功
    assert response.status_code == 201

    # 再次创建相同任务,配额应该不足
    response = client.post(
        "/api/v1/projects/text2img",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "prompt": "another image",
            "width": 2048,
            "height": 2048,
            "num_images": 4,
        },
    )
    assert response.status_code == 402  # Payment Required


def test_list_projects(client, user_token):
    """测试获取项目列表"""
    # 先创建一个项目
    client.post(
        "/api/v1/projects/text2img",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"prompt": "test", "width": 512, "height": 512},
    )

    # 获取列表
    response = client.get(
        "/api/v1/projects/", headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 1


def test_list_projects_with_filter(client, user_token):
    """测试过滤项目列表"""
    # 创建文生图项目
    client.post(
        "/api/v1/projects/text2img",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"prompt": "test", "width": 512, "height": 512},
    )

    # 过滤文生图项目
    response = client.get(
        "/api/v1/projects/?type=text2img",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert all(item["type"] == "text2img" for item in data["items"])


def test_get_project_detail(client, user_token):
    """测试获取项目详情"""
    # 创建项目
    create_response = client.post(
        "/api/v1/projects/text2img",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"prompt": "test", "width": 512, "height": 512},
    )
    project_id = create_response.json()["id"]

    # 获取详情
    response = client.get(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == project_id


def test_delete_project(client, user_token):
    """测试删除项目"""
    # 创建项目
    create_response = client.post(
        "/api/v1/projects/text2img",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"prompt": "test", "width": 512, "height": 512},
    )
    project_id = create_response.json()["id"]

    # 删除项目
    response = client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200

    # 验证已删除
    response = client.get(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 404


def test_create_img2img(client, user_token):
    """测试创建图生图任务"""
    response = client.post(
        "/api/v1/projects/img2img",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "image_url": "https://example.com/image.jpg",
            "prompt": "make it beautiful",
            "strength": 0.8,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "img2img"
    assert data["quota_cost"] == 1.5
