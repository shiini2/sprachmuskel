import { ExerciseType, GrammarTopic, Level } from '@/types/database'
import { Context } from '@/types/exercises'

export function generateExercisePrompt(params: {
  exerciseType: ExerciseType
  topic: GrammarTopic
  level: Level
  context: Context
  difficulty: number
  weakVocabulary?: string[]
  avoidSentences?: string[]
}): string {
  const { exerciseType, topic, level, context, difficulty, weakVocabulary, avoidSentences } = params

  const contextDescriptions: Record<Context, string> = {
    daily_life: 'Alltagssituationen (zu Hause, Routine)',
    work: 'Arbeit und Beruf',
    travel: 'Reisen und Urlaub',
    social: 'Soziale Situationen (Freunde, Familie)',
    shopping: 'Einkaufen und Geschafte',
    health: 'Gesundheit und Arzt',
    education: 'Schule und Lernen',
  }

  const difficultyGuide = {
    1: 'Sehr einfach: kurze Satze, Grundwortschatz, einfache Struktur',
    2: 'Einfach: langere Satze, mehr Vokabeln, eine Nebensatzstruktur moglich',
    3: 'Mittel: komplexere Satze, Nebensatze, mehr Vokabular',
    4: 'Fortgeschritten: komplexe Strukturen, idiomatische Ausdrucke',
    5: 'Schwer: sehr komplexe Satze, seltene Worter, mehrere grammatische Konzepte',
  }

  const exerciseInstructions: Record<ExerciseType, string> = {
    reverse_translation: `
Generate a sentence for REVERSE TRANSLATION exercise.
The user will see the English sentence and must write the German version.
Focus on the grammar topic: ${topic.name_en} (${topic.name_de})`,

    fill_gap: `
Generate a FILL THE GAP exercise.
Create a German sentence with ONE word missing (shown as ___).
The missing word should test: ${topic.name_en} (${topic.name_de})
The gap should test a specific grammar point, not just vocabulary.`,

    sentence_construction: `
Generate a SENTENCE CONSTRUCTION exercise.
Provide 4-6 German words that can form a correct sentence.
Include a context hint so the user knows what sentence to construct.
Focus on: ${topic.name_en} (${topic.name_de})`,

    grammar_snap: `
Generate a GRAMMAR SNAP exercise (rapid-fire, 3-5 seconds to answer).
Create a very short question testing ONE specific grammar point.
Types: article choice (der/die/das), verb conjugation, case selection, preposition.
Focus on: ${topic.name_en} (${topic.name_de})`,

    error_correction: `
Generate an ERROR CORRECTION exercise.
Create a German sentence with exactly ONE grammatical error.
The error should be related to: ${topic.name_en} (${topic.name_de})
The error should be realistic (common mistake for learners).`,
  }

  const prompt = `You are a German language teacher creating exercises for a student at ${level} level working toward B1.

${exerciseInstructions[exerciseType]}

Requirements:
- Difficulty: ${difficulty}/5 - ${difficultyGuide[difficulty as keyof typeof difficultyGuide]}
- Context: ${contextDescriptions[context]}
- Grammar focus: ${topic.description_de || topic.name_de}
${weakVocabulary?.length ? `- Try to include these weak vocabulary words if natural: ${weakVocabulary.join(', ')}` : ''}
${avoidSentences?.length ? `- Avoid sentences similar to: ${avoidSentences.slice(0, 3).join('; ')}` : ''}

IMPORTANT:
- Keep explanations in SIMPLE German (A2 level) so the learner can understand
- Make the exercise natural and useful for real-life situations
- The sentence should be something a German native would actually say

Respond in this exact JSON format:
{
  "sentence_de": "The German sentence (complete, or with ___ for fill_gap)",
  "sentence_en": "The English translation",
  "correct_answer": "The expected answer from the user",
  "hint_de": "A short hint in simple German if the user is stuck",
  "hint_en": "The hint in English",
  "explanation_de": "Brief explanation of the grammar point in simple German",
  "explanation_en": "The explanation in English",
  ${exerciseType === 'fill_gap' ? '"gap_word_type": "What type of word is missing (artikel/verb/praposition/etc)",' : ''}
  ${exerciseType === 'sentence_construction' ? '"words": ["array", "of", "words", "to", "arrange"],' : ''}
  ${exerciseType === 'sentence_construction' ? '"context_hint": "Context to help construct the sentence",' : ''}
  ${exerciseType === 'grammar_snap' ? '"question_type": "article|conjugation|case|preposition",' : ''}
  ${exerciseType === 'grammar_snap' ? '"time_limit_seconds": 3-5,' : ''}
  ${exerciseType === 'error_correction' ? '"sentence_with_error": "The sentence with the error",' : ''}
  ${exerciseType === 'error_correction' ? '"error_type": "Type of error",' : ''}
  "key_vocabulary": [
    {"de": "word", "en": "translation", "gender": "der/die/das or null"}
  ]
}`

  return prompt
}

