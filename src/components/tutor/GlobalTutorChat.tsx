'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTutor, TutorMessage } from '@/contexts/TutorContext'
import {
  MessageCircleQuestion,
  X,
  Send,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  Minimize2,
  Maximize2,
} from 'lucide-react'

export function GlobalTutorChat() {
  const {
    isOpen,
    setIsOpen,
    messages,
    clearMessages,
    isLoading,
    exerciseContext,
    sendMessage,
  } = useTutor()

  const [input, setInput] = useState('')
  const [showEnglish, setShowEnglish] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom()
    }
  }, [messages, isOpen, isMinimized])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
  }

  const handleSuggestedQuestion = async (question: string) => {
    await sendMessage(question)
  }

  const suggestedQuestions = exerciseContext.topic
    ? [
        `Was ist ${exerciseContext.topic.name_de}?`,
        'Kannst du mir mehr Beispiele geben?',
        'Warum war meine Antwort falsch?',
      ]
    : [
        'Was ist der Unterschied zwischen der/die/das?',
        'Wie konjugiere ich Verben im Prasens?',
        'Wann benutze ich Akkusativ?',
      ]

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
        size="icon"
      >
        <MessageCircleQuestion className="w-6 h-6" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`bg-background rounded-lg shadow-xl border overflow-hidden transition-all duration-200 ${
          isMinimized ? 'w-72 h-14' : 'w-96 h-[500px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-primary/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm">Tutor</h2>
            {exerciseContext.topic && (
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                • {exerciseContext.topic.name_de}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowEnglish(!showEnglish)}
              title={showEnglish ? 'Auf Deutsch' : 'Show English'}
            >
              {showEnglish ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={clearMessages}
                title="Chat leeren"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Maximieren' : 'Minimieren'}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
              title="Schliesen"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 h-[380px]">
              {messages.length === 0 ? (
                <div className="text-center py-6">
                  <MessageCircleQuestion className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
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
                        onClick={() => handleSuggestedQuestion(q)}
                        disabled={isLoading}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    showEnglish={showEnglish}
                    formatTime={formatTime}
                  />
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
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={showEnglish ? 'Ask a question...' : 'Stelle eine Frage...'}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                  className="text-sm"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  showEnglish,
  formatTime,
}: {
  message: TutorMessage
  showEnglish: boolean
  formatTime: (date: Date) => string
}) {
  const isUser = message.role === 'user'
  const hasCorrection = !isUser && message.correction_de && message.correction_de !== 'null'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg p-2.5 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-slate-100 dark:bg-slate-800'
        }`}
      >
        {/* Show correction first if present */}
        {hasCorrection && (
          <div className="mb-2 pb-2 border-b border-yellow-400/50">
            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
              ✏️ {showEnglish ? 'Correction:' : 'Korrektur:'}
            </p>
            <p className="text-sm italic text-yellow-700 dark:text-yellow-300">
              {message.correction_de}
            </p>
            {showEnglish && message.correction_en && (
              <p className="text-xs mt-1 opacity-75">
                ({message.correction_en})
              </p>
            )}
          </div>
        )}

        <p className="text-sm">{showEnglish ? message.content_en : message.content_de}</p>
        {message.examples && message.examples.length > 0 && (
          <div className="mt-2 space-y-1 text-xs opacity-90">
            {message.examples.map((ex, idx) => (
              <p key={idx} className="italic">
                • {ex.de}
                {showEnglish && <span className="ml-1 opacity-75">({ex.en})</span>}
              </p>
            ))}
          </div>
        )}
        {message.context?.topicName && !isUser && (
          <p className="text-xs mt-1 opacity-60">
            Re: {message.context.topicName}
          </p>
        )}
        <p className="text-xs mt-1 opacity-50">{formatTime(message.timestamp)}</p>
      </div>
    </div>
  )
}
