"""
Tests for Forum API views
Covers FR-84 through FR-94 from SRS Feature 1.18 (Community Forum)
"""
import pytest
from rest_framework import status

from tests.factories import (
    UserFactory, AdminUserFactory, ForumPostFactory, ForumCommentFactory,
    UserProfileFactory
)
from rest_api.auth.views import password_hash
from rest_api.auth.serializers import get_tokens_for_user


class TestForumPostList:
    """Tests for listing forum posts (FR-84)"""
    
    def test_list_posts_public(self, api_client):
        """FR-84: Anyone can view all forum topics"""
        # Create some posts
        ForumPostFactory(title="Test Post 1")
        ForumPostFactory(title="Test Post 2")
        
        response = api_client.get('/api/forum/posts')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
    
    def test_list_posts_empty(self, api_client):
        """FR-84: Return empty list if no posts"""
        response = api_client.get('/api/forum/posts')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0
    
    def test_filter_by_category(self, api_client):
        """FR-89: Filter forum topics by category"""
        ForumPostFactory(category='general')
        ForumPostFactory(category='help')
        ForumPostFactory(category='general')
        
        response = api_client.get('/api/forum/posts?category=general')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        for post in response.data:
            assert post['category'] == 'general'
    
    def test_post_displays_author_info(self, api_client):
        """FR-90: Forum posts display author name, avatar, and creation timestamp"""
        user = UserFactory(first_name='John', last_name='Doe')
        UserProfileFactory(user=user)
        ForumPostFactory(user=user, title="Test Post")
        
        response = api_client.get('/api/forum/posts')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        post = response.data[0]
        assert 'user' in post
        assert post['user']['first_name'] == 'John'
        assert post['user']['last_name'] == 'Doe'
        assert 'created_at' in post


