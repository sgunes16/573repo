import { useEffect, useRef, useState, useCallback } from 'react'

interface WebSocketMessage {
  type: string
  data?: any
  error?: string
}

interface UseWebSocketOptions {
  url: string
  token?: string  // JWT token for authentication
  onMessage?: (message: WebSocketMessage) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  reconnect?: boolean
  reconnectInterval?: number
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const {
    url,
    token,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldReconnectRef = useRef(true)
  
  // Use refs for callbacks to avoid reconnection loops
  const onMessageRef = useRef(onMessage)
  const onOpenRef = useRef(onOpen)
  const onCloseRef = useRef(onClose)
  const onErrorRef = useRef(onError)
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage
    onOpenRef.current = onOpen
    onCloseRef.current = onClose
    onErrorRef.current = onError
  }, [onMessage, onOpen, onClose, onError])

  const connect = useCallback(() => {
    // Don't connect if URL is empty
    if (!url) {
      return
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }
    
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    try {
      // Get WebSocket URL from environment or use default
      let wsUrl: string
      
      if (url.startsWith('ws://') || url.startsWith('wss://')) {
        wsUrl = url
      } else {
        // Check if we're in development (no nginx proxy)
        const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api'
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        
        // If API URL is relative (/api), use current host (nginx proxy)
        // If API URL is absolute, extract backend host for direct connection
        if (apiBaseUrl.startsWith('/api')) {
          // Relative path - nginx proxy mode
          wsUrl = `${wsProtocol}//${window.location.host}${url}`
        } else {
          // Absolute URL - direct backend connection (development)
          try {
            const apiUrl = new URL(apiBaseUrl.replace('/api', ''))
            wsUrl = `${wsProtocol}//${apiUrl.host}${url}`
          } catch {
            // Fallback to current host
            wsUrl = `${wsProtocol}//${window.location.host}${url}`
          }
        }
      }
      
      // Add token as query parameter if provided
      if (token) {
        const separator = wsUrl.includes('?') ? '&' : '?'
        wsUrl = `${wsUrl}${separator}token=${encodeURIComponent(token)}`
      }

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setIsConnected(true)
        onOpenRef.current?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          onMessageRef.current?.(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        onCloseRef.current?.()

        // Only reconnect if it wasn't a clean close and reconnect is enabled
        if (shouldReconnectRef.current && reconnect && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        onErrorRef.current?.(error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
    }
  }, [url, token, reconnect, reconnectInterval])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect')  // Clean close
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    shouldReconnectRef.current = true
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect: connect,
  }
}
