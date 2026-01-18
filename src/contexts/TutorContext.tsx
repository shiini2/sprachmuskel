'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { GrammarTopic } from '@/types/database'

export interface TutorMessage {
  id: string
  role: 'user' | 'tutor'
  content_de: string
  content_en: string
  examples?: { de: string; en: string }[]
  // Correction of user's question (if they made mistakes)
  correction_de?: string | null
  correction_en?: string | null
  timestamp: Date
  // Context at the time of the message
  context?: {
    topicId?: number
    topicName?: string
    question?: string
    userAnswer?: string
    wasCorrect?: boolean
  }
}

export interface ExerciseContext {
  topic?: GrammarTopic
  currentQuestion?: string
  userAnswer?: string
  wasCorrect?: boolean
}

interface TutorContextType {
  // Chat state
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: TutorMessage[]
  addMessage: (message: Omit<TutorMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Current exercise context
  exerciseContext: ExerciseContext
  setExerciseContext: (context: ExerciseContext) => void

  // Send a message to the tutor
  sendMessage: (text: string) => Promise<void>
}

const TutorContext = createContext<TutorContextType | undefined>(undefined)

export function TutorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [exerciseContext, setExerciseContext] = useState<ExerciseContext>({})

  const addMessage = useCallback((message: Omit<TutorMessage, 'id' | 'timestamp'>) => {
    const newMessage: TutorMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    // Add user message with current context
    const userMessage: TutorMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content_de: text,
      content_en: text,
      timestamp: new Date(),
      context: exerciseContext.topic ? {
        topicId: exerciseContext.topic.id,
        topicName: exerciseContext.topic.name_de,
        question: exerciseContext.currentQuestion,
        userAnswer: exerciseContext.userAnswer,
        wasCorrect: exerciseContext.wasCorrect,
      } : undefined,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          topicId: exerciseContext.topic?.id,
          currentQuestion: exerciseContext.currentQuestion,
          userAnswer: exerciseContext.userAnswer,
          wasCorrect: exerciseContext.wasCorrect,
          conversationHistory: messages.slice(-10).map((m) => ({
            role: m.role,
            message: m.content_en,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      const tutorResponse = data.response

      const tutorMessage: TutorMessage = {
        id: crypto.randomUUID(),
        role: 'tutor',
        content_de: tutorResponse.response_de,
        content_en: tutorResponse.response_en,
        examples: tutorResponse.examples,
        correction_de: tutorResponse.correction_de,
        correction_en: tutorResponse.correction_en,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, tutorMessage])

      // Save to database for persistence
      try {
        await fetch('/api/tutor/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [userMessage, tutorMessage],
          }),
        })
      } catch (e) {
        // Non-critical, just log
        console.error('Failed to save tutor history:', e)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: TutorMessage = {
        id: crypto.randomUUID(),
        role: 'tutor',
        content_de: 'Entschuldigung, etwas ist schiefgelaufen. Bitte versuche es erneut.',
        content_en: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, exerciseContext, messages])

  return (
    <TutorContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        addMessage,
        clearMessages,
        isLoading,
        setIsLoading,
        exerciseContext,
        setExerciseContext,
        sendMessage,
      }}
    >
      {children}
    </TutorContext.Provider>
  )
}

export function useTutor() {
  const context = useContext(TutorContext)
  if (context === undefined) {
    throw new Error('useTutor must be used within a TutorProvider')
  }
  return context
}