class TestForumPostCreate:
    """Tests for creating forum posts (FR-85)"""
    
    def test_create_post_verified_user(self, api_client):
        """FR-85: Verified users can create forum topics"""
        user = UserFactory(is_verified=True, password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post('/api/forum/posts', {
            'title': 'My New Post',
            'content': 'This is the content of my post',
            'category': 'general'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'My New Post'
        assert response.data['content'] == 'This is the content of my post'
        assert response.data['category'] == 'general'
    
    def test_create_post_unverified_fails(self, api_client):
        """FR-85: Unverified users cannot create forum topics"""
        user = UserFactory(is_verified=False, password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post('/api/forum/posts', {
            'title': 'My New Post',
            'content': 'This is the content of my post',
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['code'] == 'NOT_VERIFIED'
    
    def test_create_post_unauthenticated_fails(self, api_client):
        """Anonymous users cannot create forum topics"""
        response = api_client.post('/api/forum/posts', {
            'title': 'My New Post',
            'content': 'This is the content of my post',
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_post_empty_title_fails(self, api_client):
        """Validation: Title is required"""
        user = UserFactory(is_verified=True, password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post('/api/forum/posts', {
            'title': '',
            'content': 'This is the content',
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_post_empty_content_fails(self, api_client):
        """Validation: Content is required"""
        user = UserFactory(is_verified=True, password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post('/api/forum/posts', {
            'title': 'Test Title',
            'content': '',
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_banned_user_cannot_post(self, api_client):
        """Security: Banned users cannot create forum posts"""
        user = UserFactory(is_verified=True, is_banned=True, password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post('/api/forum/posts', {
            'title': 'My New Post',
            'content': 'This is the content of my post',
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['code'] == 'USER_BANNED'


class TestForumPostDetail:
    """Tests for getting forum post details"""
    
    def test_get_post_with_comments(self, api_client):
        """FR-84: Get single post with comments"""
        post = ForumPostFactory()
        ForumCommentFactory(post=post, content="Comment 1")
        ForumCommentFactory(post=post, content="Comment 2")
        
        response = api_client.get(f'/api/forum/posts/{post.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == post.id
        assert response.data['title'] == post.title
        assert len(response.data['comments']) == 2
    
    def test_get_nonexistent_post(self, api_client):
        """Get nonexistent post returns 404"""
        response = api_client.get('/api/forum/posts/99999')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestForumPostDelete:
    """Tests for deleting forum posts (FR-91, FR-94)"""
    
    def test_delete_own_post(self, api_client):
        """FR-91: Users can delete their own forum posts"""
        user = UserFactory(password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        post = ForumPostFactory(user=user)
        
        response = api_client.delete(f'/api/forum/posts/{post.id}')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_delete_others_post_fails(self, api_client):
        """FR-91: Users cannot delete other users' forum posts"""
        user = UserFactory(password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        other_user = UserFactory()
        post = ForumPostFactory(user=other_user)
        
        response = api_client.delete(f'/api/forum/posts/{post.id}')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_can_delete_any_post(self, api_client):
        """FR-94: Admin can delete inappropriate forum posts"""
        admin = AdminUserFactory(password=password_hash('adminpass123'))
        tokens = get_tokens_for_user(admin)
        api_client.cookies['access_token'] = tokens['access']
        
        other_user = UserFactory()
        post = ForumPostFactory(user=other_user)
        
        response = api_client.delete(f'/api/forum/posts/{post.id}')
        
        assert response.status_code == status.HTTP_200_OK


class TestForumCommentCreate:
    """Tests for creating forum comments (FR-86)"""
    
    def test_add_comment_verified_user(self, api_client):
        """FR-86: Verified users can reply to forum topics"""
        user = UserFactory(is_verified=True, password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        post = ForumPostFactory()
        
        response = api_client.post(f'/api/forum/posts/{post.id}/comments', {
            'content': 'This is my comment'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['content'] == 'This is my comment'
    
    def test_add_comment_unverified_fails(self, api_client):
        """FR-86: Unverified users cannot reply to forum topics"""
        user = UserFactory(is_verified=False, password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        post = ForumPostFactory()
        
        response = api_client.post(f'/api/forum/posts/{post.id}/comments', {
            'content': 'This is my comment'
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['code'] == 'NOT_VERIFIED'
    
    def test_add_comment_empty_content_fails(self, api_client):
        """Validation: Comment content is required"""
        user = UserFactory(is_verified=True, password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        post = ForumPostFactory()
        
        response = api_client.post(f'/api/forum/posts/{post.id}/comments', {
            'content': ''
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_add_comment_nonexistent_post(self, api_client):
        """Cannot add comment to nonexistent post"""
        user = UserFactory(is_verified=True, password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post('/api/forum/posts/99999/comments', {
            'content': 'This is my comment'
        })
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_banned_user_cannot_comment(self, api_client):
        """Security: Banned users cannot comment on forum posts"""
        user = UserFactory(is_verified=True, is_banned=True, password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        post = ForumPostFactory()
        
        response = api_client.post(f'/api/forum/posts/{post.id}/comments', {
            'content': 'This is my comment'
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['code'] == 'USER_BANNED'


class TestForumCommentDelete:
    """Tests for deleting forum comments (FR-91, FR-94)"""
    
    def test_delete_own_comment(self, api_client):
        """FR-91: Users can delete their own forum comments"""
        user = UserFactory(password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        comment = ForumCommentFactory(user=user)
        
        response = api_client.delete(f'/api/forum/comments/{comment.id}')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_delete_others_comment_fails(self, api_client):
        """FR-91: Users cannot delete other users' comments"""
        user = UserFactory(password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        other_user = UserFactory()
        comment = ForumCommentFactory(user=other_user)
        
        response = api_client.delete(f'/api/forum/comments/{comment.id}')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_can_delete_any_comment(self, api_client):
        """FR-94: Admin can delete inappropriate forum comments"""
        admin = AdminUserFactory(password=password_hash('adminpass123'))
        tokens = get_tokens_for_user(admin)
        api_client.cookies['access_token'] = tokens['access']
        
        other_user = UserFactory()
        comment = ForumCommentFactory(user=other_user)
        
        response = api_client.delete(f'/api/forum/comments/{comment.id}')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_delete_nonexistent_comment(self, api_client):
        """Delete nonexistent comment returns 404"""
        user = UserFactory(password=password_hash('testpass123'))
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.delete('/api/forum/comments/99999')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

