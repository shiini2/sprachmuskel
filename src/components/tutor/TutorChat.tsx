'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GrammarTopic } from '@/types/database'
import { TutorResponse } from '@/app/api/tutor/chat/route'
import {
  MessageCircleQuestion,
  X,
  Send,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'

interface Message {
  role: 'user' | 'tutor'
  content_de: string
  content_en: string
  examples?: { de: string; en: string }[]
}

interface TutorChatProps {
  // Context for the tutor
  topic?: GrammarTopic
  currentQuestion?: string
  userAnswer?: string
  wasCorrect?: boolean
  // Initial message to send (e.g., "Why was my answer wrong?")
  initialMessage?: string
  onClose?: () => void
}

export function TutorChat({
  topic,
  currentQuestion,
  userAnswer,
  wasCorrect,
  initialMessage,
  onClose,
}: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialMessage || '')
  const [isLoading, setIsLoading] = useState(false)
  const [showEnglish, setShowEnglish] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage) {
      handleSend(initialMessage)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content_de: text,
      content_en: text,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          topicId: topic?.id,
          currentQuestion,
          userAnswer,
          wasCorrect,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            message: m.content_en,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      const tutorResponse: TutorResponse = data.response

      const tutorMessage: Message = {
        role: 'tutor',
        content_de: tutorResponse.response_de,
        content_en: tutorResponse.response_en,
        examples: tutorResponse.examples,
      }
      setMessages((prev) => [...prev, tutorMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'tutor',
        content_de: 'Entschuldigung, etwas ist schiefgelaufen. Bitte versuche es erneut.',
        content_en: 'Sorry, something went wrong. Please try again.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedQuestions = topic
    ? [
        `Was ist ${topic.name_de}?`,
        'Kannst du mir mehr Beispiele geben?',
        'Warum war meine Antwort falsch?',
      ]
    : [
        'Was ist der Unterschied zwischen der/die/das?',
        'Wie konjugiere ich Verben im Prasens?',
        'Wann benutze ich Akkusativ?',
      ]

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Tutor Chat</h2>
          {topic && (
            <span className="text-sm text-muted-foreground">
              • {topic.name_de}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEnglish(!showEnglish)}
            className="text-xs"
          >
            {showEnglish ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircleQuestion className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {showEnglish
                ? 'Ask me anything about German grammar!'
                : 'Frag mich alles uber deutsche Grammatik!'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((q, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSend(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <p>{showEnglish ? msg.content_en : msg.content_de}</p>
                {msg.examples && msg.examples.length > 0 && (
                  <div className="mt-2 space-y-1 text-sm opacity-90">
                    {msg.examples.map((ex, exIdx) => (
                      <p key={exIdx} className="italic">
                        • {ex.de}
                        {showEnglish && (
                          <span className="text-xs ml-2">({ex.en})</span>
                        )}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={showEnglish ? 'Ask a question...' : 'Stelle eine Frage...'}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Floating button version
export function TutorChatButton({
  topic,
  currentQuestion,
  userAnswer,
  wasCorrect,
}: Omit<TutorChatProps, 'onClose'>) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
        size="icon"
      >
        <MessageCircleQuestion className="w-6 h-6" />
      </Button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          {/* Chat Panel */}
          <div className="relative w-full max-w-md h-[500px] bg-background rounded-lg shadow-xl border overflow-hidden">
            <TutorChat
              topic={topic}
              currentQuestion={currentQuestion}
              userAnswer={userAnswer}
              wasCorrect={wasCorrect}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
