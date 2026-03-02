'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PipelineStage {
  emoji: string
  title: string
  desc: string
  color: string
  detail: {
    subtitle: string
    howItWorks: string
    features: string[]
    agents?: { emoji: string; name: string; role: string }[]
    output: string
  }
}

export default function HomePage() {
  const [selectedStage, setSelectedStage] = useState<number | null>(null)

  const pipeline: PipelineStage[] = [
    {
      emoji: '🤖', title: 'AI Mülakatlar', color: '#58A6FF',
      desc: '6 benzersiz AI aday profili ile adaptif görüşmeler. Çok dilli, gerçek zamanlı değerlendirme.',
      detail: {
        subtitle: 'Her adaya uyum sağlayan konuşma yapay zekası',
        howItWorks: 'Her adayın farklı geçmiş, uzmanlık seviyesi ve iletişim tarzına sahip benzersiz bir AI kişiliği vardır. AI mülakatçı, yanıtlara göre takip soruları sorarak adaptif 10 dakikalık görüşmeler yürütür. Mülakatlar paralel çalışır — 6 aday eş zamanlı değerlendirilebilir.',
        features: ['Çok dilli destek (TR/EN)', 'Yanıtlara göre adaptif sorular', 'Gerçek zamanlı transkript', 'Yapılandırılmış puanlarla otomatik değerlendirme', 'Güvenilir çalışma için adım bazlı API'],
        agents: [
          { emoji: '🚀', name: 'Ayşe Demir', role: 'Güçlü teknik kurucu (DeepMind geçmişi)' },
          { emoji: '💡', name: 'Kerem Yılmaz', role: 'Yaratıcı ürün düşünürü (tasarım → teknoloji)' },
          { emoji: '📊', name: 'Mehmet Kaya', role: 'Veri odaklı iş kurucusu' },
          { emoji: '🌍', name: 'Elif Arslan', role: 'Etki odaklı sosyal girişimci' },
          { emoji: '🎯', name: 'Can Öztürk', role: 'Satış odaklı girişimci' },
          { emoji: '🔬', name: 'Zeynep Aydın', role: 'Derin teknoloji araştırmacısı' },
        ],
        output: '6 boyutta puanlarla yapılandırılmış değerlendirme, öneri (STRONG_YES → NO), öne çıkanlar ve kırmızı bayraklar',
      },
    },
    {
      emoji: '⚖️', title: 'Uzman Jüri', color: '#D2A8FF',
      desc: '3 AI jüri üyesi her mülakatı teknik, iş ve vizyon perspektiflerinden bağımsız değerlendirir.',
      detail: {
        subtitle: 'Üç perspektiften bağımsız uzman değerlendirmesi',
        howItWorks: 'Tamamlanan her mülakat, farklı değerlendirme perspektifine sahip 3 AI jüri üyesi tarafından incelenir. Tam transkripti okur ve bağımsız puanlar üretirler — bu aşamada hiçbir jüri üyesi diğerinin değerlendirmesini görmez. Bu, grup düşüncesini önler ve çeşitli bakış açıları sağlar.',
        features: ['Bağımsız değerlendirme (çapraz etki yok)', 'Jüri uzmanlığına göre ağırlıklı puanlama', 'Her puan için gerekçeli yapılandırılmış çıktı', 'Kırmızı bayrak ve öne çıkanların tespiti', 'Jüri üyesi başına tek satır özet'],
        agents: [
          { emoji: '🔬', name: 'Dr. Zeynep Akar', role: 'Technical Evaluator — AI depth, architecture, defensibility' },
          { emoji: '📊', name: 'Ahmet Çelik', role: 'Business Evaluator — market awareness, PMF, traction' },
          { emoji: '🌟', name: 'Selin Yıldırım', role: 'Vision Evaluator — founder energy, ambition, program fit' },
        ],
        output: 'Aday başına 3 bağımsız değerlendirme, her biri puanlar, öneri, temel endişeler ve öne çıkanlar ile',
      },
    },
    {
      emoji: '🗣', title: 'Müzakere', color: '#F78166',
      desc: 'Jüri üyeleri birbirlerinin değerlendirmelerini inceler, tartışır ve konsensüse ulaşır — tıpkı gerçek bir seçim komitesi gibi.',
      detail: {
        subtitle: 'AI destekli konsensüs oluşturma',
        howItWorks: 'After independent evaluations, each jury member sees the other two members\' assessments. They can change their mind, adjust scores, and provide reasoning for their final position. This mimics real-world selection committee dynamics — sometimes a technical concern raises everyone\'s awareness, sometimes a business insight changes the picture.',
        features: ['Tüm jüri değerlendirmelerinin çapraz incelemesi', 'Gerekçeli puan düzeltmesi', 'Fikir değişikliği takibi', 'Orijinal vs. nihai puan karşılaştırması', 'Jüri genelinde konsensüs analizi'],
        output: 'Jüri üyesi başına orijinal → nihai puanları, fikir değişikliği ve detaylı gerekçeyi gösteren müzakere notları',
      },
    },
    {
      emoji: '✅', title: 'Akıllı Kararlar', color: '#3FB950',
      desc: 'Müzakere sonrası puanlara ve yapılandırılabilir eşiklere dayalı veri odaklı KABUL / YEDEK / RED kararları.',
      detail: {
        subtitle: 'Tam şeffaflıkla eşik bazlı kararlar',
        howItWorks: 'Karar motoru müzakere sonrası nihai puanları toplar (müzakere yapılmamışsa jüri ortalamalarına döner). Adaylar puana göre sıralanır ve yapılandırılabilir eşiklerle sınıflandırılır: ≥7 = KABUL, 5-6.9 = YEDEK, <5 = RED. Her karar, bireysel jüri puanlarına ve müzakere notlarına kadar izlenebilir.',
        features: ['Yapılandırılabilir puan eşikleri', 'Müzakere sonrası puanları kullanır', 'Gerekirse jüri ortalamasına geri dönüş', 'Mülakattan karara tam denetim izi', 'Tüm kohort için toplu işleme'],
        output: 'Aday başına nihai puanla KABUL / YEDEK / RED kararı, programdaki tüm değerlendirilen mülakatlar için uygulanır',
      },
    },
    {
      emoji: '🚀', title: 'Mentor Eşleştirme', color: '#58A6FF',
      desc: '5 uzman mentor, kurucuların zayıf alanlarına göre otomatik eşleştirilir. Kişiselleştirilmiş 8 haftalık yol haritaları.',
      detail: {
        subtitle: 'Akıllı mentor-kurucu eşleştirmesi',
        howItWorks: 'Kabul edilen her kurucu, en zayıf alanını (jüri değerlendirmelerinden belirlenen) en iyi ele alan mentorla eşleştirilir. Mentor daha sonra belirli kilometre taşları, odak alanları ve ilk hafta görevleri ile kişiselleştirilmiş 8 haftalık bir yol haritası oluşturur. Program Yöneticisi eşleştirmeyi denetler ve ek notlar sağlar.',
        features: ['Zayıf alan bazlı eşleştirme algoritması', 'Kurucu başına kişiselleştirilmiş 8 haftalık yol haritası', 'İlk hafta görev atamaları', 'Program Yöneticisi gözetimi', 'Odak alanı belirleme'],
        agents: [
          { emoji: '🚀', name: 'Aylin Güneş', role: 'AI-native startup kurucu ortağı — Teknik mentor' },
          { emoji: '🤖', name: 'Berk Aydın', role: 'AI agent altyapı kurucu ortağı (YC) — Ürün mentoru' },
          { emoji: '💰', name: 'Canan Korkmaz', role: 'Melek yatırımcı (30+ yatırım) — PMF uzmanı' },
          { emoji: '📈', name: 'Deniz Ertürk', role: 'VC Partneri — Yatırım & büyüme' },
          { emoji: '🎓', name: 'Prof. Elif Şahin', role: 'Boğaziçi CS + Fortune 500 — Strateji' },
        ],
        output: 'Her kabul edilen kurucu için mentor ataması, hoş geldin mesajı, 8 haftalık yol haritası, odak alanları ve ilk hafta görevleri',
      },
    },
    {
      emoji: '🎤', title: 'Demo Day', color: '#F78166',
      desc: "Kickoff'tan Demo Day'e tam program yürütme. Yatırımcı özetleri, pitch hazırlık puanları, mezuniyet raporları.",
      detail: {
        subtitle: "Kickoff'tan mezuniyete tek tıkla",
        howItWorks: "8 haftalık program üç ana kontrol noktasıyla simüle edilir. Demo Day'de (Hafta 8) mentorlar yatırımcı tavsiye mektupları yazar, pitch hazırlığını değerlendirir (1-10) ve temel metrikleri derler. Program Yöneticisi mezuniyet durumunu belirler: Onur ile Mezun, Mezun veya Uzatma Gerekli.",
        features: ['Mentor tavsiye mektupları', 'Pitch hazırlık puanlaması (1-10)', 'Yatırımcıya hazır özetler', 'Temel metrik derleme', 'Mezuniyet durumu belirleme', 'Program sonrası adımlar'],
        agents: [
          { emoji: '👩‍💼', name: 'İrem Başaran', role: 'Program Direktörü — Tüm aşamaları yönetir' },
        ],
        output: 'Mentor tavsiyesi, pitch hazırlığı, yatırımcı özeti, temel metrikler, mezuniyet durumu ve sonraki adımlarla Demo Day raporu',
      },
    },
  ]

  const stats = [
    { value: '6', label: 'AI Ajan', color: '#58A6FF' },
    { value: '3', label: 'Jüri Üyesi', color: '#D2A8FF' },
    { value: '5', label: 'Mentor', color: '#F78166' },
    { value: '8', label: 'Hafta Program', color: '#3FB950' },
  ]

  const audiences = [
    { emoji: '🏢', title: 'Hızlandırıcılar', desc: 'Tüm seçim ve program yürütme sürecinizi otomatikleştirin' },
    { emoji: '💰', title: 'VC & Melekler', desc: 'AI destekli mülakatlar ve uzman değerlendirmesiyle deal flow tarayın' },
    { emoji: '🎓', title: 'Üniversite Kuluçkaları', desc: 'Ekibinizi büyütmeden startup programınızı ölçeklendirin' },
    { emoji: '🏗', title: 'Kurumsal İnovasyon', desc: 'İç girişimleri ve iç girişimcileri sistematik olarak değerlendirin' },
  ]

  const selected = selectedStage !== null ? pipeline[selectedStage] : null

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#30363D]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#58A6FF] to-[#F78166] rounded-lg flex items-center justify-center font-mono font-bold text-[#0D1117]">
            S
          </div>
          <span className="font-semibold tracking-wide">StealthWorks</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
            Giriş Yap
          </Link>
          <Link
            href="/create"
            className="text-sm bg-[#58A6FF] text-[#0D1117] px-4 py-2 rounded-lg font-semibold hover:bg-[#79B8FF] transition-colors"
          >
            Program Oluştur
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative text-center py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(88,166,255,0.15)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(247,129,102,0.08)_0%,transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[rgba(88,166,255,0.1)] border border-[rgba(88,166,255,0.2)] px-4 py-1.5 rounded-full text-xs font-mono text-[#58A6FF] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse" />
            Uçtan Uca AI Pipeline
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-6">
            Startup Hızlandırıcılar{' '}
            <br className="hidden md:block" />
            için{' '}
            <span className="bg-gradient-to-r from-[#58A6FF] via-[#D2A8FF] to-[#F78166] bg-clip-text text-transparent">
              AI İşletim Sistemi
            </span>
          </h1>

          <p className="text-lg text-[#8B949E] max-w-2xl mx-auto mb-10 leading-relaxed">
            Başvurudan Demo Day'e — her adım AI ajanları ile.
            Mülakatlar, jüri değerlendirmesi, müzakere, kararlar, mentorluk ve program yönetimi tek platformda.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-[#58A6FF] text-[#0D1117] px-8 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#58A6FF]/20"
            >
              Program Oluştur
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#0D1117" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link
              href="/auth/login?redirect=/my-programs"
              className="inline-flex items-center gap-2 bg-[#161B22] border border-[#30363D] text-[#E6EDF3] px-8 py-4 rounded-xl text-base font-semibold transition-all hover:border-[#58A6FF] hover:-translate-y-0.5"
            >
              ▶️ Demo Başlat
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-y border-[#30363D] bg-[#161B22]/50">
        <div className="max-w-4xl mx-auto px-6 py-8 flex justify-around">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#8B949E] mt-1 font-mono">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="text-xs font-mono text-[#58A6FF] mb-3 tracking-wider">{'// PIPELINE'}</div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Altı AI destekli aşama.{' '}
            <span className="text-[#8B949E]">Sıfır manuel iş.</span>
          </h2>
          <p className="text-sm text-[#484F58] mt-3 font-mono">Detay için tıklayın</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pipeline.map((step, i) => (
            <div
              key={step.title}
              onClick={() => setSelectedStage(i)}
              className="group bg-[#161B22] border border-[#30363D] rounded-xl p-6 cursor-pointer transition-all hover:-translate-y-0.5"
              style={{ borderColor: selectedStage === i ? step.color : undefined }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                  style={{ background: `${step.color}22`, color: step.color }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <span className="text-xl">{step.emoji}</span>
                <svg className="w-4 h-4 text-[#484F58] ml-auto group-hover:text-[#8B949E] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
              </div>
              <h3 className="text-base font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-[#8B949E] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Detail Modal */}
      {selected && selectedStage !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedStage(null)}>
          <div
            className="bg-[#161B22] border rounded-2xl p-0 max-w-2xl w-full max-h-[85vh] overflow-hidden"
            style={{ borderColor: selected.color }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4" style={{ background: `linear-gradient(135deg, ${selected.color}15, transparent)` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-mono font-bold"
                    style={{ background: `${selected.color}22`, color: selected.color }}
                  >
                    {String(selectedStage + 1).padStart(2, '0')}
                  </div>
                  <span className="text-2xl">{selected.emoji}</span>
                </div>
                <button
                  onClick={() => setSelectedStage(null)}
                  className="text-[#8B949E] hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#30363D] transition-colors"
                >
                  &times;
                </button>
              </div>
              <h3 className="text-xl font-bold mb-1">{selected.title}</h3>
              <p className="text-sm" style={{ color: selected.color }}>{selected.detail.subtitle}</p>
            </div>

            {/* Modal Body */}
            <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-140px)] space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#30363D transparent' }}>
              {/* How It Works */}
              <div>
                <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">NASIL ÇALIŞIR</div>
                <p className="text-sm text-[#E6EDF3] leading-relaxed">{selected.detail.howItWorks}</p>
              </div>

              {/* Agents */}
              {selected.detail.agents && selected.detail.agents.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">
                    {selectedStage === 0 ? 'AI ADAY PROFİLLERİ' : selectedStage === 1 ? 'JÜRİ ÜYELERİ' : selectedStage === 4 ? 'MENTOR PANELİ' : 'AJANLAR'}
                  </div>
                  <div className="space-y-1.5">
                    {selected.detail.agents.map(agent => (
                      <div key={agent.name} className="flex items-center gap-3 bg-[#0D1117] rounded-lg px-3 py-2">
                        <span className="text-lg">{agent.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold">{agent.name}</span>
                          <span className="text-xs text-[#8B949E] ml-2">{agent.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div>
                <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">TEMEL ÖZELLİKLER</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.detail.features.map(f => (
                    <span
                      key={f}
                      className="text-[11px] px-2.5 py-1 rounded-full font-mono"
                      style={{ background: `${selected.color}15`, color: selected.color }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Output */}
              <div>
                <div className="text-[10px] font-mono text-[#8B949E] mb-2 tracking-wider">ÇIKTI</div>
                <div className="bg-[#0D1117] rounded-lg px-4 py-3 text-sm text-[#8B949E] leading-relaxed border-l-2" style={{ borderColor: selected.color }}>
                  {selected.detail.output}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-[#30363D]">
                <button
                  onClick={() => setSelectedStage(selectedStage > 0 ? selectedStage - 1 : pipeline.length - 1)}
                  className="text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors flex items-center gap-1"
                >
                  ← {pipeline[selectedStage > 0 ? selectedStage - 1 : pipeline.length - 1].title}
                </button>
                <div className="flex gap-1">
                  {pipeline.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedStage(i)}
                      className="w-2 h-2 rounded-full transition-colors"
                      style={{ background: i === selectedStage ? selected.color : '#30363D' }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setSelectedStage(selectedStage < pipeline.length - 1 ? selectedStage + 1 : 0)}
                  className="text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors flex items-center gap-1"
                >
                  {pipeline[selectedStage < pipeline.length - 1 ? selectedStage + 1 : 0].title} →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Who It's For */}
      <div className="bg-[#161B22] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-mono text-[#F78166] mb-3 tracking-wider">{'// KİMLER İÇİN'}</div>
            <h2 className="text-3xl md:text-4xl font-bold">
              StealthWorks kimler için?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {audiences.map(a => (
              <div key={a.title} className="flex items-start gap-4 bg-[#0D1117] border border-[#30363D] rounded-xl p-5 hover:border-[#F78166] transition-colors">
                <span className="text-2xl mt-0.5">{a.emoji}</span>
                <div>
                  <h3 className="font-semibold mb-1">{a.title}</h3>
                  <p className="text-sm text-[#8B949E] leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-xs font-mono text-[#3FB950] mb-3 tracking-wider">{'// NASIL ÇALIŞIR'}</div>
        <h2 className="text-3xl font-bold mb-12">Üç adımda başlayın</h2>

        <div className="space-y-8">
          {[
            { num: '01', title: 'Programınızı Oluşturun', desc: 'Kaydolun, hızlandırıcınızı adlandırın, AI mülakatçı komutunu ve değerlendirme kriterlerini özelleştirin. 5 dakika sürer.', color: '#58A6FF' },
            { num: '02', title: 'Simülasyonu Çalıştırın', desc: "Tam pipeline'ı çalıştırmak için Demo'ya tıklayın — AI adaylar, jüri değerlendirmesi, müzakere, kararlar, mentorluk ve Demo Day — tek tıkla.", color: '#F78166' },
            { num: '03', title: 'Sonuçları İnceleyin', desc: 'Kohort analitiği, mentor raporları, pitch hazırlık puanları ve yatırımcı özetlerini keşfedin. Verileri dışa aktarın veya panoyu ekibinizle paylaşın.', color: '#3FB950' },
          ].map((step) => (
            <div key={step.num} className="flex gap-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg shrink-0"
                style={{ background: step.color, color: '#0D1117' }}
              >
                {step.num}
              </div>
              <div>
                <h3 className="text-base font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-[#8B949E] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-24 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(247,129,102,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(88,166,255,0.08)_0%,transparent_50%)]" />
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
            Tam{' '}
            <span className="bg-gradient-to-r from-[#58A6FF] to-[#F78166] bg-clip-text text-transparent">
              pipeline'ı
            </span>
            {' '}çalışırken görmeye hazır mısınız?
          </h2>
          <p className="text-[#8B949E] mb-8 max-w-md mx-auto">Bir program oluşturun ve tek tıkla demoyu çalıştırın. Başvurudan Demo Day'e 5 dakikada.</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-[#58A6FF] text-[#0D1117] px-8 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5"
            >
              Ücretsiz Başlayın
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-[#30363D] text-[#8B949E] text-xs font-mono">
        StealthWorks 2026 &mdash; AI Operating System for AI İşletim Sistemi
      </footer>
    </div>
  )
}
