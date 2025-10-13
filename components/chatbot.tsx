"use client"

import { useState, useRef, useEffect, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Send, X, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  id?: string
  role: "user" | "bot" | "admin"
  content: string
  created_at?: string
}

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [showSocial, setShowSocial] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Здравствуйте! Отправтье свои контактные данные и запрос на технику и ее характеристики. Наш менеджер свяжется с Вами в ближайшее время..",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUserMessages = useRef<Set<string>>(new Set())

  // Социальные сети и опции
  const socialLinks = [
    {
      name: "WhatsApp",
      url: "https://wa.me/79190422492",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.18-1.24-6.17-3.495-8.418"/>
        </svg>
      ),
      color: "bg-green-500 hover:bg-green-600",
      description: "Написать в WhatsApp"
    },
    {
      name: "Telegram", 
      url: "https://t.me/zhukovigor",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.157l-1.895 8.927c-.125.565-.453.703-.918.437l-2.54-1.87-1.225 1.18c-.135.135-.25.25-.512.25l.183-2.587 4.69-4.235c.205-.183-.045-.287-.317-.103l-5.797 3.645-2.495-.78c-.543-.17-.555-.543.115-.805l9.663-3.72c.45-.18.85.112.7.805z"/>
        </svg>
      ),
      color: "bg-blue-500 hover:bg-blue-600",
      description: "Написать в Telegram"
    },
    {
      name: "VK",
      url: "https://vk.com/sprostehnika",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2m-2.29 14.93c-1.67 0-2.93-.73-4.07-2.07l.93-.89c.93 1.13 1.87 1.73 2.93 1.73.67 0 1.13-.27 1.13-.87 0-.47-.33-.8-1.2-1.13l-.8-.33c-1.47-.6-2.13-1.47-2.13-2.8 0-1.87 1.47-2.87 3.33-2.87 1.47 0 2.53.53 3.47 1.73l-.93.93c-.8-.93-1.6-1.4-2.47-1.4-.6 0-.93.33-.93.8 0 .47.33.73 1.13 1.07l.8.33c1.73.73 2.4 1.6 2.4 2.93.07 1.87-1.33 3-3.47 3z"/>
        </svg>
      ),
      color: "bg-blue-600 hover:bg-blue-700",
      description: "Написать в VK"
    },
    {
      name: "Чат",
      url: "#",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      ),
      color: "bg-purple-500 hover:bg-purple-600",
      description: "Открыть онлайн-чат",
      isChat: true
    }
  ]

  // Инициализация sessionId при первом открытии чата
  useEffect(() => {
    if (showChat && !sessionId) {
      const newSessionId = generateSessionId()
      setSessionId(newSessionId)
      console.log("Created session:", newSessionId)
    }
  }, [showChat, sessionId])

  // Polling для получения новых сообщений (только бот и админ)
  useEffect(() => {
    if (!showChat || !sessionId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }

    const pollForNewMessages = async () => {
      try {
        let url = `/api/chat/messages?sessionId=${sessionId}`
        
        if (lastMessageTime) {
          const sinceDate = new Date(lastMessageTime)
          const formattedTime = sinceDate.toISOString()
          url += `&since=${encodeURIComponent(formattedTime)}`
        }

        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()

        if (data.messages && data.messages.length > 0) {
          // Фильтруем только сообщения бота и админа, игнорируем пользовательские
          const newBotMessages = data.messages.filter((msg: any) => 
            msg.id && 
            (msg.role === 'bot' || msg.role === 'admin') &&
            !messages.some(m => m.id === msg.id)
          )

          if (newBotMessages.length > 0) {
            console.log("🟡 Adding new bot messages:", newBotMessages.length)
            
            setMessages((prev) => {
              const updatedMessages = [...prev]
              newBotMessages.forEach((msg: any) => {
                if (!updatedMessages.some(m => m.id === msg.id)) {
                  updatedMessages.push({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    created_at: msg.created_at,
                  })
                }
              })
              return updatedMessages
            })

            const latestTime = newBotMessages[newBotMessages.length - 1].created_at
            if (latestTime !== lastMessageTime) {
              setLastMessageTime(latestTime)
            }
          }

          // Убираем сообщения пользователя из pending после получения ответа
          if (newBotMessages.length > 0 && pendingUserMessages.current.size > 0) {
            pendingUserMessages.current.clear()
          }
        }
      } catch (error) {
        console.error("Error polling for messages:", error)
      }
    }

    pollForNewMessages()
    pollingIntervalRef.current = setInterval(pollForNewMessages, 3000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [showChat, sessionId, lastMessageTime, messages])

  // Автопрокрутка к новым сообщениям
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessageId = generateMessageId()
    const userMessage: Message = { 
      id: userMessageId,
      role: "user", 
      content: input,
      created_at: new Date().toISOString()
    }
    
    // Добавляем сообщение пользователя только один раз
    setMessages((prev) => [...prev, userMessage])
    pendingUserMessages.current.add(userMessageId)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input, 
          sessionId: sessionId 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      // Ответ бота придет через polling
      setLastMessageTime(new Date().toISOString())

    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessageId = generateMessageId()
      const errorMessage: Message = {
        id: errorMessageId,
        role: "bot",
        content: "Извините, произошла ошибка. Пожалуйста, попробуйте позже.",
        created_at: new Date().toISOString()
      }
      setMessages((prev) => [...prev, errorMessage])
      pendingUserMessages.current.delete(userMessageId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptionClick = (option: any) => {
    if (option.isChat) {
      setShowChat(true)
      setShowSocial(false)
    } else {
      window.open(option.url, '_blank', 'noopener,noreferrer')
      setShowSocial(false)
      setIsOpen(false)
    }
  }

  const handleCloseChat = () => {
    setShowChat(false)
    setShowSocial(false)
    setIsOpen(false)
    // Очищаем pending messages при закрытии чата
    pendingUserMessages.current.clear()
  }

  const handleMainButtonClick = () => {
    if (!isOpen) {
      setIsOpen(true)
      setShowSocial(true)
    } else {
      setIsOpen(false)
      setShowSocial(false)
      setShowChat(false)
      pendingUserMessages.current.clear()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Окно чата */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-[calc(100vw-48px)] sm:w-96 mb-4"
          >
            <Card className="h-[500px] flex flex-col shadow-2xl border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  Менеджер
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCloseChat}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="flex-grow overflow-hidden p-4">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                  <div className="space-y-4 pr-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-start gap-3",
                          message.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        {message.role === "bot" && (
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center">
                            <Bot size={16} />
                          </div>
                        )}
                        <div
                          className={cn(
                            "p-3 rounded-2xl max-w-[80%]",
                            message.role === "user"
                              ? "bg-blue-500 text-white rounded-br-none"
                              : "bg-gray-100 rounded-bl-none",
                          )}
                        >
                          <ReactMarkdown
                            className="text-sm leading-relaxed"
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        {message.role === "user" && (
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={16} />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-start gap-3 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center">
                          <Bot size={16} />
                        </div>
                        <div className="p-3 rounded-2xl bg-gray-100 rounded-bl-none">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="pt-4 border-t">
                <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Напишите сообщение..."
                    disabled={isLoading}
                    className="flex-1 rounded-full"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isLoading}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Меню с социальными сетями и чатом */}
      <AnimatePresence>
        {isOpen && showSocial && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute bottom-20 right-0 flex flex-col gap-3 mb-4 py-10"
          >
            {socialLinks.map((social, index) => (
              <motion.button
                key={social.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-white shadow-lg transition-all duration-200 transform hover:scale-105 text-left rounded-md",
                  social.color
                )}
                onClick={() => handleOptionClick(social)}
              >
                <span className="text-lg">{social.icon}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{social.name}</span>
                  <span className="text-xs opacity-90">{social.description}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Основная кнопка чата с пульсацией */}
      <motion.div className="relative my-14">
        <motion.div
          animate={!isOpen ? {
            scale: [1, 1.1, 1],
            boxShadow: [
              "0 0 0 0 rgba(59, 130, 246, 0.7)",
              "0 0 0 10px rgba(59, 130, 246, 0)",
              "0 0 0 0 rgba(59, 130, 246, 0)"
            ]
          } : {}}
          transition={{
            duration: 2,
            repeat: !isOpen ? Infinity : 0,
            repeatType: "loop"
          }}
          className="absolute inset-0 rounded-full"
        />
        
        <Button
          onClick={handleMainButtonClick}
          className={cn(
            "rounded-full w-16 h-16 shadow-2xl transition-all duration-200 relative z-10",
            isOpen 
              ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" 
              : "bg-white text-blue-600 hover:bg-gray-50 border-2 border-blue-500"
          )}
          aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        >
          {isOpen ? (
            <X size={24} className="transition-transform duration-200" />
          ) : (
            <MessageSquare size={24} />
          )}
        </Button>
      </motion.div>
    </div>
  )
}
