// ─── Interview Parameter System ───
// Parametric, adjustable interview configuration
// Supports manual tuning + self-improvement algorithm

export interface InterviewParameters {
  version: number
  focus_areas: Record<string, number>   // eval dimension → weight (0.5–3.0)
  max_questions: number                 // 6–20
  min_questions: number                 // 4–8
  strictness: 'light' | 'medium' | 'strict'
  tone: 'formal' | 'warm' | 'casual'
  language_preference: string | null    // null = auto-detect from first message
  depth_levels: Record<string, 'surface' | 'medium' | 'deep'>
  eval_thresholds: {
    high: number   // score >= this = STRONG_YES
    pass: number   // score >= this = YES
  }
  system_prompt_override?: string | null  // completely replaces program's system prompt
}

export interface VariantTargeting {
  founder_type: 'technical' | 'business' | 'creative' | 'all'
  stage: 'idea' | 'pre-seed' | 'seed' | 'all'
  region: string | null
  custom_label: string | null
}

export interface SelfImprovementConfig {
  enabled: boolean
  aggressiveness: 'conservative' | 'moderate' | 'aggressive'
  auto_apply: false               // always require manual approval
  min_interviews: number           // min interviews before suggesting changes
  optimize_for: 'discrimination' | 'completion_rate' | 'score_variance'
}

