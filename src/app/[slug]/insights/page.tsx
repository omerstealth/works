'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';

interface Variant {
  id: string;
  name: string;
}

interface Insight {
  topic: string;
  times_asked: number;
  avg_answer_depth: number;
  discrimination: number;
}

interface ParameterSuggestion {
  type: string;
  topic: string;
  reason: string;
  current: number;
  suggested: number;
}

interface InsightsData {
  total_interviews: number;
  avg_score: number | null;
  effectiveness: Insight[];
  suggestions: ParameterSuggestion[];
}

const topicNameMap: Record<string, Record<string, string>> = {
  problem_clarity: { tr: 'Problem Açıklığı', en: 'Problem Clarity' },
  ai_nativeness: { tr: 'AI Doğallığı', en: 'AI Nativeness' },
  solution_depth: { tr: 'Çözüm Derinliği', en: 'Solution Depth' },
  user_empathy: { tr: 'Kullanıcı Empati', en: 'User Empathy' },
  innovation_score: { tr: 'İnovasyon Puanı', en: 'Innovation Score' },
  feasibility: { tr: 'Uygulanabilirlik', en: 'Feasibility' },
  market_understanding: { tr: 'Pazar Anlayışı', en: 'Market Understanding' },
  team_capability: { tr: 'Ekip Yeteneği', en: 'Team Capability' },
};

function getTopicName(topic: string, lang: string): string {
  return topicNameMap[topic]?.[lang] || topic;
}

function getDiscriminationColor(score: number): string {
  if (score >= 0.5) return '#3FB950';
  if (score >= 0.2) return '#58A6FF';
  return '#F85149';
}

