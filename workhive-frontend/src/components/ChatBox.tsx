import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useSelector } from 'react-redux'

import { useMeQuery } from '@/store/api/authApi'
import { useGetHistoryQuery, useMarkAsReadMutation } from '@/store/api/messagesApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Message } from '@/types/message'
import type { RootState } from '@/store'

interface ChatBoxProps {
  contractId: string
}

export function ChatBox({ contractId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  
  const token = useSelector((state: RootState) => state.auth.token)
  const { data: meData } = useMeQuery()
  const currentUser = meData?.data
  
  const { data: historyData, isLoading: isLoadingHistory } = useGetHistoryQuery(contractId)
  const [markAsRead] = useMarkAsReadMutation()


  useEffect(() => {
    if (historyData?.data) {
      setMessages(historyData.data)
      markAsRead(contractId)
    }
  }, [historyData])


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])


  useEffect(() => {
    if (!token || !contractId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const baseUrl = import.meta.env.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws')
      : 'ws://localhost:8080/api/v1'
    
    const wsUrl = `${baseUrl}/ws/chat/${contractId}?token=${token}`
    
    const socket = new WebSocket(wsUrl)
    socketRef.current = socket

    socket.onopen = () => {
      console.log('WS Connected')
      setIsConnected(true)
    }

    socket.onmessage = (event) => {
      try {
        const newMessage: Message = JSON.parse(event.data)
        setMessages((prev) => {
          if (prev.find(m => m.id === newMessage.id)) return prev
          markAsRead(contractId)
          return [...prev, newMessage]
        })
      } catch (err) {
        console.error('WS Parse Error:', err)
      }
    }

    socket.onclose = () => {
      console.log('WS Disconnected')
      setIsConnected(false)
    }

    socket.onerror = (err) => {
      console.error('WS Error:', err)
    }

    return () => {
      socket.close()
    }
  }, [contractId, token])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return

    socketRef.current.send(inputValue.trim())
    setInputValue('')
  }

  if (isLoadingHistory) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <span className="text-xs text-muted-foreground italic">Real-time collaboration</span>
      </div>


      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-60">
            <MessageSquareIcon className="h-12 w-12" />
            <p className="text-sm italic">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === (currentUser?.id || localStorage.getItem('userId'))
            return (
              <div 
                key={msg.id || index} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarImage src={msg.sender?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {msg.sender?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    {!isMe && (
                      <p className="text-[10px] font-semibold text-muted-foreground ml-1">
                        {msg.sender?.full_name}
                      </p>
                    )}
                    <div 
                      className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p className={`text-[10px] text-muted-foreground flex items-center gap-1 ${isMe ? 'justify-end mr-1' : 'ml-1'}`}>
                      <Clock className="h-2 w-2" />
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>


      <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
        <Input 
          placeholder={isConnected ? "Type your message..." : "Connecting..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!isConnected}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!isConnected || !inputValue.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

function MessageSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
