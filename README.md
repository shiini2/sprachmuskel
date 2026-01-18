# Sprachmuskel - German Learning App

A web app designed to take you from A1.2 to B1 German by focusing on **active production** rather than passive recognition. Built with Next.js, Supabase, and AI.

## Features

- **Active Learning**: No multiple choice - you must write and formulate German sentences
- **B1 Exam Focus**: All exercises aligned with Goethe B1 exam requirements
- **Adaptive Difficulty**: Targets 60-75% success rate for optimal learning
- **German-First Explanations**: Explanations in German first, English available if needed
- **AI Tutor Chat**: Ask questions anytime, get corrections on your German
- **Mini-Lessons**: Learn grammar before practicing with exercises
- **No Repetition**: AI generates unique sentences every time
- **Free Options**: Works with free Groq API or local Ollama

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Supabase (PostgreSQL, Auth)
- **AI**: Groq (free, recommended), Ollama (local), or Claude API
- **Deployment**: Vercel (free tier available)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/sprachmuskel.git
cd sprachmuskel
npm install
```

### 2. Set Up Supabase (Free Tier)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings > API** and copy your URL and anon key
4. Go to **SQL Editor** and run these files in order:
   - `supabase/schema.sql` - Creates the database tables
   - `supabase/seed-grammar-topics.sql` - Adds the B1 curriculum
   - `supabase/tutor-history-schema.sql` - Creates tutor chat history table

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Provider - choose one: 'groq', 'ollama', or 'claude'
AI_PROVIDER=groq

# Option 1: Groq (FREE & fast - recommended)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant

# Option 2: Ollama (FREE - runs locally)
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama3.2

# Option 3: Claude API (paid)
# ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Set Up AI Provider (Choose One)

#### Option 1: Groq (Recommended - Free & Fast)

1. Create a free account at [console.groq.com](https://console.groq.com)
2. Go to **API Keys** and create a new key
3. Set `AI_PROVIDER=groq` and `GROQ_API_KEY` in `.env.local`

Groq offers free API access with generous rate limits - perfect for personal use.

#### Option 2: Ollama (Free - Local)

1. Install Ollama: https://ollama.ai
2. Pull a model:
   ```bash
   ollama pull llama3.2
   ```
3. Set `AI_PROVIDER=ollama` in `.env.local`

#### Option 3: Claude API (Paid)

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Set `AI_PROVIDER=claude` and `ANTHROPIC_API_KEY` in `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel (Free)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sprachmuskel.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"New Project"**
3. Import your `sprachmuskel` repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AI_PROVIDER` (set to `groq`)
   - `GROQ_API_KEY`
   - `GROQ_MODEL` (set to `llama-3.1-8b-instant`)
5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`

## Project Structure

```
sprachmuskel/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Login, signup pages
│   │   ├── (protected)/       # Dashboard, practice, settings
│   │   └── api/               # API routes for AI
│   ├── components/
│   │   ├── ui/                # Shadcn components
│   │   ├── exercises/         # Exercise components
│   │   ├── tutor/             # AI tutor chat
│   │   └── dashboard/         # Dashboard widgets
│   ├── contexts/              # React contexts (tutor state)
│   ├── lib/
│   │   ├── supabase/          # Supabase client
│   │   ├── ai/                # AI provider abstraction
│   │   └── algorithms/        # Difficulty, readiness
│   └── types/                 # TypeScript types
├── supabase/
│   ├── schema.sql             # Database schema
│   ├── seed-grammar-topics.sql # B1 curriculum
│   └── tutor-history-schema.sql # Tutor chat history
└── .env.example               # Environment template
```

## Exercise Types

1. **Reverse Translation**: English → German sentence
2. **Fill the Gap**: Complete German sentence with missing word
3. **Grammar Snap**: Quick-fire grammar questions (timed)
4. **Sentence Construction**: Arrange words into correct sentence
5. **Error Correction**: Find and fix grammatical errors

## AI Tutor

The AI tutor chat (bottom-right corner) helps you:
- Ask questions about German grammar
- Get corrections when you write German with errors
- Learn how to phrase questions in German
- Understand why your answer was wrong

The tutor explains things in simple German (A2 level) with English available.

## Adaptive Learning

The app targets 60-75% success rate (the "Goldilocks zone"):
- >80% correct → Difficulty increases
- <50% correct → Difficulty decreases

This keeps you challenged but not frustrated.

## B1 Readiness Score

Your readiness score is calculated based on:
- A1 topics: 15% weight (should be solid)
- A2 topics: 30% weight (important bridge)
- B1 topics: 55% weight (exam focus)

## Self-Hosting (Raspberry Pi)

This app can run on a Raspberry Pi 4/5:

1. Install Node.js 18+
2. Install Ollama (ARM64 supported)
3. Use a smaller model: `ollama pull gemma2:2b`
4. Build and run:
   ```bash
   npm run build
   npm start
   ```

For production, use PM2:
```bash
npm install -g pm2
pm2 start npm --name "sprachmuskel" -- start
pm2 save
pm2 startup
```

## Contributing

Contributions welcome! Please open an issue first to discuss changes.

## License

MIT
