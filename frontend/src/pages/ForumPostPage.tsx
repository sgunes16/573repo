import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Textarea,
  Badge,
  useToast,
  Spinner,
  Icon,
  Flex,
  IconButton,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
} from '@chakra-ui/react'
import { MdArrowBack, MdDelete, MdSend, MdAccessTime, MdComment } from 'react-icons/md'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import UserAvatar from '@/components/UserAvatar'
import { ForumPost, ForumCategory, ForumComment } from '@/types'
import { apiService } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'

const CATEGORY_LABELS: Record<ForumCategory, string> = {
  general: 'General',
  help: 'Help',
  tips: 'Tips',
  feedback: 'Feedback',
}

const CATEGORY_COLORS: Record<ForumCategory, string> = {
  general: 'gray',
  help: 'blue',
  tips: 'green',
  feedback: 'purple',
}

const ForumPostPage = () => {
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'post' | 'comment'; id: string } | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    setLoading(true)
    try {
      const fetchedPost = await apiService.get<ForumPost>(`/forum/posts/${postId}`)
      setPost(fetchedPost)
    } catch (error) {
      toast({
        title: 'Error fetching post',
        status: 'error',
        duration: 3000,
      })
      navigate('/forum')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: 'Comment cannot be empty',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setSubmitting(true)
    try {
      const newCommentData = await apiService.post<ForumComment>(`/forum/posts/${postId}/comments`, {
        content: newComment,
      })
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: [...(prev.comments || []), newCommentData],
              comment_count: prev.comment_count + 1,
            }
          : null
      )
      setNewComment('')
      toast({
        title: 'Comment added',
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to add comment'
      toast({
        title: errorMsg,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    try {
      await apiService.delete(`/forum/posts/${postId}`)
      toast({
        title: 'Post deleted',
        status: 'success',
        duration: 3000,
      })
      navigate('/forum')
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to delete post'
      toast({
        title: errorMsg,
        status: 'error',
        duration: 3000,
      })
    }
    onClose()
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiService.delete(`/forum/comments/${commentId}`)
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments?.filter((c) => c.id !== commentId) || [],
              comment_count: prev.comment_count - 1,
            }
          : null
      )
      toast({
        title: 'Comment deleted',
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to delete comment'
      toast({
        title: errorMsg,
        status: 'error',
        duration: 3000,
      })
    }
    onClose()
  }

  const confirmDelete = () => {
    if (deleteTarget?.type === 'post') {
      handleDeletePost()
    } else if (deleteTarget?.type === 'comment') {
      handleDeleteComment(deleteTarget.id)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleUserClick = (userId: string | number) => {
    navigate(`/profile/${userId}`)
  }

  // Strict ID comparison - only owner or admin can delete
  const canDeletePost = post && user && (Number(user.id) === Number(post.user.id) || user.is_admin === true)
  const canComment = user?.is_verified && !user?.is_banned

  if (loading) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="lg" color="yellow.500" thickness="3px" />
        </Flex>
      </Box>
    )
  }

  if (!post) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Box textAlign="center" py={12}>
          <Text color="gray.500">Post not found</Text>
          <Button mt={4} size="sm" colorScheme="yellow" onClick={() => navigate('/forum')}>
            Back to Forum
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />

      <Box maxW="800px" mx="auto" px={4} py={6}>
        {/* Back Button */}
        <Button
          leftIcon={<Icon as={MdArrowBack} boxSize={4} />}
          variant="ghost"
          size="sm"
          mb={4}
          color="gray.600"
          fontWeight="normal"
          onClick={() => navigate('/forum')}
          _hover={{ bg: 'gray.50' }}
        >
          Back to Forum
        </Button>

        {/* Post */}
        <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" p={5} mb={6}>
          <Flex justify="space-between" align="start" mb={3}>
            <Badge 
              colorScheme={CATEGORY_COLORS[post.category]} 
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="full"
            >
              {CATEGORY_LABELS[post.category]}
            </Badge>
            {canDeletePost && (
              <IconButton
                aria-label="Delete post"
                icon={<Icon as={MdDelete} boxSize={4} />}
                variant="ghost"
                size="sm"
                color="gray.400"
                onClick={() => {
                  setDeleteTarget({ type: 'post', id: post.id })
                  onOpen()
                }}
                _hover={{ color: 'red.500', bg: 'red.50' }}
              />
            )}
          </Flex>

          <Heading size="md" color="gray.800" mb={4}>
            {post.title}
          </Heading>

          <HStack spacing={3} mb={4}>
            <Box
              onClick={() => handleUserClick(post.user.id)}
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
            >
              <UserAvatar
                name={`${post.user.first_name} ${post.user.last_name}`}
                avatarUrl={post.user.avatar || undefined}
                size="sm"
              />
            </Box>
            <Text 
              fontSize="sm" 
              fontWeight="500" 
              color="gray.700"
              cursor="pointer"
              onClick={() => handleUserClick(post.user.id)}
              _hover={{ color: 'yellow.600' }}
            >
              {post.user.first_name} {post.user.last_name}
            </Text>
            <HStack spacing={1} color="gray.400" fontSize="xs">
              <Icon as={MdAccessTime} boxSize={3} />
              <Text>{formatDate(post.created_at)}</Text>
            </HStack>
          </HStack>

          <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap" lineHeight="1.7">
            {post.content}
          </Text>
        </Box>

        {/* Comments Section */}
        <Box>
          <HStack spacing={2} mb={4}>
            <Icon as={MdComment} boxSize={5} color="gray.500" />
            <Heading size="sm" color="gray.700">
              Comments ({post.comment_count})
            </Heading>
          </HStack>

          {/* Add Comment */}
          {user && canComment && (
            <Box bg="gray.50" borderRadius="xl" p={4} mb={4}>
              <HStack align="start" spacing={3}>
                <UserAvatar
                  name={`${user.first_name} ${user.last_name}`}
                  avatarUrl={user.profile?.avatar || undefined}
                  size="sm"
                />
                <VStack flex={1} align="stretch" spacing={2}>
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    resize="none"
                    rows={2}
                    size="sm"
                    bg="white"
                    borderRadius="lg"
                    _focus={{ borderColor: 'yellow.400', boxShadow: '0 0 0 1px var(--chakra-colors-yellow-400)' }}
                  />
                  <Flex justify="flex-end">
                    <Button
                      leftIcon={<Icon as={MdSend} boxSize={3} />}
                      bg="yellow.400"
                      color="gray.800"
                      size="xs"
                      onClick={handleAddComment}
                      isLoading={submitting}
                      _hover={{ bg: 'yellow.500' }}
                    >
                      Comment
                    </Button>
                  </Flex>
                </VStack>
              </HStack>
            </Box>
          )}

          {user && !canComment && (
            <Box bg="yellow.50" borderRadius="lg" p={3} mb={4}>
              <Text fontSize="xs" color="gray.600">
                {user.is_banned
                  ? 'Your account is suspended. You cannot comment.'
                  : 'Please verify your email to comment on posts.'}
              </Text>
            </Box>
          )}

          {/* Comments List */}
          <VStack spacing={0} align="stretch">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment, index) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  currentUser={user}
                  onDelete={() => {
                    setDeleteTarget({ type: 'comment', id: comment.id })
                    onOpen()
                  }}
                  formatDate={formatDate}
                  onUserClick={handleUserClick}
                  isLast={index === post.comments!.length - 1}
                />
              ))
            ) : (
              <Box textAlign="center" py={8} color="gray.400">
                <Text fontSize="sm">No comments yet. Be the first to comment!</Text>
              </Box>
            )}
          </VStack>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay bg="blackAlpha.300">
          <AlertDialogContent mx={4}>
            <AlertDialogHeader fontSize="md" fontWeight="600">
              Delete {deleteTarget?.type === 'post' ? 'Post' : 'Comment'}
            </AlertDialogHeader>
            <AlertDialogBody fontSize="sm" color="gray.600">
              Are you sure? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={2} size="sm">
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}