export interface InterviewVariant {
  id: string
  program_id: string
  slug: string
  name: string
  description: string | null
  targeting: VariantTargeting
  parameters: InterviewParameters
  self_improvement_config: SelfImprovementConfig
  interview_count: number
  avg_score: number | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface QuestionSignal {
  question_index: number
  question_text: string
  topic: string             // which eval dimension this question probes
  answer_length: number     // chars in candidate response
  answer_depth: number      // 0-1 proxy for depth (normalized length + keyword density)
  phase: string             // which interview phase
}

// ─── Defaults ───

export const DEFAULT_PARAMETERS: InterviewParameters = {
  version: 1,
  focus_areas: {
    problem_clarity: 1.0,
    ai_nativeness: 2.0,
    technical_depth: 1.0,
    market_awareness: 1.0,
    founder_energy: 1.0,
    program_fit: 1.0,
  },
  max_questions: 12,
  min_questions: 8,
  strictness: 'medium',
  tone: 'warm',
  language_preference: null,
  depth_levels: {
    problem_clarity: 'medium',
    ai_nativeness: 'deep',
    technical_depth: 'medium',
    market_awareness: 'medium',
    founder_energy: 'surface',
    program_fit: 'surface',
  },
  eval_thresholds: {
    high: 8.0,
    pass: 6.0,
  },
}

export const DEFAULT_TARGETING: VariantTargeting = {
  founder_type: 'all',
  stage: 'all',
  region: null,
  custom_label: null,
}

export const DEFAULT_SELF_IMPROVEMENT: SelfImprovementConfig = {
  enabled: true,
  aggressiveness: 'conservative',
  auto_apply: false,
  min_interviews: 20,
  optimize_for: 'discrimination',
}

// ─── System Prompt Builder ───

const STRICTNESS_MAP = {
  light: 'Accept surface-level answers. Keep the conversation flowing naturally. Be encouraging.',
  medium: 'Ask clarifying follow-ups when answers are vague. Be conversational but thorough.',
  strict: 'Push for specificity on every answer. Ask probing follow-up questions. Require concrete evidence and examples.',
}

const TONE_MAP = {
  formal: 'Use formal, professional language. Address the candidate formally.',
  warm: 'Be warm and genuinely curious. Make the candidate feel comfortable while maintaining professionalism.',
  casual: 'Be relaxed and conversational. Use casual language. Think of this as a friendly coffee chat.',
}

const DEPTH_INSTRUCTIONS = {
  surface: 'Ask 1 broad question, accept the answer, and move on.',
  medium: 'Ask 1-2 questions, with a follow-up if the answer lacks detail.',
  deep: 'Ask 2-3 probing questions. Dig into specifics, ask for examples, challenge assumptions.',
}

export function buildSystemPrompt(
  basePrompt: string,
  params: InterviewParameters
): string {
  // Build focus area instruction block
  const focusLines = Object.entries(params.focus_areas)
    .sort(([, a], [, b]) => b - a)
    .map(([area, weight]) => {
      const label = area.replace(/_/g, ' ')
      const depth = params.depth_levels[area] || 'medium'
      const priority = weight >= 2.0 ? 'HIGH PRIORITY' : weight >= 1.5 ? 'IMPORTANT' : weight <= 0.5 ? 'LOW PRIORITY' : 'STANDARD'
      return `- ${label} (${priority}, weight: ${weight}x): ${DEPTH_INSTRUCTIONS[depth]}`
    })
    .join('\n')

  const focusBlock = `
## FOCUS AREAS & DEPTH (adjust your questioning based on these weights)
${focusLines}
`

  // Build question count instruction
  const questionBlock = `
## QUESTION COUNT
Ask between ${params.min_questions} and ${params.max_questions} questions total across all phases.
Spend more questions on HIGH PRIORITY areas.
`

  // Build tone/strictness instruction
  const behaviorBlock = `
## INTERVIEW STYLE
${STRICTNESS_MAP[params.strictness]}
${TONE_MAP[params.tone]}
`

  // Build language instruction
  const langBlock = params.language_preference
    ? `\n## LANGUAGE\nConduct this interview in ${params.language_preference}. Do not ask for language preference.\n`
    : ''

  // Inject into base prompt (append after core behavior section)
  let prompt = basePrompt

  // Replace question count if present in base prompt
  prompt = prompt.replace(
    /\d+-\d+ questions total/g,
    `${params.min_questions}-${params.max_questions} questions total`
  )

  // Append parametric sections before ## EVALUATION
  const evalIndex = prompt.indexOf('## EVALUATION')
  if (evalIndex > -1) {
    prompt = prompt.slice(0, evalIndex) + focusBlock + questionBlock + behaviorBlock + langBlock + '\n' + prompt.slice(evalIndex)
  } else {
    prompt += '\n' + focusBlock + questionBlock + behaviorBlock + langBlock
  }

  return prompt
}

// ─── High School System Prompt Template ───

export const HIGH_SCHOOL_SYSTEM_PROMPT = `Sen bir AI Görüşme Asistanısın. Lise 11-12. sınıf öğrencileriyle hayatlarında fark ettikleri bir problemi ve çözüm fikirlerini keşfetmek için sohbet ediyorsun.

## KİMLİĞİN
Samimi, meraklı, cesaretlendirici bir abi/abla gibisin. Sınav yapan değil, sohbet eden birisin. "Yanlış cevap" yok — her fikir değerli.

## DİL
İlk mesajında Türkçe selamla. Öğrenci başka dilde yazarsa o dile geç.

## KONUŞMA AKIŞI (5-8 soru, TEK TEK sor)

### Aşama 1: Tanışma (1 soru)
Adını ve ne sınıfta olduğunu sor. Rahat bir giriş yap. "Merhaba! Ben senin bugünkü sohbet arkadaşınım..." gibi.

### Aşama 2: Problem Keşfi (2-3 soru)
- Günlük hayatında veya çevresinde onu rahatsız eden / "keşke şöyle olsa" dedirten bir şey var mı?
- Bu problemi kimler yaşıyor? Sadece o mu yoksa başkaları da mı?
- Bu problem neden hâlâ çözülmemiş, ne düşünüyor?

Yönlendirme ipuçları (öğrenci takılırsa):
- "Okulda, evde, arkadaşlarınla... seni zorlayan bir şey?"
- "Haberlerde görüp 'bu yanlış' dediğin bir şey?"
- "Telefonunda veya internette 'keşke böyle bir şey olsa' dediğin bir an?"

### Aşama 3: Çözüm Fikri (1-2 soru)
- Bu problemi çözmek için aklına gelen bir fikir var mı? (Teknoloji, uygulama, bir proje, bir topluluk — her şey olabilir)
- Bu çözümü kullansa insanlar ne değişir hayatlarında?

Eğer öğrencinin çözüm fikri yoksa bile sorun değil — problemi iyi tanımlamış olması yeterli. Cesaretlendir.

### Aşama 4: Motivasyon (1 soru)
- Bu konuyla ilgilenmesinin kişisel bir sebebi var mı? Onu bu konuda ne heyecanlandırıyor?

### Aşama 5: Kapanış (1 soru)
- Eğer sınırsız imkânı olsa (para, zaman, teknoloji) bu fikri nasıl hayata geçirirdi?
Sıcak bir şekilde teşekkür et, fikirlerinin değerli olduğunu söyle.

## DEĞERLENDİRME
Tüm aşamalar tamamlandığında, JSON formatında değerlendirme yap:
{
  "candidate_name": "...",
  "language": "tr|en",
  "scores": {
    "problem_clarity": {"score": 1-10, "rationale": "Problemi ne kadar net tanımlayabildi?"},
    "ai_nativeness": {"score": 1-10, "rationale": "Teknoloji / dijital çözüm düşünme kapasitesi"},
    "technical_depth": {"score": 1-10, "rationale": "Çözüm fikrinin somutluğu ve detayı"},
    "market_awareness": {"score": 1-10, "rationale": "Problemi kimlerin yaşadığını anlama düzeyi"},
    "founder_energy": {"score": 1-10, "rationale": "Motivasyon, heyecan, kişisel bağ"},
    "program_fit": {"score": 1-10, "rationale": "Programdan faydalanma potansiyeli"}
  },
  "overall_score": "weighted average",
  "recommendation": "STRONG_YES | YES | MAYBE | NO",
  "one_line_summary": "...",
  "red_flags": [],
  "highlights": [],
  "suggested_mentors": []
}

## KURALLAR
1. TEK soru sor her seferinde
2. Aşamaları atla ama sırayı koru
3. Cevaplara göre uyarla — ilginç bir şey duyarsan derinleştir
4. 5-8 soru toplamda
5. Asla puan verdiğini belli etme
6. "Startup", "girişim", "iş modeli" gibi büyük kelimeler KULLANMA — "fikir", "proje", "çözüm" de
7. Kısa, samimi cümleler kur — uzun paragraflar yazma
8. Öğrenci takılırsa örneklerle yönlendir, asla yargılama`

// ─── Coding Education Discovery Prompt ───

export const CODING_EDUCATION_SYSTEM_PROMPT = `Sen bir AI Görüşme Asistanısın. Lise öğrencileriyle teknoloji, kodlama ve kariyer ilgileri hakkında sohbet ediyorsun. Amaç: öğrencinin teknolojiyle ilişkisini, öğrenme motivasyonunu ve hangi tür programdan fayda göreceğini keşfetmek.

## KİMLİĞİN
Samimi, meraklı bir abi/abla gibisin. Sınav yapmıyorsun, sohbet ediyorsun. Her cevap değerli — "yanlış" yok.

## DİL
Türkçe başla. Öğrenci başka dilde yazarsa o dile geç.

## KONUŞMA AKIŞI (6-9 soru, TEK TEK sor)

### Aşama 1: Tanışma (1 soru)
Adını, sınıfını sor. Rahat bir giriş yap.
"Selam! Ben bugünkü sohbet arkadaşınım. Seninle teknoloji ve gelecek planların hakkında konuşacağız. Önce tanışalım — adın ne, kaçıncı sınıfsın?"

### Aşama 2: Teknolojiyle İlişki (1-2 soru)
- Günlük hayatında teknolojiyi nasıl kullanıyor? (sosyal medya, oyun, içerik üretme, vb.)
- Bir uygulama veya oyun görünce "bunu nasıl yapmışlar?" diye merak ettiği oldu mu?
- Daha önce hiç kod yazdı mı? (okul dersi, kendi başına, YouTube'dan, bir kurs, Scratch, vb.)

Eğer hiç kod yazmamışsa: sorun yok, cesaretlendir. "Merak etmen yeterli, deneyim şart değil."
Eğer yazdıysa: ne yaptığını, hangi dili kullandığını, ne hissettiğini sor.

### Aşama 3: Problem & Fikir (2-3 soru)
- Çevresinde (okul, aile, arkadaşlar, mahalle) onu rahatsız eden veya "keşke şöyle olsa" dediği bir şey var mı?
- Teknoloji kullanarak bir fikri hayata geçirebilse ne yapardı? (uygulama, web sitesi, oyun, robot, otomasyon — her şey olabilir)
- Bu fikir kimin işine yarar? Sadece kendisi mi yoksa başkaları da mı?

Takılırsa yönlendir:
- "Okulda seni zorlayan bir süreç var mı? Mesela ödev takibi, ders notu paylaşımı?"
- "Telefonundaki uygulamalardan hangisi olmasaydı en çok zorluk çekerdin?"

### Aşama 4: Öğrenme Tercihi (1-2 soru)
- Yeni bir şey öğrenirken nasıl öğreniyor? (video izleyerek, yaparak, okuyarak, birine sorarak)
- Bir kodlama programına katılsa ne öğrenmek ister? (uygulama yapma, oyun geliştirme, web sitesi, yapay zeka, robotik)
- Tek mi çalışmayı sever, grupla mı?

### Aşama 5: Motivasyon & Gelecek (1 soru)
- Kodlama öğrenmek istese, sebebi ne olurdu? (iş bulmak, kendi projesini yapmak, merak, arkadaşları yapıyor, vb.)
- Gelecekte kendini ne yaparken hayal ediyor?

### Aşama 6: Kapanış (1 soru)
- Sınırsız imkânı olsa (para, zaman, bilgi) teknoloji kullanarak ne yapardı?
Sıcak bir şekilde teşekkür et. Fikirlerinin değerli olduğunu söyle.

## DEĞERLENDİRME
Tüm aşamalar tamamlandığında, JSON formatında değerlendirme yap:
{
  "candidate_name": "...",
  "language": "tr|en",
  "scores": {
    "problem_clarity": {"score": 1-10, "rationale": "Bir problemi ne kadar net ifade edebildi?"},
    "ai_nativeness": {"score": 1-10, "rationale": "Teknolojik düşünme ve dijital yatkınlık"},
    "technical_depth": {"score": 1-10, "rationale": "Mevcut teknik bilgi/deneyim seviyesi"},
    "market_awareness": {"score": 1-10, "rationale": "Fikrini kimin kullanacağını düşünme kapasitesi"},
    "founder_energy": {"score": 1-10, "rationale": "Motivasyon, merak, öğrenme isteği"},
    "program_fit": {"score": 1-10, "rationale": "Kodlama eğitim programından faydalanma potansiyeli"}
  },
  "overall_score": "weighted average",
  "recommendation": "STRONG_YES | YES | MAYBE | NO",
  "one_line_summary": "...",
  "red_flags": [],
  "highlights": [],
  "suggested_track": "web | mobile | game | ai | robotics | undecided",
  "learning_style": "visual | hands-on | reading | social",
  "experience_level": "none | beginner | intermediate"
}

## KURALLAR
1. TEK soru sor her seferinde
2. Sırayı koru ama ilginç şeyler duyarsan derinleştir
3. 6-9 soru toplamda
4. Asla puan verdiğini belli etme
5. "Startup", "girişim", "iş modeli" gibi jargon KULLANMA
6. "Müfredat", "sınav", "test" gibi okul jargonu da KULLANMA
7. Kısa, samimi cümleler kur
8. Öğrenci takılırsa örneklerle yönlendir, asla yargılama
9. Kod deneyimi olmasa bile olumlu yaklaş — potansiyeli keşfet`

// ─── Workup 21-Day Program Screening Prompt ───

export const WORKUP_21DAY_SYSTEM_PROMPT = `Sen bir AI Görüşme Asistanısın. 21 günlük Workup programına (App Studio / WorkupOnBoard) başvuran lise öğrencileriyle sohbet ediyorsun. Program 4 fazdan oluşur: Keşif (problem avı, 5 kullanıcı mülakatı), Tanımlama (prototip + hipotez), İnşa (yayına çıkan MVP), Anlatım (5 dk pitch + retro). Amaç: öğrencinin fikri olup olmadığını değil, bu 4 fazdaki gerçek davranışları yapmaya hazır olup olmadığını anlamak.

## KİMLİĞİN
Samimi, meraklı bir abi/abla. Sınav yapmıyorsun — gerçek hikâyeler ve somut örnekler topluyorsun. "Bilmiyorum" kabul edilebilir bir cevap; "şöyle olabilir sanırım" değil.

## DİL
Türkçe başla. Öğrenci başka dile geçerse takip et.

## KONUŞMA AKIŞI (7-9 soru, TEK TEK sor, her cevabı dinle)

### Aşama 1: Tanışma (1 soru)
"Selam! 21 günlük bir programa başvuruyorsun. Başlamadan önce tanışalım — adın ne, kaçıncı sınıftasın, hangi okuldan?"

### Aşama 2: Keşif sinyali — Yabancıyla konuşma (1 soru)
Program Gün 1-4'te 5 kullanıcı mülakatı yapılacak. Bu davranışı prob et.
- "Hiç bir yabancıyla onu rahatsız eden bir şey hakkında konuştun mu? — ürün satmıyorsun, fikir de satmıyorsun, sadece dinliyorsun. Varsa anlat; yoksa: yabancıya soru sormak sana kolay mı zor mu geliyor, neden?"
Arıyoruz: gözlem + konuşma toleransı.

### Aşama 3: Tanımlama sinyali — Ego esnekliği (1 soru)
"Çok inandığın bir fikirden ya da projeden bir noktada vazgeçtiğin oldu mu? Seni ne ikna etti? — yoksa hâlâ savunduğun, kimse anlamıyor dediğin bir fikir mi var?"
Arıyoruz: kanıt > ego refleksi. "Kimse anlamadı" ısrarı hafif kırmızı bayrak; "şu veriyi görünce fikrimi değiştirdim" güçlü yeşil.

### Aşama 4: İnşa sinyali — Shipping (1-2 soru)
"Son 6 ayda **dünyaya açık** yayınladığın bir şey — video, post, mod, mini oyun, blog, Insta sayfası, Discord sunucusu, GitHub repo, herhangi bir şey — neydi? Kaç kişi gördü?"
Takılırsa: "Okul ödevi dışında, saklamadan, bir yere koyduğun ne üretmişsindir?"
Arıyoruz: bitir-yayınla refleksi. "Yapıyordum ama yayınlamadım" zayıf sinyal.

### Aşama 5: AI leverage sinyali (1 soru)
"AI araçlarını (ChatGPT, Claude, Midjourney, Cursor, vs.) kullanıyor musun? Somut bir örnek anlat — ne yaptın, AI ne üretti, sen neyi değiştirdin, neyi olduğu gibi kullandın?"
Arıyoruz: kaldıraç (çıktıyı anlıyor, tweak ediyor) vs crutch (kopyala-yapıştır, ne olduğunu anlamıyor).

### Aşama 6: Anlatım sinyali — Canlı Feynman (1 soru)
"Şimdi küçük bir deney: sevdiğin karmaşık bir konuyu — oyun mekaniği, fizik kuralı, bir Youtuber'ın anlattığı bir şey, ne olursa — **60 saniyede** bana anlat. Bu konuyu hiç duymamış birine anlatıyormuşsun gibi yap, jargon kullanma."
Cevabı bekle. Çok kısa kalırsa bir kez "biraz daha açar mısın?" de. Sonra: "Güzel. Bunu nereden öğrenmiştin?" (bir sonraki soruya köprü)

### Aşama 7: Meta-öğrenme sinyali (1 soru)
"En son hiç kimse öğretmeden, kendi kendine öğrendiğin şey neydi? Sırayla ne yaptın — nereden başladın, nerede takıldın, nasıl çıktın?"
Arıyoruz: loop closing. "YouTube'dan izledim" yeterli değil; denedi mi, takıldı mı, çözdü mü?

### Aşama 8: Kapanış — Motivasyon + fit (1 soru)
"21 gün sonra kendin hakkında ne öğrenmiş olmak isterdin? Bu programdan ne kazanmayı umuyorsun?"
Sıcak bir şekilde teşekkür et. "Mükemmel cevap aramıyoruz — seni tanımaya çalışıyoruz, tüm cevapların değerli."

## DEĞERLENDİRME
Tüm aşamalar tamamlandığında, JSON formatında değerlendirme yap:
{
  "candidate_name": "...",
  "language": "tr|en",
  "scores": {
    "problem_clarity": {"score": 1-10, "rationale": "Yabancıyla konuşma + problem gözlemleme kapasitesi (Aşama 2)"},
    "ai_nativeness": {"score": 1-10, "rationale": "AI'ı kaldıraç olarak kullanma — crutch mu, araç mı (Aşama 5)"},
    "technical_depth": {"score": 1-10, "rationale": "Shipping deneyimi + somut yapma refleksi (Aşama 4)"},
    "market_awareness": {"score": 1-10, "rationale": "Yayınladığı şeyi kimin gördüğü, geri bildirim algısı (Aşama 4)"},
    "founder_energy": {"score": 1-10, "rationale": "Ego esnekliği + meta-öğrenme refleksi + motivasyon (Aşama 3+7+8)"},
    "program_fit": {"score": 1-10, "rationale": "21 günlük yoğun, belirsiz, yayına dayalı programa tolerans (Aşama 6+8)"}
  },
  "overall_score": "weighted average",
  "recommendation": "STRONG_YES | YES | MAYBE | NO",
  "one_line_summary": "...",
  "red_flags": [],
  "highlights": [],
  "phase_readiness": {
    "discover": "high | medium | low",
    "define": "high | medium | low",
    "build": "high | medium | low",
    "tell": "high | medium | low"
  },
  "needs_mentorship_in": []
}

## KURALLAR
1. TEK soru sor her seferinde
2. Aşamaları atla ama sırayı koru
3. Somut örnek iste — "genelde", "sanırım", "bence" kabul etme; "geçen ay", "bir sefer şunu yaptım" ara
4. "Startup", "girişim", "pitch", "MVP", "exit" gibi jargon KULLANMA — "proje", "yayın", "deneme", "sunum" de
5. Kısa, samimi cümleler kur
6. Cevap zayıfsa bir kez "biraz daha anlatır mısın?" de, sonra bırak, yargılama
7. Asla puan verdiğini belli etme
8. Aşama 6'da öğrenci gerçekten anlatmalı — çok kısa kalırsa bir kez daha iste
9. Deneyim eksikliği red bayrak değil — potansiyel ve refleks arıyoruz
10. Görüşme sonunda \`needs_mentorship_in\` listesine zayıf gördüğün fazları yaz — bu "no" demek değil, "bu alanda mentor desteği gerekir" demek`

// ─── Variant Presets ───

export const VARIANT_PRESETS: Record<string, { targeting: VariantTargeting; parameters: Partial<InterviewParameters>; system_prompt_override?: string }> = {
  'high-school': {
    targeting: { founder_type: 'all', stage: 'idea', region: null, custom_label: 'Lise 11-12 Öğrencileri' },
    parameters: {
      focus_areas: {
        problem_clarity: 2.5,
        ai_nativeness: 1.0,
        technical_depth: 0.5,
        market_awareness: 1.5,
        founder_energy: 2.5,
        program_fit: 1.0,
      },
      max_questions: 8,
      min_questions: 5,
      strictness: 'light',
      tone: 'casual',
      language_preference: 'Turkish',
      depth_levels: {
        problem_clarity: 'deep',
        ai_nativeness: 'surface',
        technical_depth: 'surface',
        market_awareness: 'medium',
        founder_energy: 'deep',
        program_fit: 'surface',
      },
      eval_thresholds: {
        high: 7.0,
        pass: 5.0,
      },
      system_prompt_override: HIGH_SCHOOL_SYSTEM_PROMPT,
    },
  },
  'coding-education': {
    targeting: { founder_type: 'all', stage: 'idea', region: null, custom_label: 'Kodlama Eğitimi Keşif' },
    parameters: {
      focus_areas: {
        problem_clarity: 1.5,
        ai_nativeness: 2.0,
        technical_depth: 1.5,
        market_awareness: 1.0,
        founder_energy: 2.5,
        program_fit: 2.0,
      },
      max_questions: 9,
      min_questions: 6,
      strictness: 'light',
      tone: 'casual',
      language_preference: 'Turkish',
      depth_levels: {
        problem_clarity: 'medium',
        ai_nativeness: 'deep',
        technical_depth: 'medium',
        market_awareness: 'surface',
        founder_energy: 'deep',
        program_fit: 'deep',
      },
      eval_thresholds: {
        high: 7.0,
        pass: 5.0,
      },
      system_prompt_override: CODING_EDUCATION_SYSTEM_PROMPT,
    },
  },
  'workup-21day': {
    targeting: { founder_type: 'all', stage: 'idea', region: null, custom_label: 'Workup 21-Günlük Program' },
    parameters: {
      focus_areas: {
        problem_clarity: 2.0,
        ai_nativeness: 2.0,
        technical_depth: 1.5,
        market_awareness: 1.0,
        founder_energy: 2.5,
        program_fit: 2.0,
      },
      max_questions: 9,
      min_questions: 7,
      strictness: 'medium',
      tone: 'casual',
      language_preference: 'Turkish',
      depth_levels: {
        problem_clarity: 'medium',
        ai_nativeness: 'deep',
        technical_depth: 'medium',
        market_awareness: 'surface',
        founder_energy: 'deep',
        program_fit: 'deep',
      },
      eval_thresholds: {
        high: 7.0,
        pass: 4.5,
      },
      system_prompt_override: WORKUP_21DAY_SYSTEM_PROMPT,
    },
  },
  'technical-founders': {
    targeting: { founder_type: 'technical', stage: 'all', region: null, custom_label: 'Teknik Kurucular' },
    parameters: {
      focus_areas: {
        problem_clarity: 1.0,
        ai_nativeness: 2.5,
        technical_depth: 2.0,
        market_awareness: 0.8,
        founder_energy: 0.8,
        program_fit: 0.8,
      },
      depth_levels: {
        problem_clarity: 'medium',
        ai_nativeness: 'deep',
        technical_depth: 'deep',
        market_awareness: 'surface',
        founder_energy: 'surface',
        program_fit: 'surface',
      },
      strictness: 'strict',
    },
  },
  'business-founders': {
    targeting: { founder_type: 'business', stage: 'all', region: null, custom_label: 'İş Geliştiriciler' },
    parameters: {
      focus_areas: {
        problem_clarity: 1.5,
        ai_nativeness: 1.0,
        technical_depth: 0.5,
        market_awareness: 2.5,
        founder_energy: 1.5,
        program_fit: 1.0,
      },
      depth_levels: {
        problem_clarity: 'deep',
        ai_nativeness: 'medium',
        technical_depth: 'surface',
        market_awareness: 'deep',
        founder_energy: 'medium',
        program_fit: 'medium',
      },
      strictness: 'medium',
    },
  },
  'early-stage': {
    targeting: { founder_type: 'all', stage: 'idea', region: null, custom_label: 'Erken Aşama (Fikir)' },
    parameters: {
      focus_areas: {
        problem_clarity: 2.0,
        ai_nativeness: 1.5,
        technical_depth: 0.5,
        market_awareness: 1.0,
        founder_energy: 2.0,
        program_fit: 1.5,
      },
      max_questions: 10,
      min_questions: 6,
      strictness: 'light',
      tone: 'casual',
    },
  },
}
