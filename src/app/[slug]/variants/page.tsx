'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import ParameterEditor from '@/components/ParameterEditor';
import { InterviewParameters, VARIANT_PRESETS, DEFAULT_PARAMETERS, HIGH_SCHOOL_SYSTEM_PROMPT, CODING_EDUCATION_SYSTEM_PROMPT } from '@/lib/interview-parameters';

interface Program {
  id: string;
  slug: string;
  name: string;
}

interface Variant {
  id: string;
  program_id: string;
  name: string;
  slug: string;
  targeting: { founder_type: string; stage: string; region: string | null; custom_label: string | null };
  interview_count: number;
  avg_score: number | null;
  parameters: InterviewParameters;
  self_improvement_config: { enabled: boolean; aggressiveness: string; auto_apply: boolean; min_interviews: number; optimize_for: string };
  interview_link?: string;
  is_default: boolean;
  created_at: string;
}

interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  variantId?: string;
  data: ModalData;
}

interface ModalData {
  name: string;
  slug: string;
  founder_type: string;
  stage: string;
  parameters: InterviewParameters;
  self_improvement: boolean;
  system_prompt_override: string | null;
}


export default function VariantsPage() {
  const params = useParams();
  const { lang } = useLanguage();
  const slug = params.slug as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
    data: {
      name: '',
      slug: '',
      founder_type: 'all',
      stage: 'all',
      parameters: DEFAULT_PARAMETERS,
      self_improvement: false,
      system_prompt_override: null,
    },
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  // Load program and variants
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load program by slug
        const { data: programData, error: programError } = await supabase
          .from('programs')
          .select('id, slug, name')
          .eq('slug', slug)
          .single();

        if (programError) throw programError;
        setProgram(programData);

        // Load variants
        if (programData) {
          const response = await fetch(
            `/api/variants?program_id=${programData.id}`
          );
          const data = await response.json();
          setVariants(data.variants || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadData();
    }
  }, [slug, supabase]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (name: string) => {
    setModal((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        name,
        slug: generateSlug(name),
      },
    }));
  };

  const applyPreset = (presetKey: string) => {
    const preset = VARIANT_PRESETS[presetKey as keyof typeof VARIANT_PRESETS];
    if (preset) {
      setModal((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          name: prev.data.name || (preset.targeting.custom_label || presetKey),
          slug: prev.data.slug || presetKey,
          founder_type: preset.targeting.founder_type,
          stage: preset.targeting.stage,
          parameters: { ...DEFAULT_PARAMETERS, ...preset.parameters },
          system_prompt_override: preset.parameters?.system_prompt_override || preset.system_prompt_override || null,
        },
      }));
    }
  };

  const openCreateModal = () => {
    setModal({
      isOpen: true,
      mode: 'create',
      data: {
        name: '',
        slug: '',
        founder_type: 'all',
        stage: 'all',
        parameters: DEFAULT_PARAMETERS,
        self_improvement: false,
        system_prompt_override: null,
      },
    });
  };

  const openEditModal = (variant: Variant) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      variantId: variant.id,
      data: {
        name: variant.name,
        slug: variant.slug,
        founder_type: variant.targeting?.founder_type || 'all',
        stage: variant.targeting?.stage || 'all',
        parameters: { ...DEFAULT_PARAMETERS, ...variant.parameters },
        self_improvement: variant.self_improvement_config?.enabled || false,
        system_prompt_override: (variant as any).system_prompt_override || null,
      },
    });
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const handleSaveVariant = async () => {
    if (!program || !modal.data.name || !modal.data.slug) return;

    try {
      const headers = await getAuthHeaders();
      const body = {
        program_id: program.id,
        name: modal.data.name,
        slug: modal.data.slug,
        targeting: {
          founder_type: modal.data.founder_type,
          stage: modal.data.stage,
          region: null,
          custom_label: null,
        },
        parameters: modal.data.parameters,
        self_improvement_config: {
          enabled: modal.data.self_improvement,
          aggressiveness: 'conservative' as const,
          auto_apply: false as const,
          min_interviews: 20,
          optimize_for: 'discrimination' as const,
        },
        system_prompt_override: modal.data.system_prompt_override,
      }

      if (modal.mode === 'create') {
        const res = await fetch('/api/variants', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create variant')

        // Reload variants
        const listRes = await fetch(`/api/variants?program_id=${program.id}`)
        const listData = await listRes.json()
        setVariants(listData.variants || [])
      } else if (modal.mode === 'edit' && modal.variantId) {
        const res = await fetch(`/api/variants/${modal.variantId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            name: body.name,
            targeting: body.targeting,
            parameters: body.parameters,
            self_improvement_config: body.self_improvement_config,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update variant')

        // Reload variants
        const listRes = await fetch(`/api/variants?program_id=${program.id}`)
        const listData = await listRes.json()
        setVariants(listData.variants || [])
      }

      setModal((prev) => ({
        ...prev,
        isOpen: false,
      }));
    } catch (error: any) {
      console.error('Error saving variant:', error)
      alert(error.message || 'Error saving variant')
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/variants/${variantId}`, { method: 'DELETE', headers })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      setVariants(variants.filter((v) => v.id !== variantId));
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting variant:', error);
      alert(error.message || 'Error deleting variant')
    }
  };

  const copyInterviewLink = async (variant: Variant) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = variant.interview_link
      ? `${baseUrl}${variant.interview_link}`
      : `${baseUrl}/${program?.slug}/interview?v=${variant.slug}`;
    try {
      await navigator.clipboard.writeText(link);
      alert(lang === 'tr' ? 'Bağlantı kopyalandı!' : 'Link copied!');
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0D1117] min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-[#8B949E]">
            {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D1117] min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#E6EDF3] mb-2">
              {program?.name}
            </h1>
            <p className="text-[#8B949E]">
              {lang === 'tr' ? 'Varyantlar' : 'Variants'}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-[#58A6FF] hover:bg-[#79C0FF] text-[#0D1117] font-semibold px-4 py-2 rounded transition"
          >
            {lang === 'tr' ? 'Yeni Varyant' : 'New Variant'}
          </button>
        </div>

        {variants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#8B949E] mb-4">
              {lang === 'tr'
                ? 'Henüz varyant oluşturulmamış'
                : 'No variants yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="bg-[#161B22] border border-[#30363D] rounded-lg p-6 hover:border-[#58A6FF] transition cursor-pointer"
                onClick={() => openEditModal(variant)}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#E6EDF3] mb-1">
                    {variant.name}
                  </h3>
                  <p className="text-xs text-[#8B949E] font-mono">
                    {variant.slug}
                  </p>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8B949E]">
                      {lang === 'tr'
                        ? 'Kurucu Tipi'
                        : 'Founder Type'}
                    </span>
                    <span className="text-[#E6EDF3]">{variant.targeting?.founder_type || 'all'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B949E]">
                      {lang === 'tr' ? 'Aşama' : 'Stage'}
                    </span>
                    <span className="text-[#E6EDF3]">{variant.targeting?.stage || 'all'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B949E]">
                      {lang === 'tr'
                        ? 'Görüşme Sayısı'
                        : 'Interviews'}
                    </span>
                    <span className="text-[#E6EDF3]">
                      {variant.interview_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B949E]">
                      {lang === 'tr' ? 'Ort. Puan' : 'Avg Score'}
                    </span>
                    <span className="text-[#E6EDF3]">
                      {variant.avg_score != null ? `${variant.avg_score.toFixed(1)}/10` : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyInterviewLink(variant);
                    }}
                    className="flex-1 bg-[#30363D] hover:bg-[#3D444D] text-[#58A6FF] text-sm py-2 rounded transition"
                  >
                    {lang === 'tr' ? 'Bağlantı Kopyala' : 'Copy Link'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(variant.id);
                    }}
                    className="flex-1 bg-[#30363D] hover:bg-[#3D444D] text-[#F85149] text-sm py-2 rounded transition"
                  >
                    {lang === 'tr' ? 'Sil' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6 max-w-sm">
            <h2 className="text-lg font-semibold text-[#E6EDF3] mb-4">
              {lang === 'tr'
                ? 'Varyantı silmek istediğinize emin misiniz?'
                : 'Are you sure you want to delete this variant?'}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-[#30363D] hover:bg-[#3D444D] text-[#E6EDF3] py-2 rounded transition"
              >
                {lang === 'tr' ? 'İptal' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDeleteVariant(deleteConfirm)}
                className="flex-1 bg-[#F85149] hover:bg-[#DA3633] text-white py-2 rounded transition"
              >
                {lang === 'tr' ? 'Sil' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Variant Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#161B22] border-b border-[#30363D] px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[#E6EDF3]">
                {modal.mode === 'create'
                  ? lang === 'tr'
                    ? 'Yeni Varyant Oluştur'
                    : 'Create New Variant'
                  : lang === 'tr'
                    ? 'Varyantı Düzenle'
                    : 'Edit Variant'}
              </h2>
              <button
                onClick={() =>
                  setModal((prev) => ({
                    ...prev,
                    isOpen: false,
                  }))
                }
                className="text-[#8B949E] hover:text-[#E6EDF3] text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">
                    {lang === 'tr' ? 'Varyant Adı' : 'Variant Name'}
                  </label>
                  <input
                    type="text"
                    value={modal.data.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
                    placeholder={
                      lang === 'tr'
                        ? 'Örn: Teknik Kurucular v1'
                        : 'E.g., Technical Founders v1'
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">
                    {lang === 'tr' ? 'Slug' : 'Slug'}
                  </label>
                  <input
                    type="text"
                    value={modal.data.slug}
                    onChange={(e) =>
                      setModal((prev) => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          slug: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none font-mono text-sm"
                  />
                </div>
              </div>

              {/* Targeting */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">
                    {lang === 'tr' ? 'Kurucu Tipi' : 'Founder Type'}
                  </label>
                  <select
                    value={modal.data.founder_type}
                    onChange={(e) =>
                      setModal((prev) => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          founder_type: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
                  >
                    <option value="all">
                      {lang === 'tr' ? 'Tümü' : 'All'}
                    </option>
                    <option value="technical">
                      {lang === 'tr' ? 'Teknik' : 'Technical'}
                    </option>
                    <option value="business">
                      {lang === 'tr' ? 'İş' : 'Business'}
                    </option>
                    <option value="creative">
                      {lang === 'tr' ? 'Yaratıcı' : 'Creative'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">
                    {lang === 'tr' ? 'Aşama' : 'Stage'}
                  </label>
                  <select
                    value={modal.data.stage}
                    onChange={(e) =>
                      setModal((prev) => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          stage: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
                  >
                    <option value="all">
                      {lang === 'tr' ? 'Tümü' : 'All'}
                    </option>
                    <option value="idea">
                      {lang === 'tr' ? 'Fikir' : 'Idea'}
                    </option>
                    <option value="pre-seed">
                      {lang === 'tr' ? 'Ön-Tohum' : 'Pre-Seed'}
                    </option>
                    <option value="seed">
                      {lang === 'tr' ? 'Tohum' : 'Seed'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Preset Buttons */}
              <div>
                <p className="text-sm font-medium text-[#E6EDF3] mb-2">
                  {lang === 'tr' ? 'Hızlı Ön Ayarlar' : 'Quick Presets'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => applyPreset('high-school')}
                    className="bg-[#238636] hover:bg-[#2ea043] text-white text-sm px-3 py-2 rounded transition font-medium"
                  >
                    {lang === 'tr'
                      ? 'Lise Öğrencileri'
                      : 'High School Students'}
                  </button>
                  <button
                    onClick={() => applyPreset('coding-education')}
                    className="bg-[#1F6FEB] hover:bg-[#388BFD] text-white text-sm px-3 py-2 rounded transition font-medium"
                  >
                    {lang === 'tr'
                      ? 'Kodlama Eğitimi Keşif'
                      : 'Coding Education Discovery'}
                  </button>
                  <button
                    onClick={() => applyPreset('technical-founders')}
                    className="bg-[#30363D] hover:bg-[#3D444D] text-[#58A6FF] text-sm px-3 py-2 rounded transition"
                  >
                    {lang === 'tr'
                      ? 'Teknik Kurucular'
                      : 'Technical Founders'}
                  </button>
                  <button
                    onClick={() => applyPreset('business-founders')}
                    className="bg-[#30363D] hover:bg-[#3D444D] text-[#58A6FF] text-sm px-3 py-2 rounded transition"
                  >
                    {lang === 'tr'
                      ? 'İş Geliştiriciler'
                      : 'Business Developers'}
                  </button>
                  <button
                    onClick={() => applyPreset('early-stage')}
                    className="bg-[#30363D] hover:bg-[#3D444D] text-[#58A6FF] text-sm px-3 py-2 rounded transition"
                  >
                    {lang === 'tr' ? 'Erken Aşama' : 'Early Stage'}
                  </button>
                </div>
              </div>

              {/* Parameter Editor */}
              <div>
                <ParameterEditor
                  parameters={modal.data.parameters}
                  onChange={(params) =>
                    setModal((prev) => ({
                      ...prev,
                      data: {
                        ...prev.data,
                        parameters: params,
                      },
                    }))
                  }
                />
              </div>

              {/* Self Improvement Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="self-improvement"
                  checked={modal.data.self_improvement}
                  onChange={(e) =>
                    setModal((prev) => ({
                      ...prev,
                      data: {
                        ...prev.data,
                        self_improvement: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 rounded border-[#30363D] bg-[#0D1117] cursor-pointer"
                />
                <label
                  htmlFor="self-improvement"
                  className="text-sm text-[#E6EDF3] cursor-pointer"
                >
                  {lang === 'tr'
                    ? 'Kendini İyileştirme Modu'
                    : 'Self-Improvement Mode'}
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#161B22] border-t border-[#30363D] px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() =>
                  setModal((prev) => ({
                    ...prev,
                    isOpen: false,
                  }))
                }
                className="bg-[#30363D] hover:bg-[#3D444D] text-[#E6EDF3] px-4 py-2 rounded transition"
              >
                {lang === 'tr' ? 'İptal' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveVariant}
                disabled={!modal.data.name || !modal.data.slug}
                className="bg-[#58A6FF] hover:bg-[#79C0FF] disabled:opacity-50 disabled:cursor-not-allowed text-[#0D1117] font-semibold px-4 py-2 rounded transition"
              >
                {lang === 'tr' ? 'Kaydet' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
