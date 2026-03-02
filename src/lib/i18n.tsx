'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Lang = 'tr' | 'en'

interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  lang: 'tr',
  setLang: () => {},
  t: (key: string) => key,
})

export function useLanguage() {
  return useContext(I18nContext)
}

// Language toggle component
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage()
  return (
    <div className={`flex items-center bg-[#0D1117] border border-[#30363D] rounded-full p-0.5 ${className}`}>
      <button
        onClick={() => setLang('tr')}
        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
          lang === 'tr'
            ? 'bg-[#58A6FF] text-[#0D1117]'
            : 'text-[#8B949E] hover:text-[#E6EDF3]'
        }`}
      >
        TR
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
          lang === 'en'
            ? 'bg-[#58A6FF] text-[#0D1117]'
            : 'text-[#8B949E] hover:text-[#E6EDF3]'
        }`}
      >
        EN
      </button>
    </div>
  )
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('tr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('stealthworks-lang') as Lang | null
    if (saved === 'tr' || saved === 'en') {
      setLangState(saved)
    }
    setMounted(true)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('stealthworks-lang', l)
  }

  const t = (key: string): string => {
    const dict = lang === 'tr' ? translations.tr : translations.en
    return (dict as Record<string, string>)[key] || key
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

// ─── TRANSLATIONS ────────────────────────────────────────────────────────────

const translations = {
  tr: {
    // ── Common ──
    'common.login': 'Giriş Yap',
    'common.signup': 'Kayıt Ol',
    'common.createProgram': 'Program Oluştur',
    'common.results': 'Sonuçlar',
    'common.dashboard': 'Dashboard',
    'common.program': 'Program',
    'common.demo': 'Demo',
    'common.exportJson': 'JSON İndir',
    'common.loading': 'Yükleniyor...',
    'common.score': 'puan',
    'common.close': 'Kapat',

    // ── Landing / Nav ──
    'nav.login': 'Giriş Yap',
    'nav.create': 'Program Oluştur',
    'nav.myPrograms': 'Programlarım',
    'nav.logout': 'Çıkış Yap',
    'nav.dashboard': 'Dashboard',
    'nav.results': 'Sonuçlar',
    'nav.program': 'Program',

    // ── Landing / Hero ──
    'hero.badge': 'Uçtan Uca AI Pipeline',
    'hero.title1': 'Startup Hızlandırıcılar',
    'hero.title2': 'için',
    'hero.title3': 'AI İşletim Sistemi',
    'hero.subtitle': "Başvurudan Demo Day'e — her adım AI ajanları ile. Mülakatlar, jüri değerlendirmesi, müzakere, kararlar, mentorluk ve program yönetimi tek platformda.",
    'hero.cta': 'Program Oluştur',
    'hero.demo': 'Demo Başlat',

    // ── Landing / Stats ──
    'stats.agents': 'AI Ajan',
    'stats.jury': 'Jüri Üyesi',
    'stats.mentors': 'Mentor',
    'stats.weeks': 'Hafta Program',

    // ── Landing / Pipeline ──
    'pipeline.section': '// PIPELINE',
    'pipeline.title': 'Altı AI destekli aşama.',
    'pipeline.titleGray': 'Sıfır manuel iş.',
    'pipeline.clickHint': 'Detay için tıklayın',
    'pipeline.howItWorks': 'NASIL ÇALIŞIR',
    'pipeline.features': 'TEMEL ÖZELLİKLER',
    'pipeline.output': 'ÇIKTI',
    'pipeline.agents0': 'AI ADAY PROFİLLERİ',
    'pipeline.agents1': 'JÜRİ ÜYELERİ',
    'pipeline.agents4': 'MENTOR PANELİ',
    'pipeline.agentsDefault': 'AJANLAR',

    // Pipeline stage titles
    'stage.0.title': 'AI Mülakatlar',
    'stage.0.desc': '6 benzersiz AI aday profili ile adaptif görüşmeler. Çok dilli, gerçek zamanlı değerlendirme.',
    'stage.0.subtitle': 'Her adaya uyum sağlayan konuşma yapay zekası',
    'stage.0.howItWorks': 'Her adayın farklı geçmiş, uzmanlık seviyesi ve iletişim tarzına sahip benzersiz bir AI kişiliği vardır. AI mülakatçı, yanıtlara göre takip soruları sorarak adaptif 10 dakikalık görüşmeler yürütür. Mülakatlar paralel çalışır — 6 aday eş zamanlı değerlendirilebilir.',
    'stage.0.features': 'Çok dilli destek (TR/EN)|Yanıtlara göre adaptif sorular|Gerçek zamanlı transkript|Yapılandırılmış puanlarla otomatik değerlendirme|Güvenilir çalışma için adım bazlı API',
    'stage.0.output': '6 boyutta puanlarla yapılandırılmış değerlendirme, öneri (STRONG_YES → NO), öne çıkanlar ve kırmızı bayraklar',
    'stage.0.agents': '🚀|Ayşe Demir|Güçlü teknik kurucu (DeepMind geçmişi);;💡|Kerem Yılmaz|Yaratıcı ürün düşünürü (tasarım → teknoloji);;📊|Mehmet Kaya|Veri odaklı iş kurucusu;;🌍|Elif Arslan|Etki odaklı sosyal girişimci;;🎯|Can Öztürk|Satış odaklı girişimci;;🔬|Zeynep Aydın|Derin teknoloji araştırmacısı',

    'stage.1.title': 'Uzman Jüri',
    'stage.1.desc': '3 AI jüri üyesi her mülakatı teknik, iş ve vizyon perspektiflerinden bağımsız değerlendirir.',
    'stage.1.subtitle': 'Üç perspektiften bağımsız uzman değerlendirmesi',
    'stage.1.howItWorks': 'Tamamlanan her mülakat, farklı değerlendirme perspektifine sahip 3 AI jüri üyesi tarafından incelenir. Tam transkripti okur ve bağımsız puanlar üretirler — bu aşamada hiçbir jüri üyesi diğerinin değerlendirmesini görmez. Bu, grup düşüncesini önler ve çeşitli bakış açıları sağlar.',
    'stage.1.features': 'Bağımsız değerlendirme (çapraz etki yok)|Jüri uzmanlığına göre ağırlıklı puanlama|Her puan için gerekçeli yapılandırılmış çıktı|Kırmızı bayrak ve öne çıkanların tespiti|Jüri üyesi başına tek satır özet',
    'stage.1.output': 'Aday başına 3 bağımsız değerlendirme, her biri puanlar, öneri, temel endişeler ve öne çıkanlar ile',
    'stage.1.agents': '🔬|Dr. Zeynep Akar|Teknik Değerlendirici — AI derinliği, mimari, savunulabilirlik;;📊|Ahmet Çelik|İş Değerlendirici — pazar farkındalığı, PMF, traction;;🌟|Selin Yıldırım|Vizyon Değerlendirici — kurucu enerjisi, hırs, program uyumu',

    'stage.2.title': 'Müzakere',
    'stage.2.desc': 'Jüri üyeleri birbirlerinin değerlendirmelerini inceler, tartışır ve konsensüse ulaşır — tıpkı gerçek bir seçim komitesi gibi.',
    'stage.2.subtitle': 'AI destekli konsensüs oluşturma',
    'stage.2.howItWorks': "Bağımsız değerlendirmelerden sonra her jüri üyesi diğer iki üyenin değerlendirmelerini görür. Fikirlerini değiştirebilir, puanları düzeltebilir ve nihai pozisyonları için gerekçe sunabilirler. Bu, gerçek dünya seçim komitesi dinamiklerini taklit eder.",
    'stage.2.features': 'Tüm jüri değerlendirmelerinin çapraz incelemesi|Gerekçeli puan düzeltmesi|Fikir değişikliği takibi|Orijinal vs. nihai puan karşılaştırması|Jüri genelinde konsensüs analizi',
    'stage.2.output': 'Jüri üyesi başına orijinal → nihai puanları, fikir değişikliği ve detaylı gerekçeyi gösteren müzakere notları',

    'stage.3.title': 'Akıllı Kararlar',
    'stage.3.desc': 'Müzakere sonrası puanlara ve yapılandırılabilir eşiklere dayalı veri odaklı KABUL / YEDEK / RED kararları.',
    'stage.3.subtitle': 'Tam şeffaflıkla eşik bazlı kararlar',
    'stage.3.howItWorks': 'Karar motoru müzakere sonrası nihai puanları toplar (müzakere yapılmamışsa jüri ortalamalarına döner). Adaylar puana göre sıralanır ve yapılandırılabilir eşiklerle sınıflandırılır: ≥7 = KABUL, 5-6.9 = YEDEK, <5 = RED. Her karar, bireysel jüri puanlarına ve müzakere notlarına kadar izlenebilir.',
    'stage.3.features': 'Yapılandırılabilir puan eşikleri|Müzakere sonrası puanları kullanır|Gerekirse jüri ortalamasına geri dönüş|Mülakattan karara tam denetim izi|Tüm kohort için toplu işleme',
    'stage.3.output': 'Aday başına nihai puanla KABUL / YEDEK / RED kararı, programdaki tüm değerlendirilen mülakatlar için uygulanır',

    'stage.4.title': 'Mentor Eşleştirme',
    'stage.4.desc': '5 uzman mentor, kurucuların zayıf alanlarına göre otomatik eşleştirilir. Kişiselleştirilmiş 8 haftalık yol haritaları.',
    'stage.4.subtitle': 'Akıllı mentor-kurucu eşleştirmesi',
    'stage.4.howItWorks': 'Kabul edilen her kurucu, en zayıf alanını (jüri değerlendirmelerinden belirlenen) en iyi ele alan mentorla eşleştirilir. Mentor daha sonra belirli kilometre taşları, odak alanları ve ilk hafta görevleri ile kişiselleştirilmiş 8 haftalık bir yol haritası oluşturur. Program Yöneticisi eşleştirmeyi denetler ve ek notlar sağlar.',
    'stage.4.features': 'Zayıf alan bazlı eşleştirme algoritması|Kurucu başına kişiselleştirilmiş 8 haftalık yol haritası|İlk hafta görev atamaları|Program Yöneticisi gözetimi|Odak alanı belirleme',
    'stage.4.output': 'Her kabul edilen kurucu için mentor ataması, hoş geldin mesajı, 8 haftalık yol haritası, odak alanları ve ilk hafta görevleri',
    'stage.4.agents': "🚀|Aylin Güneş|AI-native startup kurucu ortağı — Teknik mentor;;🤖|Berk Aydın|AI agent altyapı kurucu ortağı (YC) — Ürün mentoru;;💰|Canan Korkmaz|Melek yatırımcı (30+ yatırım) — PMF uzmanı;;📈|Deniz Ertürk|VC Partneri — Yatırım & büyüme;;🎓|Prof. Elif Şahin|Boğaziçi CS + Fortune 500 — Strateji",

    'stage.5.title': 'Demo Day',
    'stage.5.desc': "Kickoff'tan Demo Day'e tam program yürütme. Yatırımcı özetleri, pitch hazırlık puanları, mezuniyet raporları.",
    'stage.5.subtitle': "Kickoff'tan mezuniyete tek tıkla",
    'stage.5.howItWorks': "8 haftalık program üç ana kontrol noktasıyla simüle edilir. Demo Day'de (Hafta 8) mentorlar yatırımcı tavsiye mektupları yazar, pitch hazırlığını değerlendirir (1-10) ve temel metrikleri derler. Program Yöneticisi mezuniyet durumunu belirler: Onur ile Mezun, Mezun veya Uzatma Gerekli.",
    'stage.5.features': 'Mentor tavsiye mektupları|Pitch hazırlık puanlaması (1-10)|Yatırımcıya hazır özetler|Temel metrik derleme|Mezuniyet durumu belirleme|Program sonrası adımlar',
    'stage.5.output': 'Mentor tavsiyesi, pitch hazırlığı, yatırımcı özeti, temel metrikler, mezuniyet durumu ve sonraki adımlarla Demo Day raporu',
    'stage.5.agents': '👩‍💼|İrem Başaran|Program Direktörü — Tüm aşamaları yönetir',

    // ── Landing / Audience ──
    'audience.section': '// KİMLER İÇİN',
    'audience.title': 'StealthWorks kimler için?',
    'audience.0.title': 'Hızlandırıcılar',
    'audience.0.desc': 'Tüm seçim ve program yürütme sürecinizi otomatikleştirin',
    'audience.1.title': 'VC & Melekler',
    'audience.1.desc': 'AI destekli mülakatlar ve uzman değerlendirmesiyle deal flow tarayın',
    'audience.2.title': 'Üniversite Kuluçkaları',
    'audience.2.desc': 'Ekibinizi büyütmeden startup programınızı ölçeklendirin',
    'audience.3.title': 'Kurumsal İnovasyon',
    'audience.3.desc': 'İç girişimleri ve iç girişimcileri sistematik olarak değerlendirin',

    // ── Landing / How It Works ──
    'howItWorks.section': '// NASIL ÇALIŞIR',
    'howItWorks.title': 'Üç adımda başlayın',
    'howItWorks.step1.title': 'Programınızı Oluşturun',
    'howItWorks.step1.desc': 'Kaydolun, hızlandırıcınızı adlandırın, AI mülakatçı komutunu ve değerlendirme kriterlerini özelleştirin. 5 dakika sürer.',
    'howItWorks.step2.title': 'Simülasyonu Çalıştırın',
    'howItWorks.step2.desc': "Tam pipeline'ı çalıştırmak için Demo'ya tıklayın — AI adaylar, jüri değerlendirmesi, müzakere, kararlar, mentorluk ve Demo Day — tek tıkla.",
    'howItWorks.step3.title': 'Sonuçları İnceleyin',
    'howItWorks.step3.desc': 'Kohort analitiği, mentor raporları, pitch hazırlık puanları ve yatırımcı özetlerini keşfedin. Verileri dışa aktarın veya panoyu ekibinizle paylaşın.',

    // ── Landing / CTA ──
    'cta.title1': 'Tam',
    'cta.title2': "pipeline'ı",
    'cta.title3': 'çalışırken görmeye hazır mısınız?',
    'cta.subtitle': "Bir program oluşturun ve tek tıkla demoyu çalıştırın. Başvurudan Demo Day'e 5 dakikada.",
    'cta.button': 'Ücretsiz Başlayın',

    // ── Landing / Footer ──
    'footer.text': 'StealthWorks 2026 — Startup Hızlandırıcıları için AI İşletim Sistemi',

    // ── Auth ──
    'auth.login': 'Giriş Yap',
    'auth.signup': 'Kayıt Ol',
    'auth.email': 'E-posta',
    'auth.password': 'Şifre',
    'auth.loginBtn': 'Giriş Yap',
    'auth.signupBtn': 'Kayıt Ol',
    'auth.googleBtn': 'Google ile Devam Et',
    'auth.switchToSignup': 'Hesabınız yok mu?',
    'auth.switchToLogin': 'Zaten hesabınız var mı?',
    'auth.checkEmail': 'Onay linki için e-postanızı kontrol edin.',

    // ── Create ──
    'create.title': 'Program Oluştur',
    'create.nameLabel': 'Program Adı',
    'create.namePlaceholder': 'ör. AI Startup Hızlandırıcı 2025',
    'create.descLabel': 'Açıklama',
    'create.descPlaceholder': 'Programınızı kısaca tanımlayın...',
    'create.promptLabel': 'Mülakat Sistem Komutu',
    'create.promptPlaceholder': 'AI mülakatçı için sistem komutunu yazın...',
    'create.submitBtn': 'Program Oluştur',
    'create.creating': 'Oluşturuluyor...',

    // ── My Programs ──
    'myPrograms.title': 'Programlarım',
    'myPrograms.loading': 'Programlar yükleniyor...',
    'myPrograms.empty': 'Henüz programınız yok',
    'myPrograms.createFirst': 'İlk programınızı oluşturun',

    // ── Program Landing (slug page) ──
    'programLanding.applicationsOpen': 'Başvurular Açık',
    'programLanding.startInterview': 'AI Mülakatını Başlat',
    'programLanding.journey': 'Başvurudan Yatırıma',
    'programLanding.step1': 'AI Mülakat',
    'programLanding.step1desc': '10 dk adaptif görüşme',
    'programLanding.step2': 'Jüri Değerlendirmesi',
    'programLanding.step2desc': '3 uzman bağımsız değerlendirir',
    'programLanding.step3': 'Kabul Kararı',
    'programLanding.step3desc': 'Veri odaklı seçim',

    // ── Interview ──
    'interview.loading': 'Yükleniyor...',
    'interview.notFound': 'Program Bulunamadı',
    'interview.notFoundDesc': 'programı bulunamadı.',
    'interview.title': 'Mülakatı',
    'interview.welcome': 'AI destekli mülakata hoş geldiniz. Mülakat yaklaşık 10 dakika sürer.',
    'interview.start': 'Mülakatı Başlat',
    'interview.placeholder': 'Cevabınızı yazın...',
    'interview.agent': 'Mülakat Ajanı',
    'interview.failStart': 'Mülakat başlatılamadı. Lütfen tekrar deneyin.',
    'interview.failSend': 'Mesaj gönderilemedi. Lütfen tekrar deneyin.',
    'interview.complete': 'Mülakat Tamamlandı',
    'interview.evalReport': '// DEĞERLENDİRME RAPORU',
    'interview.highlights': 'ÖNE ÇIKANLAR',
    'interview.redFlags': 'UYARI İŞARETLERİ',
    'interview.overallScore': 'GENEL PUAN (ai_nativeness 2x ağırlıklı)',
    'interview.phase1': 'Aşama 1: Karşılama',
    'interview.phase2': 'Aşama 2: Fikir',
    'interview.phase3': 'Aşama 3: AI Derinliği',
    'interview.phase4': 'Aşama 4: Pazar',
    'interview.phase5': 'Aşama 5: Vizyon',
    'interview.phase5b': 'Aşama 5: Kapanış',

    // ── Dashboard ──
    'dashboard.loading': 'Dashboard yükleniyor...',
    'dashboard.subtitle': 'Jüri Paneli — Mülakat Değerlendirmeleri',
    'dashboard.testAgents': 'Test Ajanları',
    'dashboard.jury': 'Jüri',
    'dashboard.deliberate': 'Tartışma',
    'dashboard.deliberating': 'Tartışılıyor...',
    'dashboard.decide': 'Karar Ver',
    'dashboard.deciding': 'Karar Veriliyor...',
    'dashboard.testAgentsTitle': 'AI Test Ajanları',
    'dashboard.testAgentsDesc': 'Değerlendirme sisteminizi test etmek için AI destekli aday profilleriyle mülakat simülasyonu yapın.',
    'dashboard.running': 'Çalışıyor...',
    'dashboard.runAgents': 'Çalıştır',
    'dashboard.allAgents': 'Tümü',
    'dashboard.expected': 'beklenen',
    'dashboard.completed': 'tamamlandı',
    'dashboard.total': 'Toplam',
    'dashboard.strongYes': 'Kesin Evet',
    'dashboard.yes': 'Evet',
    'dashboard.maybe': 'Belki',
    'dashboard.avgScore': 'Ort. Puan',
    'dashboard.noInterviews': 'Henüz mülakat yok',
    'dashboard.noInterviewsDesc': 'Değerlendirmeleri görmek için mülakat linkinizi paylaşın veya test ajanlarını çalıştırın.',
    'dashboard.noEval': 'Henüz değerlendirme yok',
    'dashboard.fullEval': 'Tam Değerlendirme',
    'dashboard.runJury': 'Jüri Çalıştır',
    'dashboard.evaluating': 'Değerlendiriliyor...',
    'dashboard.juryEvals': 'JÜRİ DEĞERLENDİRMELERİ',
    'dashboard.transcript': '// TRANSKRIPT',
    'dashboard.candidate': 'Aday:',
    'dashboard.deliberation': 'TARTIŞMA',
    'dashboard.changed': 'Değişti',
    'dashboard.maintained': 'Korudu',
    'dashboard.final': 'Sonuç',
    'dashboard.interviewerEval': '// MÜLAKATÇI DEĞERLENDİRMESİ',
    'dashboard.juryStarting': 'Jüri değerlendirmesi başlatılıyor...',
    'dashboard.juryDone': 'jüri değerlendirmesi tamamlandı.',
    'dashboard.interviewStarting': 'Mülakat başlatılıyor',
    'dashboard.turn': 'Tur',
    'dashboard.interviewsDone': 'mülakat tamamlandı.',
    'dashboard.deleteProgram': 'Programı Sil',
    'dashboard.deleteConfirmTitle': 'Programı Silmek İstediğinize Emin misiniz?',
    'dashboard.deleteConfirmDesc': 'Bu işlem geri alınamaz. Program ve tüm mülakatlar kalıcı olarak silinecektir.',
    'dashboard.deleteConfirm': 'Evet, Sil',
    'dashboard.deleteCancel': 'İptal',
    'dashboard.deleting': 'Siliniyor...',

    // ── Demo ──
    'demo.title': 'Tam Pipeline Demo',
    'demo.subtitle': 'Tek tıkla tüm pipeline aşamalarını çalıştırır',
    'demo.start': 'Tam Demoyu Başlat',
    'demo.running': 'Pipeline çalışıyor...',
    'demo.complete': 'Pipeline tamamlandı!',
    'demo.stage1': 'Test Mülakatları',
    'demo.stage2': 'Jüri Değerlendirmesi',
    'demo.stage3': 'Müzakere',
    'demo.stage4': 'Kararlar',
    'demo.stage5': 'Kickoff',
    'demo.stage6': 'Demo Day',
    'demo.loading': 'Demo yükleniyor...',
    'demo.estimatedTime': 'Tahmini süre: ~3-5 dakika',
    'demo.completedInterviews': 'Tamamlanan Mülakatlar',
    'demo.acceptedFounders': 'Kabul Edilen Kurucular',
    'demo.assignedMentors': 'Atanan Mentorlar',
    'demo.runAgain': 'Tekrar Çalıştır',

    // ── Program ──
    'program.loading': 'Program yükleniyor...',
    'program.subtitle': 'Program Yürütme — 8 Haftalık Hızlandırıcı',
    'program.acceptedFounders': 'kabul edilen kurucu',
    'program.timeline': 'PROGRAM TAKVİMİ',
    'program.week1': 'Kickoff & Mentor Eşleştirme',
    'program.week2': 'Ürün Keşif Atölyesi',
    'program.week3': 'AI Mimari Derinlemesine İnceleme',
    'program.week4': 'Ara Değerlendirme & İlerleme Kontrolü',
    'program.week5': 'Pitch Provası #1',
    'program.week6': 'Growth Hacking Atölyesi',
    'program.week7': 'Yatırımcı Hazırlık Oturumu',
    'program.week8': 'Demo Day',
    'program.runKickoff': 'Başlangıç Çalıştır',
    'program.kickoffDesc': 'Hafta 1 • Mentor Eşleştirme',
    'program.runMidterm': 'Ara Değerlendirme',
    'program.midtermDesc': 'Hafta 4 • İlerleme Kontrolü',
    'program.runDemoday': 'Demo Day Çalıştır',
    'program.demodayDesc': 'Hafta 8 • Final Raporları',
    'program.mentorPanel': 'MENTOR PANELİ',
    'program.mentee': 'öğrenci',
    'program.noAccepted': 'Kabul edilen aday yok',
    'program.runFirst': 'Önce tam pipeline\'ı çalıştırın: Mülakat → Jüri → Tartışma → Karar',
    'program.cohort': 'KOHORT',
    'program.founders': 'kurucu',
    'program.unassigned': 'Atanmadı',
    'program.kickoffTitle': 'BAŞLANGIÇ — Hafta 1',
    'program.focusAreas': 'ODAK ALANLARI',
    'program.roadmap': '8 HAFTALIK YOL HARİTASI',
    'program.firstWeekTasks': 'İLK HAFTA GÖREVLERİ',
    'program.pmNote': 'PM NOTU',
    'program.midtermTitle': 'ARA DEĞERLENDİRME — Hafta 4',
    'program.interventionNeeded': 'Müdahale gerekli',
    'program.strengths': 'GÜÇLÜ YANLAR',
    'program.improve': 'GELİŞTİRİLMELİ',
    'program.pmAssessment': 'PM DEĞERLENDİRMESİ',
    'program.demodayTitle': 'DEMO DAY — Hafta 8',
    'program.investorBrief': 'YATIRIMCI ÖZETİ',
    'program.mentorRec': 'MENTOR ÖNERİSİ',
    'program.keyMetrics': 'TEMEL METRİKLER',
    'program.nextSteps': 'SONRAKİ ADIMLAR',
    'program.finalPmNotes': 'FİNAL PM NOTLARI',

    // ── Results ──
    'results.loading': 'Sonuçlar yükleniyor...',
    'results.subtitle': 'Program Sonuçları — Kohort Seçimi',
    'results.evaluated': 'Değerlendirilen',
    'results.acceptRate': 'Kabul Oranı',
    'results.avgScore': 'Ort. Puan',
    'results.juryAgreement': 'Jüri Uzlaşması',
    'results.noDecisions': 'Henüz karar verilmedi',
    'results.runPipeline': "Dashboard'dan tam pipeline'ı çalıştırın: Mülakat → Jüri → Tartışma → Karar",
    'results.accepted': 'KABUL',
    'results.waitlist': 'BEKLEME LİSTESİ',
    'results.rejected': 'REDDEDİLEN',
    'results.mindChanged': '*fikir değişti',
    'results.juryEvals': 'JÜRİ DEĞERLENDİRMELERİ',
    'results.deliberation': 'TARTIŞMA',
    'results.changed': 'Değişti',
    'results.maintained': 'Korudu',
  },

  en: {
    // ── Common ──
    'common.login': 'Sign In',
    'common.signup': 'Sign Up',
    'common.createProgram': 'Create Program',
    'common.results': 'Results',
    'common.dashboard': 'Dashboard',
    'common.program': 'Program',
    'common.demo': 'Demo',
    'common.exportJson': 'Export JSON',
    'common.loading': 'Loading...',
    'common.score': 'score',
    'common.close': 'Close',

    // ── Landing / Nav ──
    'nav.login': 'Sign In',
    'nav.create': 'Create Program',
    'nav.myPrograms': 'My Programs',
    'nav.logout': 'Sign Out',
    'nav.dashboard': 'Dashboard',
    'nav.results': 'Results',
    'nav.program': 'Program',

    // ── Landing / Hero ──
    'hero.badge': 'End-to-End AI Pipeline',
    'hero.title1': 'The AI Operating System',
    'hero.title2': 'for',
    'hero.title3': 'Startup Accelerators',
    'hero.subtitle': 'From application to Demo Day — every step powered by AI agents. Interviews, jury evaluation, deliberation, decisions, mentoring and program management in one platform.',
    'hero.cta': 'Create Program',
    'hero.demo': 'Launch Demo',

    // ── Landing / Stats ──
    'stats.agents': 'AI Agents',
    'stats.jury': 'Jury Members',
    'stats.mentors': 'Mentors',
    'stats.weeks': 'Week Program',

    // ── Landing / Pipeline ──
    'pipeline.section': '// PIPELINE',
    'pipeline.title': 'Six AI-powered stages.',
    'pipeline.titleGray': 'Zero manual work.',
    'pipeline.clickHint': 'Click for details',
    'pipeline.howItWorks': 'HOW IT WORKS',
    'pipeline.features': 'KEY FEATURES',
    'pipeline.output': 'OUTPUT',
    'pipeline.agents0': 'AI CANDIDATE PROFILES',
    'pipeline.agents1': 'JURY MEMBERS',
    'pipeline.agents4': 'MENTOR PANEL',
    'pipeline.agentsDefault': 'AGENTS',

    // Pipeline stage titles
    'stage.0.title': 'AI Interviews',
    'stage.0.desc': 'Adaptive interviews with 6 unique AI candidate profiles. Multilingual, real-time evaluation.',
    'stage.0.subtitle': 'Conversational AI that adapts to each candidate',
    'stage.0.howItWorks': 'Each candidate has a unique AI personality with different background, expertise, and communication style. The AI interviewer conducts adaptive 10-minute interviews with follow-up questions based on responses. Interviews run in parallel — 6 candidates can be evaluated simultaneously.',
    'stage.0.features': 'Multilingual support (TR/EN)|Adaptive questions based on responses|Real-time transcript|Automatic evaluation with structured scores|Step-based API for reliable operation',
    'stage.0.output': 'Structured evaluation with scores in 6 dimensions, recommendation (STRONG_YES → NO), highlights and red flags',
    'stage.0.agents': '🚀|Ayşe Demir|Strong technical founder (DeepMind background);;💡|Kerem Yılmaz|Creative product thinker (design → tech);;📊|Mehmet Kaya|Data-driven business founder;;🌍|Elif Arslan|Impact-driven social entrepreneur;;🎯|Can Öztürk|Sales-driven entrepreneur;;🔬|Zeynep Aydın|Deep tech researcher',

    'stage.1.title': 'Expert Jury',
    'stage.1.desc': '3 AI jury members independently evaluate each interview from technical, business, and vision perspectives.',
    'stage.1.subtitle': 'Independent expert evaluation from three perspectives',
    'stage.1.howItWorks': 'Each completed interview is reviewed by 3 AI jury members with different evaluation perspectives. They read the full transcript and produce independent scores — no jury member sees the others\' evaluations at this stage. This prevents groupthink and ensures diverse viewpoints.',
    'stage.1.features': 'Independent evaluation (no cross-influence)|Weighted scoring by jury expertise|Structured output with rationale for each score|Red flag and highlight detection|One-line summary per jury member',
    'stage.1.output': '3 independent evaluations per candidate, each with scores, recommendation, key concerns and highlights',
    'stage.1.agents': '🔬|Dr. Zeynep Akar|Technical Evaluator — AI depth, architecture, defensibility;;📊|Ahmet Çelik|Business Evaluator — market awareness, PMF, traction;;🌟|Selin Yıldırım|Vision Evaluator — founder energy, ambition, program fit',

    'stage.2.title': 'Deliberation',
    'stage.2.desc': 'Jury members review each other\'s evaluations, discuss, and reach consensus — just like a real selection committee.',
    'stage.2.subtitle': 'AI-powered consensus building',
    'stage.2.howItWorks': 'After independent evaluations, each jury member sees the other two members\' assessments. They can change their mind, adjust scores, and provide reasoning for their final position. This mimics real-world selection committee dynamics.',
    'stage.2.features': 'Cross-review of all jury evaluations|Reasoned score adjustments|Mind-change tracking|Original vs. final score comparison|Consensus analysis across jury',
    'stage.2.output': 'Deliberation notes showing original → final scores, mind changes, and detailed reasoning per jury member',

    'stage.3.title': 'Smart Decisions',
    'stage.3.desc': 'Data-driven ACCEPT / WAITLIST / REJECT decisions based on post-deliberation scores and configurable thresholds.',
    'stage.3.subtitle': 'Threshold-based decisions with full transparency',
    'stage.3.howItWorks': 'The decision engine aggregates post-deliberation final scores (falls back to jury averages if no deliberation). Candidates are ranked by score and classified with configurable thresholds: ≥7 = ACCEPT, 5-6.9 = WAITLIST, <5 = REJECT. Each decision is traceable back to individual jury scores and deliberation notes.',
    'stage.3.features': 'Configurable score thresholds|Uses post-deliberation scores|Fallback to jury average if needed|Full audit trail from interview to decision|Batch processing for entire cohort',
    'stage.3.output': 'ACCEPT / WAITLIST / REJECT decision with final score per candidate, applied across all evaluated interviews in the program',

    'stage.4.title': 'Mentor Matching',
    'stage.4.desc': '5 expert mentors auto-matched to founders based on their weakest areas. Personalized 8-week roadmaps.',
    'stage.4.subtitle': 'Smart mentor-founder matching',
    'stage.4.howItWorks': 'Each accepted founder is matched with the mentor who best addresses their weakest area (determined from jury evaluations). The mentor then creates a personalized 8-week roadmap with specific milestones, focus areas, and first-week tasks. The Program Manager oversees the matching and provides additional notes.',
    'stage.4.features': 'Weakness-based matching algorithm|Personalized 8-week roadmap per founder|First-week task assignments|Program Manager oversight|Focus area identification',
    'stage.4.output': 'Mentor assignment, welcome message, 8-week roadmap, focus areas and first-week tasks for each accepted founder',
    'stage.4.agents': '🚀|Aylin Güneş|AI-native startup co-founder — Technical mentor;;🤖|Berk Aydın|AI agent infra co-founder (YC) — Product mentor;;💰|Canan Korkmaz|Angel investor (30+ investments) — PMF expert;;📈|Deniz Ertürk|VC Partner — Investment & growth;;🎓|Prof. Elif Şahin|Boğaziçi CS + Fortune 500 — Strategy',

    'stage.5.title': 'Demo Day',
    'stage.5.desc': 'Full program execution from Kickoff to Demo Day. Investor briefs, pitch readiness scores, graduation reports.',
    'stage.5.subtitle': 'One-click from Kickoff to graduation',
    'stage.5.howItWorks': 'The 8-week program is simulated with three main checkpoints. At Demo Day (Week 8), mentors write investor recommendation letters, evaluate pitch readiness (1-10), and compile key metrics. The Program Manager determines graduation status: Graduated with Honors, Graduated, or Needs Extension.',
    'stage.5.features': 'Mentor recommendation letters|Pitch readiness scoring (1-10)|Investor-ready briefs|Key metric compilation|Graduation status determination|Post-program next steps',
    'stage.5.output': 'Demo Day report with mentor recommendation, pitch readiness, investor brief, key metrics, graduation status and next steps',
    'stage.5.agents': '👩‍💼|İrem Başaran|Program Director — Manages all stages',

    // ── Landing / Audience ──
    'audience.section': '// WHO IT\'S FOR',
    'audience.title': 'Who is StealthWorks for?',
    'audience.0.title': 'Accelerators',
    'audience.0.desc': 'Automate your entire selection and program execution process',
    'audience.1.title': 'VC & Angels',
    'audience.1.desc': 'Screen deal flow with AI-powered interviews and expert evaluation',
    'audience.2.title': 'University Incubators',
    'audience.2.desc': 'Scale your startup program without growing your team',
    'audience.3.title': 'Corporate Innovation',
    'audience.3.desc': 'Systematically evaluate internal ventures and intrapreneurs',

    // ── Landing / How It Works ──
    'howItWorks.section': '// HOW IT WORKS',
    'howItWorks.title': 'Get started in three steps',
    'howItWorks.step1.title': 'Create Your Program',
    'howItWorks.step1.desc': 'Sign up, name your accelerator, customize the AI interviewer prompt and evaluation criteria. Takes 5 minutes.',
    'howItWorks.step2.title': 'Run the Simulation',
    'howItWorks.step2.desc': 'Click "Demo" to run the full pipeline — AI candidates, jury evaluation, deliberation, decisions, mentoring and Demo Day — one click.',
    'howItWorks.step3.title': 'Review Results',
    'howItWorks.step3.desc': 'Explore cohort analytics, mentor reports, pitch readiness scores and investor briefs. Export data or share the dashboard with your team.',

    // ── Landing / CTA ──
    'cta.title1': 'Ready to see the full',
    'cta.title2': 'pipeline',
    'cta.title3': 'in action?',
    'cta.subtitle': 'Create a program and run the demo in one click. From application to Demo Day in 5 minutes.',
    'cta.button': 'Get Started Free',

    // ── Landing / Footer ──
    'footer.text': 'StealthWorks 2026 — AI Operating System for Startup Accelerators',

    // ── Auth ──
    'auth.login': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.loginBtn': 'Sign In',
    'auth.signupBtn': 'Sign Up',
    'auth.googleBtn': 'Continue with Google',
    'auth.switchToSignup': "Don't have an account?",
    'auth.switchToLogin': 'Already have an account?',
    'auth.checkEmail': 'Check your email for a confirmation link.',

    // ── Create ──
    'create.title': 'Create Program',
    'create.nameLabel': 'Program Name',
    'create.namePlaceholder': 'e.g. AI Startup Accelerator 2025',
    'create.descLabel': 'Description',
    'create.descPlaceholder': 'Briefly describe your program...',
    'create.promptLabel': 'Interview System Prompt',
    'create.promptPlaceholder': 'Write the system prompt for the AI interviewer...',
    'create.submitBtn': 'Create Program',
    'create.creating': 'Creating...',

    // ── My Programs ──
    'myPrograms.title': 'My Programs',
    'myPrograms.loading': 'Loading programs...',
    'myPrograms.empty': 'No programs yet',
    'myPrograms.createFirst': 'Create your first program',

    // ── Program Landing (slug page) ──
    'programLanding.applicationsOpen': 'Applications Open',
    'programLanding.startInterview': 'Start AI Interview',
    'programLanding.journey': 'From Application to Investment',
    'programLanding.step1': 'AI Interview',
    'programLanding.step1desc': '10 min adaptive interview',
    'programLanding.step2': 'Jury Evaluation',
    'programLanding.step2desc': '3 experts evaluate independently',
    'programLanding.step3': 'Admission Decision',
    'programLanding.step3desc': 'Data-driven selection',

    // ── Interview ──
    'interview.loading': 'Loading...',
    'interview.notFound': 'Program Not Found',
    'interview.notFoundDesc': 'program not found.',
    'interview.title': 'Interview',
    'interview.welcome': 'Welcome to the AI-powered interview. The interview takes about 10 minutes.',
    'interview.start': 'Start Interview',
    'interview.placeholder': 'Type your answer...',
    'interview.agent': 'Interview Agent',
    'interview.failStart': 'Failed to start interview. Please try again.',
    'interview.failSend': 'Failed to send message. Please try again.',
    'interview.complete': 'Interview Complete',
    'interview.evalReport': '// EVALUATION REPORT',
    'interview.highlights': 'HIGHLIGHTS',
    'interview.redFlags': 'RED FLAGS',
    'interview.overallScore': 'OVERALL SCORE (ai_nativeness 2x weighted)',
    'interview.phase1': 'Phase 1: Welcome',
    'interview.phase2': 'Phase 2: The Idea',
    'interview.phase3': 'Phase 3: AI-Native Depth',
    'interview.phase4': 'Phase 4: Market',
    'interview.phase5': 'Phase 5: Vision',
    'interview.phase5b': 'Phase 5: Closing',

    // ── Dashboard ──
    'dashboard.loading': 'Loading dashboard...',
    'dashboard.subtitle': 'Jury Dashboard — Interview Evaluations',
    'dashboard.testAgents': 'Test Agents',
    'dashboard.jury': 'Jury',
    'dashboard.deliberate': 'Deliberate',
    'dashboard.deliberating': 'Deliberating...',
    'dashboard.decide': 'Decide',
    'dashboard.deciding': 'Deciding...',
    'dashboard.testAgentsTitle': 'AI Test Agents',
    'dashboard.testAgentsDesc': 'Simulate interviews with AI-powered candidate profiles to test your evaluation system.',
    'dashboard.running': 'Running...',
    'dashboard.runAgents': 'Run',
    'dashboard.allAgents': 'All',
    'dashboard.expected': 'expected',
    'dashboard.completed': 'completed',
    'dashboard.total': 'Total',
    'dashboard.strongYes': 'Strong Yes',
    'dashboard.yes': 'Yes',
    'dashboard.maybe': 'Maybe',
    'dashboard.avgScore': 'Avg Score',
    'dashboard.noInterviews': 'No interviews yet',
    'dashboard.noInterviewsDesc': 'Share your interview link or run test agents to see evaluations here.',
    'dashboard.noEval': 'No evaluation yet',
    'dashboard.fullEval': 'Full Evaluation',
    'dashboard.runJury': 'Run Jury',
    'dashboard.evaluating': 'Evaluating...',
    'dashboard.juryEvals': 'JURY EVALUATIONS',
    'dashboard.transcript': '// TRANSCRIPT',
    'dashboard.candidate': 'Candidate:',
    'dashboard.deliberation': 'DELIBERATION',
    'dashboard.changed': 'Changed',
    'dashboard.maintained': 'Maintained',
    'dashboard.final': 'Final',
    'dashboard.interviewerEval': '// INTERVIEWER EVALUATION',
    'dashboard.juryStarting': 'Starting jury evaluation...',
    'dashboard.juryDone': 'jury evaluations completed.',
    'dashboard.interviewStarting': 'Starting interview with',
    'dashboard.turn': 'Turn',
    'dashboard.interviewsDone': 'interviews completed.',
    'dashboard.deleteProgram': 'Delete Program',
    'dashboard.deleteConfirmTitle': 'Are You Sure You Want to Delete This Program?',
    'dashboard.deleteConfirmDesc': 'This action cannot be undone. The program and all interviews will be permanently deleted.',
    'dashboard.deleteConfirm': 'Yes, Delete',
    'dashboard.deleteCancel': 'Cancel',
    'dashboard.deleting': 'Deleting...',

    // ── Demo ──
    'demo.title': 'Full Pipeline Demo',
    'demo.subtitle': 'Run all pipeline stages with one click',
    'demo.start': 'Start Full Demo',
    'demo.running': 'Pipeline running...',
    'demo.complete': 'Pipeline complete!',
    'demo.stage1': 'Test Interviews',
    'demo.stage2': 'Jury Evaluation',
    'demo.stage3': 'Deliberation',
    'demo.stage4': 'Decisions',
    'demo.stage5': 'Kickoff',
    'demo.stage6': 'Demo Day',
    'demo.loading': 'Loading demo...',
    'demo.estimatedTime': 'Estimated time: ~3-5 minutes',
    'demo.completedInterviews': 'Completed Interviews',
    'demo.acceptedFounders': 'Accepted Founders',
    'demo.assignedMentors': 'Assigned Mentors',
    'demo.runAgain': 'Run Again',

    // ── Program ──
    'program.loading': 'Loading program...',
    'program.subtitle': 'Program Execution — 8 Week Accelerator',
    'program.acceptedFounders': 'accepted founders',
    'program.timeline': 'PROGRAM TIMELINE',
    'program.week1': 'Kickoff & Mentor Matching',
    'program.week2': 'Product Discovery Workshop',
    'program.week3': 'AI Architecture Deep Dive',
    'program.week4': 'Midterm Review & Progress Check',
    'program.week5': 'Pitch Practice #1',
    'program.week6': 'Growth Hacking Workshop',
    'program.week7': 'Investor Prep Session',
    'program.week8': 'Demo Day',
    'program.runKickoff': 'Run Kickoff',
    'program.kickoffDesc': 'Week 1 • Mentor Match',
    'program.runMidterm': 'Run Midterm',
    'program.midtermDesc': 'Week 4 • Progress Check',
    'program.runDemoday': 'Run Demo Day',
    'program.demodayDesc': 'Week 8 • Final Reports',
    'program.mentorPanel': 'MENTOR PANEL',
    'program.mentee': 'mentee',
    'program.noAccepted': 'No accepted candidates',
    'program.runFirst': 'Run the full pipeline first: Interview → Jury → Deliberate → Decide',
    'program.cohort': 'COHORT',
    'program.founders': 'founders',
    'program.unassigned': 'Unassigned',
    'program.kickoffTitle': 'KICKOFF — Week 1',
    'program.focusAreas': 'FOCUS AREAS',
    'program.roadmap': '8-WEEK ROADMAP',
    'program.firstWeekTasks': 'FIRST WEEK TASKS',
    'program.pmNote': 'PM NOTE',
    'program.midtermTitle': 'MIDTERM — Week 4',
    'program.interventionNeeded': 'Intervention needed',
    'program.strengths': 'STRENGTHS',
    'program.improve': 'IMPROVE',
    'program.pmAssessment': 'PM ASSESSMENT',
    'program.demodayTitle': 'DEMO DAY — Week 8',
    'program.investorBrief': 'INVESTOR BRIEF',
    'program.mentorRec': 'MENTOR RECOMMENDATION',
    'program.keyMetrics': 'KEY METRICS',
    'program.nextSteps': 'NEXT STEPS',
    'program.finalPmNotes': 'FINAL PM NOTES',

    // ── Results ──
    'results.loading': 'Loading results...',
    'results.subtitle': 'Program Results — Cohort Selection',
    'results.evaluated': 'Evaluated',
    'results.acceptRate': 'Accept Rate',
    'results.avgScore': 'Avg Score',
    'results.juryAgreement': 'Jury Agreement',
    'results.noDecisions': 'No decisions made yet',
    'results.runPipeline': 'Run the full pipeline from the dashboard: Interview → Jury → Deliberate → Decide',
    'results.accepted': 'ACCEPTED',
    'results.waitlist': 'WAITLIST',
    'results.rejected': 'REJECTED',
    'results.mindChanged': '*mind changed',
    'results.juryEvals': 'JURY EVALUATIONS',
    'results.deliberation': 'DELIBERATION',
    'results.changed': 'Changed',
    'results.maintained': 'Maintained',
  },
} as const

export type TranslationKey = keyof typeof translations.tr