export function generateEvaluationPrompt(params: {
  exerciseType: ExerciseType
  topic: GrammarTopic
  expectedAnswer: string
  userAnswer: string
  originalPrompt: string
}): string {
  const { exerciseType, topic, expectedAnswer, userAnswer, originalPrompt } = params

  return `You are a supportive German teacher evaluating a student's answer.

Exercise type: ${exerciseType}
Grammar focus: ${topic.name_en} (${topic.name_de})
Original prompt: ${originalPrompt}
Expected answer: ${expectedAnswer}
Student's answer: ${userAnswer}

Evaluate the answer. Be understanding of minor typos but strict on grammar points.
Consider acceptable alternatives (word order variations, synonyms that are grammatically correct).

IMPORTANT:
- Write explanations in SIMPLE German (A2 level) first
- Be encouraging, not discouraging
- Focus on one main error if there are multiple

Respond in this exact JSON format:
{
  "is_correct": true/false,
  "is_acceptable_alternative": true/false (if not exactly correct but grammatically valid),
  "errors": [
    {
      "type": "grammar|vocabulary|word_order|spelling|case|gender|conjugation",
      "description_de": "Explanation in simple German",
      "description_en": "Explanation in English",
      "correction": "The corrected part"
    }
  ],
  "corrected_version": "Full corrected sentence if wrong",
  "explanation_de": "Overall explanation in simple German",
  "explanation_en": "Overall explanation in English",
  "encouragement_de": "A short encouraging message in German (Gut gemacht! / Fast richtig! / etc.)",
  "vocabulary_to_learn": [
    {"de": "word", "en": "translation", "gender": "der/die/das or null"}
  ]
}`
}

export function generateSimpleExplanationPrompt(
  topic: GrammarTopic,
  context: string
): string {
  return `Explain this German grammar concept in VERY SIMPLE German (A2 level):

Topic: ${topic.name_de} (${topic.name_en})
Context: ${context}

Rules:
- Use only common, basic vocabulary
- Keep sentences short
- Give 1-2 clear examples
- No complex grammatical terminology

Respond in JSON:
{
  "explanation_de": "Simple German explanation (max 3 sentences)",
  "explanation_en": "English translation",
  "examples": [
    {"de": "Example sentence", "en": "Translation"}
  ]
}`
}

// Generate a mini-lesson before practice
export function generateLessonPrompt(params: {
  topic: GrammarTopic
  level: Level
}): string {
  const { topic, level } = params

  return `You are a friendly German teacher creating a SHORT mini-lesson for a ${level} student.

Topic: ${topic.name_de} (${topic.name_en})
${topic.description_de ? `Description: ${topic.description_de}` : ''}

Create a brief, clear lesson that teaches this grammar concept. The student will practice with questions after reading this.

Requirements:
- Keep it SHORT (1-2 minute read max)
- Use simple German (A2 level) with English translations
- Include 3-4 clear example sentences
- Highlight the KEY RULE in a memorable way
- Mention 1-2 common mistakes to avoid

IMPORTANT: Respond ONLY with valid JSON, no other text.
{
  "title_de": "Lesson title in German",
  "title_en": "Lesson title in English",
  "key_rule_de": "The main rule in ONE simple sentence in German",
  "key_rule_en": "The main rule in English",
  "explanation_de": "Brief explanation in simple German (2-3 sentences)",
  "explanation_en": "Brief explanation in English",
  "examples": [
    {"de": "German example", "en": "English translation", "highlight": "the part that demonstrates the rule"}
  ],
  "common_mistakes": [
    {"wrong": "Common wrong usage", "correct": "Correct usage", "tip_de": "Tip in German", "tip_en": "Tip in English"}
  ],
  "remember_de": "One memorable tip or trick in German",
  "remember_en": "The tip in English"
}`
}

