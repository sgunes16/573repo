import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Flex,
  Spinner,
} from '@chakra-ui/react'
import UserAvatar from '@/components/UserAvatar'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAuthStore } from '@/store/useAuthStore'
import { getAccessToken } from '@/utils/cookies'

interface Message {
  id: string
  user_id: string
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    profile?: {
      avatar?: string | null
    }
  }
  content: string
  created_at: string
}

interface ChatProps {
  exchangeId: string
}

const Chat: React.FC<ChatProps> = ({ exchangeId }) => {
  const { user } = useAuthStore()
  const currentUser = user as any
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { isConnected, sendMessage } = useWebSocket({
    url: `/ws/chat/${exchangeId}/`,
    token: getAccessToken() || undefined,
    onMessage: (message) => {
      if (message.type === 'messages') {
        // Initial messages
        setMessages(message.data || [])
      } else if (message.type === 'message') {
        // New message
        setMessages((prev) => [...prev, message.data])
      }
    },
    onOpen: () => {
      console.log('Chat WebSocket connected')
    },
    onClose: () => {
      console.log('Chat WebSocket disconnected')
    },
    onError: (error) => {
      console.error('Chat WebSocket error:', error)
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (inputMessage.trim() && isConnected) {
      sendMessage({ message: inputMessage.trim() })
      setInputMessage('')
      // Keep focus on input after sending
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      handleSend()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const isOwnMessage = (message: Message) => {
    return String(message.user_id) === String(currentUser?.id)
  }

  return (
    <VStack h="100%" spacing={0}>
      {/* Chat Header */}
      <Box w="100%" p={4} borderBottom="1px solid" borderColor="gray.200" bg="white">
        <HStack>
          <Text fontWeight="600">Chat</Text>
          {isConnected ? (
            <HStack spacing={2}>
              <Box w={2} h={2} bg="green.500" borderRadius="full" />
              <Text fontSize="sm" color="gray.600">Connected</Text>
            </HStack>
          ) : (
            <HStack spacing={2}>
              <Spinner size="xs" />
              <Text fontSize="sm" color="gray.600">Connecting...</Text>
            </HStack>
          )}
        </HStack>
      </Box>

      {/* Messages */}
      <Box
        flex="1"
        w="100%"
        overflowY="auto"
        p={4}
        bg="gray.50"
      >
        <VStack spacing={4} align="stretch">
          {messages.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              No messages yet. Start the conversation!
            </Text>
          ) : (
            messages.map((message) => {
              const own = isOwnMessage(message)
              return (
                <Flex
                  key={message.id}
                  justify={own ? 'flex-end' : 'flex-start'}
                >
                  <HStack
                    spacing={3}
                    maxW="70%"
                    align="flex-end"
                    flexDirection={own ? 'row-reverse' : 'row'}
                  >
                    <UserAvatar
                      size="sm"
                      user={{
                        first_name: message.user.first_name,
                        last_name: message.user.last_name,
                        email: message.user.email,
                        profile: {
                          avatar: message.user.profile?.avatar ?? undefined,
                        }
                      }}
                      bg={own ? 'yellow.500' : 'teal.500'}
                    />
                    <Box
                      bg={own ? 'yellow.400' : 'white'}
                      color={own ? 'gray.800' : 'gray.800'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      borderTopRightRadius={own ? '4px' : 'lg'}
                      borderTopLeftRadius={own ? 'lg' : '4px'}
                      boxShadow="sm"
                    >
                      {!own && (
                        <Text fontSize="xs" fontWeight="600" color="teal.600" mb={1}>
                          {message.user.first_name} {message.user.last_name}
                        </Text>
                      )}
                      <Text fontSize="sm">{message.content}</Text>
                      <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
                        {formatTime(message.created_at)}
                      </Text>
                    </Box>
                  </HStack>
                </Flex>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Input */}
      <Box w="100%" p={4} borderTop="1px solid" borderColor="gray.200" bg="white">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <HStack spacing={2}>
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={!isConnected}
              autoComplete="off"
            />
            <Button
              type="submit"
              colorScheme="yellow"
              disabled={!isConnected || !inputMessage.trim()}
            >
              Send
            </Button>
          </HStack>
        </form>
      </Box>
    </VStack>
  )
}

export default Chat
