import { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Textarea,
  Select,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  Tab,
  Spinner,
  Icon,
  Flex,
  Input,
} from '@chakra-ui/react'
import { MdAdd, MdForum, MdComment, MdAccessTime } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import UserAvatar from '@/components/UserAvatar'
import { ForumPost, ForumCategory } from '@/types'
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

const ForumPage = () => {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | 'all'>('all')
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostCategory, setNewPostCategory] = useState<ForumCategory>('general')
  const [creating, setCreating] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {}
      const fetchedPosts = await apiService.get<ForumPost[]>('/forum/posts', { params })
      setPosts(fetchedPosts)
    } catch (error) {
      toast({
        title: 'Error fetching posts',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        title: 'Title and content are required',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setCreating(true)
    try {
      const newPost = await apiService.post<ForumPost>('/forum/posts', {
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
      })
      setPosts([newPost, ...posts])
      setNewPostTitle('')
      setNewPostContent('')
      setNewPostCategory('general')
      onClose()
      toast({
        title: 'Post created successfully',
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to create post'
      toast({
        title: errorMsg,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setCreating(false)
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

  const handleUserClick = (e: React.MouseEvent, userId: string | number) => {
    e.stopPropagation()
    navigate(`/profile/${userId}`)
  }

  const canCreatePost = user?.is_verified && !user?.is_banned

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />
      
      <Box maxW="900px" mx="auto" px={4} py={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={5}>
          <HStack spacing={3}>
            <Box
              p={2}
              bg="yellow.100"
              borderRadius="lg"
            >
              <Icon as={MdForum} boxSize={6} color="yellow.600" />
            </Box>
            <Box>
              <Heading size="md" color="gray.800">Community Forum</Heading>
              <Text fontSize="sm" color="gray.500">Share ideas and connect with others</Text>
            </Box>
          </HStack>
          {user && canCreatePost && (
            <Button
              leftIcon={<Icon as={MdAdd} />}
              bg="yellow.400"
              color="gray.800"
              size="sm"
              fontWeight="500"
              onClick={onOpen}
              _hover={{ bg: 'yellow.500' }}
            >
              New Post
            </Button>
          )}
        </Flex>

        {/* Category Tabs */}
        <Tabs
          variant="soft-rounded"
          colorScheme="yellow"
          size="sm"
          mb={5}
          index={['all', 'general', 'help', 'tips', 'feedback'].indexOf(selectedCategory)}
          onChange={(index) => {
            const categories: (ForumCategory | 'all')[] = ['all', 'general', 'help', 'tips', 'feedback']
            setSelectedCategory(categories[index])
          }}
        >
          <TabList bg="gray.50" p={1} borderRadius="full">
            <Tab _selected={{ bg: 'yellow.400', color: 'gray.800' }}>All</Tab>
            <Tab _selected={{ bg: 'yellow.400', color: 'gray.800' }}>General</Tab>
            <Tab _selected={{ bg: 'yellow.400', color: 'gray.800' }}>Help</Tab>
            <Tab _selected={{ bg: 'yellow.400', color: 'gray.800' }}>Tips</Tab>
            <Tab _selected={{ bg: 'yellow.400', color: 'gray.800' }}>Feedback</Tab>
          </TabList>
        </Tabs>

        {/* Posts List */}
        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="lg" color="yellow.500" thickness="3px" />
          </Flex>
        ) : posts.length === 0 ? (
          <Box textAlign="center" py={12} bg="gray.50" borderRadius="xl">
            <Icon as={MdForum} boxSize={12} color="gray.300" mb={3} />
            <Text fontSize="md" color="gray.500" mb={1}>No posts yet</Text>
            <Text fontSize="sm" color="gray.400" mb={4}>Be the first to start a discussion</Text>
            {canCreatePost && (
              <Button size="sm" colorScheme="yellow" onClick={onOpen}>
                Create Post
              </Button>
            )}
          </Box>
        ) : (
          <VStack spacing={0} align="stretch" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
            {posts.map((post, index) => (
              <Box
                key={post.id}
                p={4}
                cursor="pointer"
                onClick={() => navigate(`/forum/${post.id}`)}
                _hover={{ bg: 'gray.50' }}
                transition="background 0.15s"
                borderBottom={index < posts.length - 1 ? '1px solid' : 'none'}
                borderColor="gray.100"
              >
                <HStack spacing={3} align="start">
                  <Box
                    onClick={(e) => handleUserClick(e, post.user.id)}
                    cursor="pointer"
                    _hover={{ opacity: 0.8 }}
                  >
                    <UserAvatar
                      name={`${post.user.first_name} ${post.user.last_name}`}
                      avatarUrl={post.user.avatar || undefined}
                      size="sm"
                    />
                  </Box>
                  <VStack align="start" spacing={1} flex={1} minW={0}>
                    <HStack spacing={2} flexWrap="wrap">
                      <Badge 
                        colorScheme={CATEGORY_COLORS[post.category]} 
                        fontSize="10px"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                      >
                        {CATEGORY_LABELS[post.category]}
                      </Badge>
                      <Text 
                        fontSize="xs" 
                        color="gray.500"
                        onClick={(e) => handleUserClick(e, post.user.id)}
                        cursor="pointer"
                        _hover={{ color: 'yellow.600', textDecoration: 'underline' }}
                      >
                        {post.user.first_name} {post.user.last_name}
                      </Text>
                    </HStack>
                    <Text fontWeight="600" fontSize="sm" color="gray.800" noOfLines={1}>
                      {post.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={2}>
                      {post.content}
                    </Text>
                    <HStack spacing={3} mt={1}>
                      <HStack spacing={1} color="gray.400" fontSize="xs">
                        <Icon as={MdAccessTime} boxSize={3} />
                        <Text>{formatDate(post.created_at)}</Text>
                      </HStack>
                      <HStack spacing={1} color="gray.400" fontSize="xs">
                        <Icon as={MdComment} boxSize={3} />
                        <Text>{post.comment_count}</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* Create Post Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay bg="blackAlpha.300" />
        <ModalContent mx={4}>
          <ModalHeader fontSize="md" pb={2}>Create New Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="gray.600">Title</FormLabel>
                <Input
                  placeholder="What's on your mind?"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  size="sm"
                  borderRadius="lg"
                  _focus={{ borderColor: 'yellow.400', boxShadow: '0 0 0 1px var(--chakra-colors-yellow-400)' }}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="gray.600">Category</FormLabel>
                <Select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value as ForumCategory)}
                  size="sm"
                  borderRadius="lg"
                >
                  <option value="general">General</option>
                  <option value="help">Help</option>
                  <option value="tips">Tips</option>
                  <option value="feedback">Feedback</option>
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="gray.600">Content</FormLabel>
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  minH="150px"
                  size="sm"
                  borderRadius="lg"
                  _focus={{ borderColor: 'yellow.400', boxShadow: '0 0 0 1px var(--chakra-colors-yellow-400)' }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter pt={2}>
            <Button variant="ghost" size="sm" mr={2} onClick={onClose}>
              Cancel
            </Button>
            <Button
              bg="yellow.400"
              color="gray.800"
              size="sm"
              onClick={handleCreatePost}
              isLoading={creating}
              _hover={{ bg: 'yellow.500' }}
            >
              Post
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default ForumPage
