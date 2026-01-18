import { GrammarTopic } from '@/types/database'

export type PlacementQuestionType = 'translate' | 'fill_gap' | 'grammar_choice' | 'error_detection'

export function generatePlacementQuestionPrompt(params: {
  topic: GrammarTopic
  questionType: PlacementQuestionType
  difficulty: number
}): string {
  const { topic, questionType, difficulty } = params

  const difficultyGuide = {
    1: 'Very basic: simple sentences, common vocabulary, single concept',
    2: 'Basic: slightly longer sentences, standard vocabulary',
    3: 'Intermediate: moderate complexity, some subordinate clauses',
    4: 'Upper intermediate: complex structures, less common vocabulary',
    5: 'Advanced: B1 exam level complexity',
  }

  const questionInstructions: Record<PlacementQuestionType, string> = {
    translate: `Create a TRANSLATION question.
- prompt_en: An English sentence to translate
- prompt_de: null (user provides the German)
- correct_answer: The expected German translation
The sentence should test: ${topic.name_en}`,

    fill_gap: `Create a FILL THE GAP question.
- prompt_en: Short instruction like "Fill in the blank"
- prompt_de: A German sentence with ___ for the missing word (e.g. "Ich ___ nach Hause.")
- correct_answer: The missing word (e.g. "gehe")
The missing word should test: ${topic.name_en}`,

    grammar_choice: `Create a GRAMMAR CHOICE question.
- prompt_en: Short instruction
- prompt_de: A German sentence with a blank or underline
- correct_answer: The correct option
- options: Array of 4 choices (one correct, three wrong)
Test: ${topic.name_en}`,

    error_detection: `Create an ERROR DETECTION question.
- prompt_en: "Find and correct the error in this sentence"
- prompt_de: A German sentence WITH A GRAMMATICAL ERROR (e.g. "Ich gehst nach Hause." where "gehst" should be "gehe")
- correct_answer: The CORRECTED sentence (e.g. "Ich gehe nach Hause.")
The error must relate to: ${topic.name_en}`,
  }

  return `You are assessing a German learner's knowledge for a placement test.

${questionInstructions[questionType]}

Requirements:
- Difficulty: ${difficulty}/5 - ${difficultyGuide[difficulty as keyof typeof difficultyGuide]}
- Grammar focus: ${topic.name_de} (${topic.name_en})
- Keep sentences practical and natural
- The question should clearly test understanding of this specific grammar point

IMPORTANT: Respond ONLY with valid JSON, no other text.
{
  "prompt_en": "English instruction or sentence to translate",
  "prompt_de": "German sentence (required for fill_gap and error_detection)",
  "correct_answer": "The expected correct answer",
  "options": ${questionType === 'grammar_choice' ? '["correct", "wrong1", "wrong2", "wrong3"]' : 'null'},
  "hint": "Brief hint",
  "explanation_de": "Simple German explanation",
  "explanation_en": "English explanation"
}`
}

export function evaluatePlacementAnswerPrompt(params: {
  questionType: PlacementQuestionType
  topic: GrammarTopic
  prompt: string
  correctAnswer: string
  userAnswer: string
}): string {
  const { questionType, topic, prompt, correctAnswer, userAnswer } = params

  return `You are evaluating a placement test answer.

Question type: ${questionType}
Grammar focus: ${topic.name_en} (${topic.name_de})
Question: ${prompt}
Expected answer: ${correctAnswer}
User's answer: ${userAnswer}

Evaluate strictly for this placement test. Be fair but precise.
Accept minor typos but not grammar errors for the tested concept.

Respond in JSON:
{
  "is_correct": true/false,
  "is_acceptable": true/false (correct concept but minor variation),
  "feedback_de": "Brief feedback in simple German",
  "feedback_en": "Brief feedback in English"
}`
}
