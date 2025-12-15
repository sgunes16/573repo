import {
  Box,
  VStack,
  Text,
  Heading,
  Skeleton,
  IconButton,
  HStack,
  Badge,
  useToast,
  Icon,
  Button,
  ButtonGroup,
  Tooltip,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { MdDelete, MdNotifications, MdMarkEmailRead, MdMarkEmailUnread, MdDoneAll } from 'react-icons/md'
import Navbar from '@/components/Navbar'
import { notificationService, type Notification } from '@/services/notification.service'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getAccessToken } from '@/utils/cookies'
import { useAuthStore } from '@/store/useAuthStore'

type FilterType = 'all' | 'unread' | 'read'

const NotificationsPage = () => {
  const toast = useToast()
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('unread')

  useEffect(() => {
    fetchNotifications()
  }, [])

  // WebSocket for real-time notifications
  useWebSocket({
    url: '/ws/notifications/',
    token: user ? getAccessToken() || undefined : undefined,
    onMessage: (message) => {
      if (message.type === 'notification' && message.data) {
        // Add new notification to the list
        const newNotification: Notification = {
          id: message.data.id,
          content: message.data.content,
          is_read: message.data.is_read ?? false,
          created_at: message.data.created_at,
        }
        setNotifications((prev) => [newNotification, ...prev])
        toast({
          title: 'New Notification',
          description: newNotification.content,
          status: 'info',
          duration: 5000,
          isClosable: true,
        })
      }
    },
    onOpen: () => {},
    onClose: () => {},
    reconnect: true,
  })

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load notifications',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const updated = await notificationService.markAsRead(notificationId)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: updated.is_read } : n
      ))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update notification',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleMarkAsUnread = async (notificationId: number) => {
    try {
      const updated = await notificationService.markAsUnread(notificationId)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: updated.is_read } : n
      ))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update notification',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
        status: 'success',
        duration: 2000,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Operation failed',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleDelete = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId)
      setNotifications(notifications.filter(n => n.id !== notificationId))
      toast({
        title: 'Success',
        description: 'Notification deleted',
        status: 'success',
        duration: 2000,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete notification',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'read') return n.is_read
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />
      <Box maxW="800px" mx="auto" px={4} py={6}>
        <HStack spacing={3} mb={4} justify="space-between" flexWrap="wrap">
          <HStack spacing={3}>
            <Icon as={MdNotifications} boxSize={6} color="yellow.500" />
            <Heading size="lg">Notifications</Heading>
            {unreadCount > 0 && (
              <Badge colorScheme="red" fontSize="sm" borderRadius="full" px={2}>
                {unreadCount} unread
              </Badge>
            )}
          </HStack>
          
          {unreadCount > 0 && (
            <Button
              size="sm"
              leftIcon={<MdDoneAll />}
              colorScheme="yellow"
              variant="outline"
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </HStack>

        {/* Filter Buttons */}
        <ButtonGroup size="sm" mb={6} isAttached variant="outline">
          <Button
            colorScheme={filter === 'unread' ? 'yellow' : 'gray'}
            variant={filter === 'unread' ? 'solid' : 'outline'}
            onClick={() => setFilter('unread')}
          >
            Unread ({notifications.filter(n => !n.is_read).length})
          </Button>
          <Button
            colorScheme={filter === 'all' ? 'yellow' : 'gray'}
            variant={filter === 'all' ? 'solid' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </Button>
          <Button
            colorScheme={filter === 'read' ? 'yellow' : 'gray'}
            variant={filter === 'read' ? 'solid' : 'outline'}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.filter(n => n.is_read).length})
          </Button>
        </ButtonGroup>

        {isLoading ? (
          <VStack spacing={3} align="stretch">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="80px" borderRadius="md" />
            ))}
          </VStack>
        ) : filteredNotifications.length === 0 ? (
          <Box
            bg="gray.50"
            borderRadius="lg"
            p={8}
            textAlign="center"
          >
            <Icon as={MdNotifications} boxSize={12} color="gray.300" mb={3} />
            <Text color="gray.500" fontSize="lg">
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'read' ? 'No read notifications' : 
               'No notifications yet'}
            </Text>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {filteredNotifications.map((notification) => (
              <Box
                key={notification.id}
                p={4}
                bg={notification.is_read ? 'white' : 'yellow.50'}
                borderRadius="lg"
                border="1px solid"
                borderColor={notification.is_read ? 'gray.200' : 'yellow.300'}
                borderLeft={notification.is_read ? '1px solid' : '4px solid'}
                borderLeftColor={notification.is_read ? 'gray.200' : 'yellow.400'}
                _hover={{ borderColor: 'yellow.400', shadow: 'sm' }}
                transition="all 0.2s"
              >
                <HStack justify="space-between" align="flex-start">
                  <VStack align="flex-start" spacing={1} flex={1}>
                    <HStack spacing={2}>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(notification.created_at).toLocaleString()}
                      </Text>
                      {!notification.is_read && (
                        <Badge colorScheme="yellow" size="sm" fontSize="xs">
                          New
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="md" fontWeight={notification.is_read ? 'normal' : 'medium'}>
                      {notification.content}
                    </Text>
                  </VStack>
                  <HStack spacing={1}>
                    <Tooltip label={notification.is_read ? 'Mark as unread' : 'Mark as read'}>
                      <IconButton
                        aria-label={notification.is_read ? 'Mark as unread' : 'Mark as read'}
                        icon={notification.is_read ? <MdMarkEmailUnread /> : <MdMarkEmailRead />}
                        size="sm"
                        variant="ghost"
                        colorScheme="yellow"
                        onClick={() => notification.is_read 
                          ? handleMarkAsUnread(notification.id) 
                          : handleMarkAsRead(notification.id)
                        }
                      />
                    </Tooltip>
                    <Tooltip label="Delete">
                      <IconButton
                        aria-label="Delete notification"
                        icon={<MdDelete />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDelete(notification.id)}
                      />
                    </Tooltip>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  )
}

export default NotificationsPage
