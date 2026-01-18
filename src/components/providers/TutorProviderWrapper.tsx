'use client'

import { TutorProvider } from '@/contexts/TutorContext'
import { GlobalTutorChat } from '@/components/tutor/GlobalTutorChat'
import { useEffect } from 'react'
import { useTutor } from '@/contexts/TutorContext'

function TutorHistoryLoader() {
  const { addMessage } = useTutor()

  useEffect(() => {
    // Load tutor history on mount
    async function loadHistory() {
      try {
        const response = await fetch('/api/tutor/history?limit=50')
        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages.length > 0) {
            // Messages are already in the correct format from the API
            data.messages.forEach((msg: {
              id: string
              role: 'user' | 'tutor'
              content_de: string
              content_en: string
              examples?: { de: string; en: string }[]
              topic_id?: number
              question_context?: string
              user_answer_context?: string
              was_correct_context?: boolean
              created_at: string
              grammar_topics?: { name_de: string; name_en: string }
            }) => {
              addMessage({
                role: msg.role,
                content_de: msg.content_de,
                content_en: msg.content_en,
                examples: msg.examples,
                context: msg.topic_id ? {
                  topicId: msg.topic_id,
                  topicName: msg.grammar_topics?.name_de,
                  question: msg.question_context || undefined,
                  userAnswer: msg.user_answer_context || undefined,
                  wasCorrect: msg.was_correct_context ?? undefined,
                } : undefined,
              })
            })
          }
        }
      } catch (error) {
        console.error('Failed to load tutor history:', error)
      }
    }

    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export function TutorProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TutorProvider>
      <TutorHistoryLoader />
      {children}
      <GlobalTutorChat />
    </TutorProvider>
  )
}