export default function InsightsPage() {
  const { slug } = useParams();
  const { lang } = useLanguage();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightsData | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('all');
  const [programId, setProgramId] = useState<string | null>(null);

  // Load program by slug
  useEffect(() => {
    async function loadProgram() {
      try {
        const { data: program, error } = await supabase
          .from('programs')
          .select('id')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        setProgramId(program.id);
      } catch (error) {
        console.error('Error loading program:', error);
        setLoading(false);
      }
    }

    if (slug) {
      loadProgram();
    }
  }, [slug, supabase]);

  // Load variants
  useEffect(() => {
    async function loadVariants() {
      if (!programId) return;

      try {
        const response = await fetch(`/api/variants?program_id=${programId}`);
        const variantsData = await response.json();
        setVariants(variantsData.variants || []);
      } catch (error) {
        console.error('Error loading variants:', error);
      }
    }

    if (programId) {
      loadVariants();
    }
  }, [programId]);

  // Load insights
  useEffect(() => {
    async function loadInsights() {
      if (!programId) return;

      setLoading(true);
      try {
        const url = selectedVariant === 'all'
          ? `/api/insights?program_id=${programId}`
          : `/api/insights?program_id=${programId}&variant_id=${selectedVariant}`;

        const response = await fetch(url);
        const insightsData = await response.json();
        setData(insightsData);
      } catch (error) {
        console.error('Error loading insights:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (programId) {
      loadInsights();
    }
  }, [programId, selectedVariant]);

  const handleApprove = (index: number) => {
    console.log(`Approved suggestion ${index}:`, data?.suggestions?.[index]);
  };

  const handleReject = (index: number) => {
    console.log(`Rejected suggestion ${index}:`, data?.suggestions?.[index]);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0D1117' }}>
      <Navbar />

      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#E6EDF3' }}>
            {lang === 'tr' ? 'Görüşler & İçgörüler' : 'Insights & Analytics'}
          </h1>
          <p style={{ color: '#8B949E' }}>
            {lang === 'tr'
              ? 'Mülakat kalitesi ve soru etkinliğini analiz edin'
              : 'Analyze interview quality and question effectiveness'}
          </p>
        </div>

        {loading ? (
          <div style={{ color: '#8B949E' }} className="text-center py-12">
            {lang === 'tr' ? 'Veriler yükleniyor...' : 'Loading data...'}
          </div>
        ) : !data ? (
          <div
            className="rounded-lg p-8 text-center"
            style={{ backgroundColor: '#161B22', color: '#8B949E' }}
          >
            {lang === 'tr'
              ? 'Henüz yeterli veri yok. Daha fazla mülakat tamamlayın.'
              : 'Not enough data yet. Complete more interviews.'}
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div
                className="rounded-lg p-6"
                style={{ backgroundColor: '#161B22', borderColor: '#30363D', borderWidth: '1px' }}
              >
                <p style={{ color: '#8B949E' }} className="text-sm font-medium mb-2">
                  {lang === 'tr' ? 'Toplam Mülakatlar' : 'Total Interviews'}
                </p>
                <p style={{ color: '#E6EDF3' }} className="text-2xl font-bold">
                  {data.total_interviews}
                </p>
              </div>

              <div
                className="rounded-lg p-6"
                style={{ backgroundColor: '#161B22', borderColor: '#30363D', borderWidth: '1px' }}
              >
                <p style={{ color: '#8B949E' }} className="text-sm font-medium mb-2">
                  {lang === 'tr' ? 'Ortalama Puan' : 'Average Score'}
                </p>
                <p style={{ color: '#E6EDF3' }} className="text-2xl font-bold">
                  {data.avg_score != null ? data.avg_score.toFixed(2) : '—'}
                </p>
              </div>

              <div
                className="rounded-lg p-6"
                style={{ backgroundColor: '#161B22', borderColor: '#30363D', borderWidth: '1px' }}
              >
                <p style={{ color: '#8B949E' }} className="text-sm font-medium mb-2">
                  {lang === 'tr' ? 'Analiz Edilen Konular' : 'Topics Analyzed'}
                </p>
                <p style={{ color: '#E6EDF3' }} className="text-2xl font-bold">
                  {data.effectiveness?.length || 0}
                </p>
              </div>
            </div>

            {/* Variant Selector */}
            {variants.length > 0 && (
              <div className="mb-8">
                <label style={{ color: '#E6EDF3' }} className="block text-sm font-medium mb-2">
                  {lang === 'tr' ? 'Varyant Seç' : 'Select Variant'}
                </label>
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="px-4 py-2 rounded-lg w-full md:w-64"
                  style={{
                    backgroundColor: '#161B22',
                    borderColor: '#30363D',
                    borderWidth: '1px',
                    color: '#E6EDF3',
                  }}
                >
                  <option value="all">{lang === 'tr' ? 'Tümü' : 'All'}</option>
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Question Effectiveness Table */}
            <div className="mb-8">
              <h2 style={{ color: '#E6EDF3' }} className="text-xl font-bold mb-4">
                {lang === 'tr' ? 'Soru Etkinliği' : 'Question Effectiveness'}
              </h2>
              <div
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: '#161B22', borderColor: '#30363D', borderWidth: '1px' }}
              >
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#0D1117', borderBottomColor: '#30363D', borderBottomWidth: '1px' }}>
                      <th className="px-6 py-3 text-left" style={{ color: '#8B949E' }}>
                        {lang === 'tr' ? 'Konu' : 'Topic'}
                      </th>
                      <th className="px-6 py-3 text-left" style={{ color: '#8B949E' }}>
                        {lang === 'tr' ? 'Sorulan Sayı' : 'Times Asked'}
                      </th>
                      <th className="px-6 py-3 text-left" style={{ color: '#8B949E' }}>
                        {lang === 'tr' ? 'Ort. Derinlik' : 'Avg Depth'}
                      </th>
                      <th className="px-6 py-3 text-left" style={{ color: '#8B949E' }}>
                        {lang === 'tr' ? 'Ayırım Puanı' : 'Discrimination Score'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.effectiveness || []).map((insight, idx) => (
                      <tr
                        key={idx}
                        style={{ borderBottomColor: '#30363D', borderBottomWidth: '1px' }}
                      >
                        <td className="px-6 py-4" style={{ color: '#E6EDF3' }}>
                          {getTopicName(insight.topic, lang)}
                        </td>
                        <td className="px-6 py-4" style={{ color: '#E6EDF3' }}>
                          {insight.times_asked}
                        </td>
                        <td className="px-6 py-4" style={{ color: '#E6EDF3' }}>
                          {insight.avg_answer_depth.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: `${getDiscriminationColor(insight.discrimination)}20`,
                              color: getDiscriminationColor(insight.discrimination),
                            }}
                          >
                            {insight.discrimination.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Parameter Suggestions */}
            {data.suggestions && data.suggestions.length > 0 && (
              <div>
                <h2 style={{ color: '#E6EDF3' }} className="text-xl font-bold mb-4">
                  {lang === 'tr' ? 'Parametre Önerileri' : 'Parameter Suggestions'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg p-6"
                      style={{ backgroundColor: '#161B22', borderColor: '#30363D', borderWidth: '1px' }}
                    >
                      <div className="mb-4">
                        <p style={{ color: '#8B949E' }} className="text-xs uppercase font-semibold mb-1">
                          {suggestion.type}
                        </p>
                        <p style={{ color: '#E6EDF3' }} className="text-lg font-bold mb-2">
                          {getTopicName(suggestion.topic, lang)}
                        </p>
                        <p style={{ color: '#8B949E' }} className="text-sm mb-4">
                          {suggestion.reason}
                        </p>
                      </div>

                      <div
                        className="rounded p-3 mb-4"
                        style={{ backgroundColor: '#0D1117', borderColor: '#30363D', borderWidth: '1px' }}
                      >
                        <p style={{ color: '#8B949E' }} className="text-xs mb-1">
                          {lang === 'tr' ? 'Mevcut' : 'Current'}
                        </p>
                        <p style={{ color: '#58A6FF' }} className="font-mono text-sm">
                          {suggestion.current}
                        </p>
                        <p style={{ color: '#8B949E' }} className="text-xs mt-2 mb-1">
                          {lang === 'tr' ? 'Önerilen' : 'Suggested'}
                        </p>
                        <p style={{ color: '#3FB950' }} className="font-mono text-sm">
                          {suggestion.suggested}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(idx)}
                          className="flex-1 px-4 py-2 rounded-lg font-medium text-sm"
                          style={{
                            backgroundColor: '#238636',
                            color: '#FFFFFF',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = '#2ea043')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = '#238636')
                          }
                        >
                          {lang === 'tr' ? 'Onayla' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(idx)}
                          className="flex-1 px-4 py-2 rounded-lg font-medium text-sm"
                          style={{
                            backgroundColor: '#da3633',
                            color: '#FFFFFF',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = '#f85149')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = '#da3633')
                          }
                        >
                          {lang === 'tr' ? 'Reddet' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