interface CommentCardProps {
  comment: ForumComment
  currentUser: any
  onDelete: () => void
  formatDate: (date: string) => string
  onUserClick: (userId: string) => void
  isLast: boolean
}

const CommentCard = ({ comment, currentUser, onDelete, formatDate, onUserClick, isLast }: CommentCardProps) => {
  // Strict ID comparison - only owner or admin can delete
  const canDelete =
    currentUser && (Number(currentUser.id) === Number(comment.user.id) || currentUser.is_admin === true)

  return (
    <Box 
      py={3} 
      borderBottom={!isLast ? '1px solid' : 'none'}
      borderColor="gray.100"
    >
      <HStack justify="space-between" align="start">
        <HStack spacing={3} align="start" flex={1}>
          <Box
            onClick={() => onUserClick(comment.user.id)}
            cursor="pointer"
            _hover={{ opacity: 0.8 }}
          >
            <UserAvatar
              name={`${comment.user.first_name} ${comment.user.last_name}`}
              avatarUrl={comment.user.avatar || undefined}
              size="xs"
            />
          </Box>
          <VStack align="start" spacing={0.5} flex={1}>
            <HStack spacing={2}>
              <Text 
                fontWeight="500" 
                fontSize="xs" 
                color="gray.700"
                cursor="pointer"
                onClick={() => onUserClick(comment.user.id)}
                _hover={{ color: 'yellow.600' }}
              >
                {comment.user.first_name} {comment.user.last_name}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {formatDate(comment.created_at)}
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              {comment.content}
            </Text>
          </VStack>
        </HStack>
        {canDelete && (
          <IconButton
            aria-label="Delete comment"
            icon={<Icon as={MdDelete} boxSize={3} />}
            variant="ghost"
            size="xs"
            color="gray.400"
            onClick={onDelete}
            _hover={{ color: 'red.500', bg: 'red.50' }}
          />
        )}
      </HStack>
    </Box>
  )
}

export default ForumPostPage
