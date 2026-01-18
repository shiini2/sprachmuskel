import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Brain,
  Target,
  Zap,
  Globe,
  CheckCircle,
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between max-w-6xl">
        <h1 className="text-2xl font-bold text-primary">Sprachmuskel</h1>
        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Anmelden</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Registrieren</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center max-w-4xl">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Deutsch sprechen, nicht nur verstehen
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Eine Lern-App die dich zwingt aktiv Deutsch zu produzieren.
          Von A1.2 bis B1 in deinem Tempo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">
              Kostenlos starten
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Ich habe schon ein Konto</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <h3 className="text-2xl font-bold text-center mb-12">
          Warum Sprachmuskel anders ist
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Brain}
            title="Aktives Lernen"
            description="Keine Multiple-Choice-Fragen. Du musst selbst schreiben und formulieren - wie im echten Leben."
          />
          <FeatureCard
            icon={Target}
            title="B1 Prufungsfokus"
            description="Alle Ubungen sind auf die Goethe B1 Prufung ausgerichtet. Sehe deinen Fortschritt in Echtzeit."
          />
          <FeatureCard
            icon={Zap}
            title="Adaptive Schwierigkeit"
            description="Die App passt sich deinem Niveau an. Nicht zu leicht, nicht zu schwer - immer im optimalen Lernbereich."
          />
          <FeatureCard
            icon={Globe}
            title="Deutsch-First Erklarungen"
            description="Erklarungen zuerst auf Deutsch, mit Englisch nur wenn notig. So lernst du auch die Grammatikbegriffe."
          />
          <FeatureCard
            icon={CheckCircle}
            title="Keine Wiederholungen"
            description="Jede Ubung ist einzigartig. KI generiert immer neue Satze basierend auf deinen Schwachen."
          />
          <FeatureCard
            icon={Target}
            title="KI-Tutor immer dabei"
            description="Frag den KI-Tutor jederzeit wenn du etwas nicht verstehst. Er erklart dir Grammatik auf einfachem Deutsch."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <h3 className="text-2xl font-bold text-center mb-12">So funktioniert es</h3>
        <div className="space-y-8">
          <Step
            number={1}
            title="Erstelle dein Konto"
            description="Setze dein aktuelles Niveau und dein Prufungsdatum. Die App berechnet deinen personlichen Lernplan."
          />
          <Step
            number={2}
            title="Ube taglich 15-20 Minuten"
            description="Kurze, intensive Ubungen die dich zum Schreiben und Denken auf Deutsch zwingen."
          />
          <Step
            number={3}
            title="Verfolge deinen Fortschritt"
            description="Sehe deine Bereitschaft fur die B1 Prufung steigen. Die App zeigt dir genau, was du noch uben musst."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <h3 className="text-3xl font-bold mb-4">Bereit anzufangen?</h3>
        <p className="text-muted-foreground mb-8">
          Keine Kreditkarte notig. Keine Werbung. Deine Daten gehoren dir.
        </p>
        <Button size="lg" asChild>
          <Link href="/signup">
            Jetzt kostenlos starten
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Sprachmuskel - Aktiv Deutsch lernen
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="https://github.com/shiini2/sprachmuskel" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">
              Open Source auf GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 shadow-sm">
      <Icon className="w-10 h-10 text-primary mb-4" />
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function Step({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
