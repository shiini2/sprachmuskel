'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Profile, Level } from '@/types/database'
import { Loader2, Save, User, Target, Clock, BookOpen, ChevronRight } from 'lucide-react'

const LEVELS: Level[] = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2']
const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 30, 45, 60]

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
      }
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          display_name: profile.display_name ?? null,
          current_level: profile.current_level ?? 'A1.2',
          exam_date: profile.exam_date ?? null,
          daily_goal_minutes: profile.daily_goal_minutes ?? 20,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Einstellungen gespeichert!' })
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Fehler beim Speichern' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">
          Passe dein Lernprofil an
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Placement Test */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Einstufungstest
          </CardTitle>
          <CardDescription>
            Lass dein Niveau automatisch ermitteln und bekomme einen personalisierten Lernplan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => router.push('/placement')}
          >
            <span>Einstufungstest machen</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Der Test dauert etwa 10-15 Minuten und passt sich deinem Niveau an.
          </p>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profil
          </CardTitle>
          <CardDescription>Deine personlichen Informationen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              value={profile.display_name || ''}
              onChange={(e) =>
                setProfile({ ...profile, display_name: e.target.value })
              }
              placeholder="Dein Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Aktuelles Niveau</Label>
            <Select
              value={profile.current_level || 'A1.2'}
              onValueChange={(value: Level) =>
                setProfile({ ...profile, current_level: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Wahle dein Niveau" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Dein aktuelles Deutschniveau. Die Ubungen werden entsprechend angepasst.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exam Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Prufungsziel
          </CardTitle>
          <CardDescription>Wann ist deine B1 Prufung?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="examDate">Prufungsdatum</Label>
            <Input
              id="examDate"
              type="date"
              value={profile.exam_date || ''}
              onChange={(e) =>
                setProfile({ ...profile, exam_date: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Setze ein Prufungsdatum, um deinen Fortschritt besser zu verfolgen.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Tagesziel
          </CardTitle>
          <CardDescription>Wie viel mochtest du taglich uben?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dailyGoal">Tagliches Mindest-Ziel (Minuten)</Label>
            <div className="flex flex-wrap gap-2">
              {DAILY_GOAL_OPTIONS.map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  variant={
                    profile.daily_goal_minutes === mins ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    setProfile({ ...profile, daily_goal_minutes: mins })
                  }
                  className="min-w-[50px]"
                >
                  {mins}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile.daily_goal_minutes && profile.daily_goal_minutes <= 10 && 'Perfekt fur einen schnellen Start! Auch 5-10 Minuten taglich helfen.'}
              {profile.daily_goal_minutes && profile.daily_goal_minutes > 10 && profile.daily_goal_minutes <= 20 && '15-20 Minuten pro Tag sind ideal fur nachhaltige Fortschritte.'}
              {profile.daily_goal_minutes && profile.daily_goal_minutes > 20 && profile.daily_goal_minutes <= 30 && 'Sehr gut! Mit 30 Minuten taglich wirst du schnell Fortschritte machen.'}
              {profile.daily_goal_minutes && profile.daily_goal_minutes > 30 && 'Intensives Training! Du wirst sehr schnell vorankommen.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Wird gespeichert...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
