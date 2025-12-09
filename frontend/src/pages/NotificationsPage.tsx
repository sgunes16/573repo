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
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { MdDelete, MdNotifications } from 'react-icons/md'
import Navbar from '@/components/Navbar'
import { notificationService, type Notification } from '@/services/notification.service'

const NotificationsPage = () => {
  const toast = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

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

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />
      <Box maxW="800px" mx="auto" px={4} py={6}>
        <HStack spacing={3} mb={6}>
          <Icon as={MdNotifications} boxSize={6} color="yellow.500" />
          <Heading size="lg">Notifications</Heading>
          {notifications.length > 0 && (
            <Badge colorScheme="yellow" fontSize="sm">
              {notifications.length}
            </Badge>
          )}
        </HStack>

        {isLoading ? (
          <VStack spacing={3} align="stretch">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="80px" borderRadius="md" />
            ))}
          </VStack>
        ) : notifications.length === 0 ? (
          <Box
            bg="gray.50"
            borderRadius="lg"
            p={8}
            textAlign="center"
          >
            <Icon as={MdNotifications} boxSize={12} color="gray.300" mb={3} />
            <Text color="gray.500" fontSize="lg">
              No notifications yet
            </Text>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {notifications.map((notification) => (
              <Box
                key={notification.id}
                p={4}
                bg="white"
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.200"
                _hover={{ borderColor: 'yellow.300', shadow: 'sm' }}
                transition="all 0.2s"
              >
                <HStack justify="space-between" align="flex-start">
                  <VStack align="flex-start" spacing={1} flex={1}>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(notification.created_at).toLocaleString()}
                    </Text>
                    <Text fontSize="md">{notification.content}</Text>
                  </VStack>
                  <IconButton
                    aria-label="Delete notification"
                    icon={<MdDelete />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDelete(notification.id)}
                  />
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