// AI Tutor chat response
export function generateTutorResponsePrompt(params: {
  userQuestion: string
  topic?: GrammarTopic
  currentQuestion?: string
  userAnswer?: string
  wasCorrect?: boolean
  conversationHistory?: { role: 'user' | 'tutor'; message: string }[]
}): string {
  const { userQuestion, topic, currentQuestion, userAnswer, wasCorrect, conversationHistory } = params

  // Build a focused context block
  let contextBlock = ''
  if (topic || currentQuestion || userAnswer !== undefined) {
    contextBlock = `
=== CURRENT EXERCISE CONTEXT ===
${topic ? `Topic: ${topic.name_de} (${topic.name_en})` : ''}
${topic?.description_de ? `What it is: ${topic.description_de}` : ''}
${currentQuestion ? `The question was: "${currentQuestion}"` : ''}
${userAnswer ? `Student answered: "${userAnswer}"` : ''}
${wasCorrect !== undefined ? `Result: ${wasCorrect ? 'CORRECT' : 'INCORRECT'}` : ''}
================================
`
  }

  // Format conversation history clearly
  const historyBlock = conversationHistory?.length ? `
Recent conversation:
${conversationHistory.slice(-6).map(h => `[${h.role.toUpperCase()}]: ${h.message}`).join('\n')}
` : ''

  return `You are a helpful German tutor. A student is practicing German and needs your help.

${contextBlock}
${historyBlock}

STUDENT'S QUESTION: "${userQuestion}"

YOUR TASK:
${currentQuestion && userAnswer !== undefined ? `
The student just ${wasCorrect ? 'correctly answered' : 'got wrong'} an exercise. They are asking about it.
- If they ask "why" or "warum": Explain the grammar rule that applies
- If they got it wrong: Explain what the correct answer should be and why
- Reference the SPECIFIC question and answer above in your explanation
` : `
Answer their question about German grammar clearly and simply.
`}

RULES:
1. Be SPECIFIC to their question - don't give generic answers
2. Use simple German (A2 level) in response_de
3. Give 2-3 helpful examples that illustrate the point
4. Keep it SHORT - max 3-4 sentences per language
5. If they wrote in English, set correction_de to the German translation (so they learn)

Respond with this JSON ONLY:
{
  "correction_de": ${userQuestion.match(/[a-zA-Z]/) && !userQuestion.match(/[äöüßÄÖÜ]/) ? '"Auf Deutsch: [translate their question]"' : 'null'},
  "correction_en": ${userQuestion.match(/[a-zA-Z]/) && !userQuestion.match(/[äöüßÄÖÜ]/) ? '"Try asking in German!"' : 'null'},
  "response_de": "Your answer in simple German",
  "response_en": "Same answer in English",
  "examples": [
    {"de": "Example sentence", "en": "Translation"}
  ]
}`
}

// Post-answer explanation
export function generatePostAnswerExplanationPrompt(params: {
  topic: GrammarTopic
  question: string
  userAnswer: string
  correctAnswer: string
  wasCorrect: boolean
}): string {
  const { topic, question, userAnswer, correctAnswer, wasCorrect } = params

  return `You are a German tutor explaining ${wasCorrect ? 'why an answer is correct' : 'why an answer was wrong and how to fix it'}.

Grammar topic: ${topic.name_de} (${topic.name_en})
Question: ${question}
Correct answer: ${correctAnswer}
Student's answer: ${userAnswer}
Was correct: ${wasCorrect}

${wasCorrect
  ? 'Briefly explain why this is correct and reinforce the grammar rule.'
  : 'Explain why the answer was wrong and teach the correct grammar rule. Be encouraging!'}

Keep it SHORT and helpful. Use simple German (A2 level).

IMPORTANT: Respond ONLY with valid JSON, no other text.
{
  "explanation_de": "Brief explanation in simple German",
  "explanation_en": "Explanation in English",
  "rule_reminder_de": "Quick reminder of the grammar rule in German",
  "rule_reminder_en": "The rule in English",
  "encouragement_de": "${wasCorrect ? 'Praise message' : 'Encouraging message'} in German",
  "encouragement_en": "The encouragement in English"
}`
}
