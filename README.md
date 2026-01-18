# Sprachmuskel - German Learning App

**[Start learning now at sprachmuskel.vercel.app](https://sprachmuskel.vercel.app)**

A web app designed to take you from A1.2 to B1 German by focusing on **active production** rather than passive recognition. No multiple choice - you write, you think, you learn.

## Features

- **Active Learning**: Write German sentences yourself - like in real conversations
- **B1 Exam Focus**: All exercises aligned with Goethe B1 exam requirements
- **Adaptive Difficulty**: Targets 60-75% success rate for optimal learning
- **AI Tutor**: Ask questions anytime, get grammar explanations in simple German
- **German-First**: Explanations in German first, English available when needed
- **Vocabulary Review**: Spaced repetition flashcards for effective memorization
- **Progress Tracking**: See your B1 readiness score improve over time
- **Free to Use**: No credit card required, no ads

## How It Works

1. **Create an account** at [sprachmuskel.vercel.app](https://sprachmuskel.vercel.app)
2. **Set your level** and exam date
3. **Practice 15-20 minutes daily** with exercises that make you write German
4. **Track your progress** toward B1 readiness

## Exercise Types

- **Reverse Translation**: See English, write German
- **Fill the Gap**: Complete sentences with the correct word
- **Grammar Snap**: Quick-fire grammar questions (timed)
- **Sentence Construction**: Arrange words into correct sentences
- **Error Correction**: Find and fix grammatical errors

---

## For Developers

Want to run your own instance or contribute? Sprachmuskel is open source!

### Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Supabase (PostgreSQL, Auth)
- **AI**: Groq (free), Ollama (local), or Claude API
- **Deployment**: Vercel

### Self-Hosting

#### 1. Clone and Install

```bash
git clone https://github.com/shiini2/sprachmuskel.git
cd sprachmuskel
npm install
```

#### 2. Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Get your URL and anon key from **Settings > API**
3. Run migrations:

```bash
# Option A: Using Supabase CLI
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID
npm run db:push

# Option B: Manual - run these in Supabase SQL Editor:
# - supabase/migrations/20240101000000_initial_schema.sql
# - supabase/migrations/20240101000001_seed_grammar_topics.sql
```

#### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Provider - choose one: 'groq', 'ollama', or 'claude'
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

#### 4. Run

```bash
npm run dev
```

### AI Provider Options

| Provider | Cost | Setup |
|----------|------|-------|
| **Groq** (recommended) | Free | Get key at [console.groq.com](https://console.groq.com) |
| **Ollama** | Free | Install from [ollama.ai](https://ollama.ai), run `ollama pull llama3.2` |
| **Claude** | ~$0.01/exercise | Get key at [console.anthropic.com](https://console.anthropic.com) |

### Raspberry Pi / Self-Hosting

Works on Raspberry Pi 4/5:

```bash
# Use a smaller model
ollama pull gemma2:2b

# Build and run
npm run build
npm start

# For production, use PM2
pm2 start npm --name "sprachmuskel" -- start
```

### Contributing

Contributions welcome! Please open an issue first to discuss changes.

## License

MIT
