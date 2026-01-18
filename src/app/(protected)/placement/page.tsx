'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PlacementQuestion as PlacementQuestionComponent } from '@/components/placement/PlacementQuestion'
import { KnowledgeMapDisplay } from '@/components/placement/KnowledgeMapDisplay'
import { LearningPathDisplay } from '@/components/placement/LearningPathDisplay'
import { GrammarTopic } from '@/types/database'
import { PlacementQuestion, QuizState, TopicAssessment, KnowledgeMap, LearningPathItem } from '@/types/placement'
import {
  calculateMasteryLevel,
  calculateConfidence,
  shouldContinueTopic,
  determineOverallLevel,
  generateLearningPath,
  buildKnowledgeMap,
  selectNextQuestion,
} from '@/lib/algorithms/placement'
import {
  Loader2,
  BookOpen,
  Target,
  ChevronRight,
  RotateCcw,
  Award,
} from 'lucide-react'

type QuizPhase = 'intro' | 'loading' | 'quiz' | 'processing' | 'results'

export default function PlacementPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<QuizPhase>('intro')
  const [topics, setTopics] = useState<GrammarTopic[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<PlacementQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<PlacementQuestion | null>(null)
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    totalQuestions: 0,
    answers: [],
    currentLevel: 'A1.1',
    startTime: 0,
    topicResults: new Map(),
  })
  const [knowledgeMap, setKnowledgeMap] = useState<KnowledgeMap | null>(null)
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([])
  const [error, setError] = useState<string | null>(null)

  // Fetch topics on mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/placement/generate')
        if (!response.ok) throw new Error('Failed to fetch topics')
        const data = await response.json()
        setTopics(data.topics || [])
      } catch (err) {
        console.error('Error fetching topics:', err)
        setError('Fehler beim Laden der Themen')
      }
    }
    fetchTopics()
  }, [])

  const generateQuestionForTopic = useCallback(async (topicId: number, difficulty: number): Promise<PlacementQuestion | null> => {
    try {
      const response = await fetch('/api/placement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, difficulty }),
      })
      if (!response.ok) return null
      const data = await response.json()
      return data.question
    } catch {
      return null
    }
  }, [])

  const startQuiz = useCallback(async () => {
    setPhase('loading')
    setError(null)

    try {
      // Generate initial questions for each topic (at least one per topic)
      const questions: PlacementQuestion[] = []

      // Start with A1 topics, then A2, then B1
      const sortedTopics = [...topics].sort((a, b) => {
        const levelOrder = { 'A1': 0, 'A2': 1, 'B1': 2 }
        return (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0)
      })

      // Generate 2-3 questions per topic for key topics
      const keyTopics = sortedTopics.slice(0, Math.min(15, sortedTopics.length))

      for (const topic of keyTopics) {
        const difficulty = topic.level === 'A1' ? 2 : topic.level === 'A2' ? 3 : 4
        const question = await generateQuestionForTopic(topic.id, difficulty)
        if (question) {
          questions.push(question)
        }
      }

      if (questions.length === 0) {
        throw new Error('No questions generated')
      }

      setAvailableQuestions(questions)
      setQuizState({
        currentQuestion: 1,
        totalQuestions: Math.min(20, questions.length), // Max 20 questions in placement
        answers: [],
        currentLevel: 'A1.1',
        startTime: Date.now(),
        topicResults: new Map(),
      })

      // Select first question
      const firstQuestion = questions[0]
      setCurrentQuestion(firstQuestion)
      setPhase('quiz')
    } catch (err) {
      console.error('Error starting quiz:', err)
      setError('Fehler beim Starten des Tests. Bitte versuche es erneut.')
      setPhase('intro')
    }
  }, [topics, generateQuestionForTopic])

  const handleAnswer = useCallback(async (answer: string): Promise<boolean> => {
    if (!currentQuestion) return false

    // Evaluate the answer
    let isCorrect = false
    try {
      const response = await fetch('/api/placement/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionType: currentQuestion.type,
          topic: currentQuestion.topic,
          prompt: currentQuestion.prompt_en,
          correctAnswer: currentQuestion.correct_answer,
          userAnswer: answer,
        }),
      })
      const result = await response.json()
      isCorrect = result.is_correct || result.is_acceptable
    } catch {
      // Simple fallback comparison
      isCorrect = answer.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()
    }

    // Update quiz state
    const topicId = currentQuestion.topic.id
    const currentResults = quizState.topicResults.get(topicId) || { correct: 0, total: 0 }
    const newResults = {
      correct: currentResults.correct + (isCorrect ? 1 : 0),
      total: currentResults.total + 1,
    }

    const newTopicResults = new Map(quizState.topicResults)
    newTopicResults.set(topicId, newResults)

    const newAnswers = [
      ...quizState.answers,
      {
        questionId: currentQuestion.id,
        correct: isCorrect,
        timeTaken: Math.floor((Date.now() - quizState.startTime) / 1000),
      },
    ]

    const newState: QuizState = {
      ...quizState,
      currentQuestion: quizState.currentQuestion + 1,
      answers: newAnswers,
      topicResults: newTopicResults,
    }
    setQuizState(newState)

    // Check if quiz is complete
    if (newState.currentQuestion > newState.totalQuestions) {
      await completeQuiz(newState)
      return isCorrect
    }

    // Generate more questions if needed for topics that need more testing
    if (shouldContinueTopic(newResults.correct, newResults.total)) {
      // Try to generate another question for this topic
      const newDifficulty = isCorrect ? Math.min(5, currentQuestion.difficulty + 1) : Math.max(1, currentQuestion.difficulty - 1)
      const additionalQuestion = await generateQuestionForTopic(topicId, newDifficulty)
      if (additionalQuestion && !availableQuestions.find(q => q.id === additionalQuestion.id)) {
        setAvailableQuestions(prev => [...prev, additionalQuestion])
      }
    }

    // Select next question using adaptive algorithm
    const nextQuestion = selectNextQuestion(newState, availableQuestions, topics)

    if (nextQuestion) {
      setCurrentQuestion(nextQuestion)
    } else {
      // No more questions available, complete quiz
      await completeQuiz(newState)
    }

    return isCorrect
  }, [currentQuestion, quizState, availableQuestions, topics, generateQuestionForTopic])

  const completeQuiz = async (finalState: QuizState) => {
    setPhase('processing')

    // Build assessments from quiz state
    const assessments: TopicAssessment[] = []
    finalState.topicResults.forEach((results, topicId) => {
      assessments.push({
        user_id: '', // Will be set by API
        topic_id: topicId,
        questions_asked: results.total,
        questions_correct: results.correct,
        mastery_level: calculateMasteryLevel(results.correct, results.total),
        confidence_score: calculateConfidence(results.correct, results.total),
      })
    })

    // Calculate overall results
    const overallLevel = determineOverallLevel(assessments, topics)
    const path = generateLearningPath(assessments, topics)
    const knowledge = buildKnowledgeMap(assessments, topics)

    const totalQuestions = finalState.answers.length
    const correctAnswers = finalState.answers.filter(a => a.correct).length
    const timeTaken = Math.floor((Date.now() - finalState.startTime) / 1000)

    // Save results
    try {
      await fetch('/api/placement/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallLevel,
          totalQuestions,
          correctAnswers,
          timeTakenSeconds: timeTaken,
          assessments,
          learningPath: path,
        }),
      })
    } catch (err) {
      console.error('Error saving results:', err)
    }

    setKnowledgeMap(knowledge)
    setLearningPath(path)
    setPhase('results')
  }

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Einstufungstest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Dieser Test hilft uns, dein aktuelles Deutschniveau zu verstehen und einen personalisierten Lernplan fur dich zu erstellen.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Adaptive Fragen</p>
                  <p className="text-sm text-muted-foreground">
                    Der Test passt sich deinem Niveau an
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Personlicher Lernplan</p>
                  <p className="text-sm text-muted-foreground">
                    Nach dem Test bekommst du einen klaren Weg zu B1
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 text-center">
                {error}
              </div>
            )}

            <Button
              onClick={startQuiz}
              className="w-full"
              size="lg"
              disabled={topics.length === 0}
            >
              Test starten
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Etwa 10-15 Minuten
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading screen
  if (phase === 'loading' || phase === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {phase === 'loading' ? 'Fragen werden geladen...' : 'Ergebnisse werden analysiert...'}
        </p>
        {phase === 'processing' && (
          <Progress value={75} className="w-48 h-2" />
        )}
      </div>
    )
  }

  // Quiz screen
  if (phase === 'quiz' && currentQuestion) {
    return (
      <PlacementQuestionComponent
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={quizState.currentQuestion}
        totalQuestions={quizState.totalQuestions}
      />
    )
  }

  // Results screen
  if (phase === 'results' && knowledgeMap) {
    const accuracy = quizState.answers.length > 0
      ? Math.round((quizState.answers.filter(a => a.correct).length / quizState.answers.length) * 100)
      : 0

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Summary Card */}
        <Card className="border-2 border-primary">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Test abgeschlossen!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-4xl font-bold">{knowledgeMap.overallLevel}</p>
            <p className="text-muted-foreground">
              Dein aktuelles Deutschniveau
            </p>
            <div className="flex justify-center gap-8 pt-4">
              <div>
                <p className="text-2xl font-bold">{accuracy}%</p>
                <p className="text-sm text-muted-foreground">Genauigkeit</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{quizState.answers.length}</p>
                <p className="text-sm text-muted-foreground">Fragen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Map */}
        <KnowledgeMapDisplay knowledgeMap={knowledgeMap} />

        {/* Learning Path */}
        <LearningPathDisplay
          learningPath={learningPath}
          onStartTopic={(topicId) => {
            router.push(`/practice?topic=${topicId}`)
          }}
        />

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/dashboard')}
          >
            Zum Dashboard
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.push('/practice')}
          >
            Ubung starten
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setPhase('intro')
            setQuizState({
              currentQuestion: 0,
              totalQuestions: 0,
              answers: [],
              currentLevel: 'A1.1',
              startTime: 0,
              topicResults: new Map(),
            })
            setKnowledgeMap(null)
            setLearningPath([])
          }}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Test wiederholen
        </Button>
      </div>
    )
  }

  return null
}
