// ─── Interview Signal Analysis ───
// Extracts question-level signal data for self-improvement

import type { QuestionSignal } from './interview-parameters'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Topic detection keywords for mapping questions to eval dimensions
const TOPIC_KEYWORDS: Record<string, string[]> = {
  problem_clarity: ['problem', 'sorun', 'çözmek', 'solving', 'need', 'ihtiyaç', 'pain', 'acı', 'neden', 'why'],
  ai_nativeness: ['ai', 'yapay zeka', 'machine learning', 'model', 'gpt', 'llm', 'api', 'neural', 'deep learning'],
  technical_depth: ['technical', 'teknik', 'architecture', 'mimari', 'stack', 'build', 'code', 'database', 'infrastructure'],
  market_awareness: ['market', 'pazar', 'customer', 'müşteri', 'competitor', 'rakip', 'pricing', 'revenue', 'business model'],
  founder_energy: ['vision', 'vizyon', 'passion', 'tutku', 'motivation', 'why you', 'background', 'experience', 'neden sen'],
  program_fit: ['program', 'accelerator', 'hızlandırıcı', 'mentor', 'expect', 'beklenti', 'goal', 'hedef'],
}

function detectTopic(questionText: string): string {
  const lower = questionText.toLowerCase()
  let bestTopic = 'general'
  let bestScore = 0

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestTopic = topic
    }
  }

  return bestTopic
}

function calculateAnswerDepth(answer: string): number {
  // Normalize to 0-1 based on several heuristics
  const length = answer.length
  const wordCount = answer.split(/\s+/).length
  const sentenceCount = answer.split(/[.!?]+/).filter(s => s.trim().length > 0).length

  // Length score: 0-1 (caps at ~500 chars for max score)
  const lengthScore = Math.min(length / 500, 1)

  // Detail score: longer sentences suggest more depth
  const avgSentenceLength = wordCount / Math.max(sentenceCount, 1)
  const detailScore = Math.min(avgSentenceLength / 20, 1)

  // Specificity: numbers, technical terms suggest concrete answers
  const hasNumbers = /\d+/.test(answer) ? 0.1 : 0
  const hasSpecificTerms = /(%|users|revenue|customers|müşteri|kullanıcı|gelir|\$|₺)/.test(answer.toLowerCase()) ? 0.1 : 0

  return Math.min(lengthScore * 0.5 + detailScore * 0.3 + hasNumbers + hasSpecificTerms, 1)
}

function detectPhase(questionIndex: number, totalQuestions: number): string {
  const ratio = questionIndex / totalQuestions
  if (ratio < 0.15) return 'warmup'
  if (ratio < 0.35) return 'idea'
  if (ratio < 0.6) return 'ai_depth'
  if (ratio < 0.8) return 'market'
  return 'closing'
}

export function extractQuestionSignals(messages: Message[], evaluation: any): QuestionSignal[] {
  const signals: QuestionSignal[] = []

  // Extract Q&A pairs (assistant asks, user answers)
  const qaPairs: { question: string; answer: string; index: number }[] = []

  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'assistant' && messages[i + 1]?.role === 'user') {
      qaPairs.push({
        question: messages[i].content,
        answer: messages[i + 1].content,
        index: qaPairs.length,
      })
    }
  }

  const totalQuestions = qaPairs.length

  for (const qa of qaPairs) {
    signals.push({
      question_index: qa.index,
      question_text: qa.question.slice(0, 300), // truncate for storage
      topic: detectTopic(qa.question),
      answer_length: qa.answer.length,
      answer_depth: calculateAnswerDepth(qa.answer),
      phase: detectPhase(qa.index, totalQuestions),
    })
  }

  return signals
}

// ─── Aggregate Analysis ───

export interface QuestionEffectiveness {
  topic: string
  avg_answer_depth: number
  times_asked: number
  discrimination: number  // how well this topic differentiates high vs low scorers
}

export function analyzeVariantEffectiveness(
  interviews: Array<{ question_signals: QuestionSignal[]; overall_score: number }>
): QuestionEffectiveness[] {
  // Group signals by topic
  const topicData: Record<string, { depths: number[]; scores: number[] }> = {}

  for (const interview of interviews) {
    if (!interview.question_signals) continue

    for (const signal of interview.question_signals) {
      if (!topicData[signal.topic]) {
        topicData[signal.topic] = { depths: [], scores: [] }
      }
      topicData[signal.topic].depths.push(signal.answer_depth)
      topicData[signal.topic].scores.push(interview.overall_score)
    }
  }

  // Calculate effectiveness per topic
  return Object.entries(topicData).map(([topic, data]) => {
    const avgDepth = data.depths.reduce((a, b) => a + b, 0) / data.depths.length

    // Simple discrimination: correlation between answer depth and overall score
    // Higher = this topic's answer depth predicts final score well
    let discrimination = 0
    if (data.depths.length >= 5) {
      const n = data.depths.length
      const meanDepth = avgDepth
      const meanScore = data.scores.reduce((a, b) => a + b, 0) / n

      let num = 0, denDepth = 0, denScore = 0
      for (let i = 0; i < n; i++) {
        const dDepth = data.depths[i] - meanDepth
        const dScore = data.scores[i] - meanScore
        num += dDepth * dScore
        denDepth += dDepth * dDepth
        denScore += dScore * dScore
      }
      const den = Math.sqrt(denDepth * denScore)
      discrimination = den > 0 ? num / den : 0
    }

    return {
      topic,
      avg_answer_depth: Math.round(avgDepth * 100) / 100,
      times_asked: data.depths.length,
      discrimination: Math.round(discrimination * 100) / 100,
    }
  }).sort((a, b) => Math.abs(b.discrimination) - Math.abs(a.discrimination))
}
