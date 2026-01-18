'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  BookOpen,
  Check,
  X,
  Eye,
  RotateCcw,
  Plus,
  Loader2,
  Brain,
} from 'lucide-react'

interface VocabularyItem {
  id: number
  word_de: string
  word_en: string
  gender: 'der' | 'die' | 'das' | null
  example_sentence_de: string | null
  example_sentence_en: string | null
  next_review: string
  review_count: number
  consecutive_correct: number
}

export default function ReviewPage() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [dueItems, setDueItems] = useState<VocabularyItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingWord, setIsAddingWord] = useState(false)
  const [newWord, setNewWord] = useState({ de: '', en: '', gender: '' })
  const [stats, setStats] = useState({ reviewed: 0, correct: 0 })

  const supabase = createClient()

  useEffect(() => {
    loadVocabulary()
  }, [])

  const loadVocabulary = async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all vocabulary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allVocab } = await (supabase as any)
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .order('next_review', { ascending: true })

    if (allVocab) {
      const typedVocab = allVocab as VocabularyItem[]
      setVocabulary(typedVocab)

      // Filter due items (next_review <= now)
      const now = new Date().toISOString()
      const due = typedVocab.filter(v => v.next_review <= now)
      setDueItems(due)
    }
    setIsLoading(false)
  }

  const currentItem = dueItems[currentIndex]

  const checkAnswer = () => {
    if (!currentItem) return

    const correct = userAnswer.toLowerCase().trim() === currentItem.word_de.toLowerCase().trim()
    setIsCorrect(correct)
    setShowAnswer(true)
    setStats(s => ({
      reviewed: s.reviewed + 1,
      correct: s.correct + (correct ? 1 : 0)
    }))

    // Update spaced repetition
    updateSpacedRepetition(currentItem, correct)
  }

  const updateSpacedRepetition = async (item: VocabularyItem, correct: boolean) => {
    // SM-2 algorithm simplified
    let { ease_factor = 2.5, interval_days = 1, consecutive_correct = 0 } = item as VocabularyItem & { ease_factor?: number; interval_days?: number }

    if (correct) {
      consecutive_correct++
      if (consecutive_correct === 1) {
        interval_days = 1
      } else if (consecutive_correct === 2) {
        interval_days = 6
      } else {
        interval_days = Math.round(interval_days * ease_factor)
      }
      ease_factor = Math.max(1.3, ease_factor + 0.1)
    } else {
      consecutive_correct = 0
      interval_days = 1
      ease_factor = Math.max(1.3, ease_factor - 0.2)
    }

    const next_review = new Date()
    next_review.setDate(next_review.getDate() + interval_days)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('vocabulary')
      .update({
        ease_factor,
        interval_days,
        consecutive_correct,
        next_review: next_review.toISOString(),
        review_count: item.review_count + 1,
      })
      .eq('id', item.id)
  }

  const nextWord = () => {
    setUserAnswer('')
    setShowAnswer(false)
    setIsCorrect(null)

    if (currentIndex < dueItems.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Reload to check for any new due items
      loadVocabulary()
      setCurrentIndex(0)
    }
  }

  const addWord = async () => {
    if (!newWord.de || !newWord.en) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('vocabulary').insert({
      user_id: user.id,
      word_de: newWord.de,
      word_en: newWord.en,
      gender: newWord.gender || null,
      next_review: new Date().toISOString(),
    })

    setNewWord({ de: '', en: '', gender: '' })
    setIsAddingWord(false)
    loadVocabulary()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vokabeln</h1>
          <p className="text-muted-foreground">
            {dueItems.length} Worter zu wiederholen • {vocabulary.length} insgesamt
          </p>
        </div>
        <Button onClick={() => setIsAddingWord(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Wort hinzufugen
        </Button>
      </div>

      {/* Stats */}
      {stats.reviewed > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.reviewed}</p>
                <p className="text-sm text-muted-foreground">Wiederholt</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Richtig</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add word form */}
      {isAddingWord && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Neues Wort</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Deutsch</label>
                <Input
                  value={newWord.de}
                  onChange={(e) => setNewWord({ ...newWord, de: e.target.value })}
                  placeholder="z.B. Haus"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Englisch</label>
                <Input
                  value={newWord.en}
                  onChange={(e) => setNewWord({ ...newWord, en: e.target.value })}
                  placeholder="e.g. house"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Artikel (optional)</label>
              <div className="flex gap-2 mt-1">
                {['der', 'die', 'das'].map((g) => (
                  <Button
                    key={g}
                    variant={newWord.gender === g ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewWord({ ...newWord, gender: g })}
                  >
                    {g}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addWord}>Speichern</Button>
              <Button variant="outline" onClick={() => setIsAddingWord(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review card */}
      {dueItems.length > 0 && currentItem ? (
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Karte {currentIndex + 1} / {dueItems.length}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {currentItem.review_count}x wiederholt
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* English word to translate */}
            <div className="text-center py-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold">{currentItem.word_en}</p>
              {currentItem.gender && !showAnswer && (
                <p className="text-sm text-muted-foreground mt-2">
                  (Substantiv - vergiss den Artikel nicht!)
                </p>
              )}
            </div>

            {!showAnswer ? (
              <div className="space-y-4">
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Auf Deutsch..."
                  className="text-center text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button onClick={checkAnswer} className="flex-1">
                    Prufen
                  </Button>
                  <Button variant="outline" onClick={() => setShowAnswer(true)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result */}
                <div
                  className={`p-4 rounded-lg text-center ${
                    isCorrect === true
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : isCorrect === false
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {isCorrect === true && (
                    <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Richtig!</span>
                    </div>
                  )}
                  {isCorrect === false && (
                    <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                      <X className="w-5 h-5" />
                      <span className="font-medium">Nicht ganz...</span>
                    </div>
                  )}
                  <p className="text-xl font-bold">
                    {currentItem.gender && (
                      <span className="text-primary">{currentItem.gender} </span>
                    )}
                    {currentItem.word_de}
                  </p>
                  {userAnswer && isCorrect === false && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Deine Antwort: {userAnswer}
                    </p>
                  )}
                </div>

                {/* Example sentence if available */}
                {currentItem.example_sentence_de && (
                  <div className="text-sm text-center">
                    <p className="italic">&ldquo;{currentItem.example_sentence_de}&rdquo;</p>
                    {currentItem.example_sentence_en && (
                      <p className="text-muted-foreground">
                        ({currentItem.example_sentence_en})
                      </p>
                    )}
                  </div>
                )}

                <Button onClick={nextWord} className="w-full">
                  Weiter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Keine Worter zu wiederholen</h2>
            <p className="text-muted-foreground mb-4">
              {vocabulary.length === 0
                ? 'Fuge Worter hinzu, um mit dem Lernen zu beginnen.'
                : 'Gut gemacht! Komm spater wieder.'}
            </p>
            {vocabulary.length > 0 && (
              <Button variant="outline" onClick={() => {
                setDueItems(vocabulary)
                setCurrentIndex(0)
              }}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Alle wiederholen
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vocabulary list */}
      {vocabulary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alle Vokabeln ({vocabulary.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y max-h-64 overflow-y-auto">
              {vocabulary.map((v) => (
                <div key={v.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-medium">
                      {v.gender && <span className="text-primary">{v.gender} </span>}
                      {v.word_de}
                    </span>
                    <span className="text-muted-foreground ml-2">- {v.word_en}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {v.consecutive_correct}x richtig
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
