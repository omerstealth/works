'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { InterviewParameters } from '@/lib/interview-parameters';

interface ParameterEditorProps {
  parameters: InterviewParameters;
  onChange: (parameters: InterviewParameters) => void;
}

type FocusAreaKey =
  | 'problem_clarity'
  | 'ai_nativeness'
  | 'technical_depth'
  | 'market_awareness'
  | 'founder_energy'
  | 'program_fit';

type DepthLevelKey =
  | 'problem_clarity'
  | 'ai_nativeness'
  | 'technical_depth'
  | 'market_awareness'
  | 'founder_energy'
  | 'program_fit';

interface CollapsibleState {
  focusAreas: boolean;
  questionCount: boolean;
  interviewStyle: boolean;
  depthLevels: boolean;
  evaluationThresholds: boolean;
}

const focusAreaLabels: Record<FocusAreaKey, { tr: string; en: string }> = {
  problem_clarity: { tr: 'Problem Netliği', en: 'Problem Clarity' },
  ai_nativeness: { tr: 'AI Yatkınlığı', en: 'AI Nativeness' },
  technical_depth: { tr: 'Teknik Derinlik', en: 'Technical Depth' },
  market_awareness: { tr: 'Pazar Farkındalığı', en: 'Market Awareness' },
  founder_energy: { tr: 'Kurucu Enerjisi', en: 'Founder Energy' },
  program_fit: { tr: 'Program Uyumu', en: 'Program Fit' },
};

const getWeightColor = (weight: number): string => {
  if (weight >= 2.0) return '#3fb950'; // green
  if (weight >= 1.5) return '#58a6ff'; // blue
  return '#f85149'; // red
};

export default function ParameterEditor({
  parameters,
  onChange,
}: ParameterEditorProps) {
  const { lang } = useLanguage();
  const [collapsed, setCollapsed] = useState<CollapsibleState>({
    focusAreas: false,
    questionCount: false,
    interviewStyle: false,
    depthLevels: false,
    evaluationThresholds: false,
  });

  const toggleSection = (section: keyof CollapsibleState) => {
    setCollapsed((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateFocusArea = (key: FocusAreaKey, value: number) => {
    onChange({
      ...parameters,
      focus_areas: {
        ...parameters.focus_areas,
        [key]: value,
      },
    });
  };

  const updateDepthLevel = (key: DepthLevelKey, value: string) => {
    onChange({
      ...parameters,
      depth_levels: {
        ...parameters.depth_levels,
        [key]: value as 'surface' | 'medium' | 'deep',
      },
    });
  };

  const updateQuestionCount = (
    field: 'min' | 'max',
    value: number
  ) => {
    onChange({
      ...parameters,
      ...(field === 'min' ? { min_questions: value } : { max_questions: value }),
    });
  };

  const updateInterviewStyle = (
    field: 'strictness' | 'tone',
    value: string
  ) => {
    onChange({
      ...parameters,
      ...(field === 'strictness' ? { strictness: value as 'light' | 'medium' | 'strict' } : { tone: value as 'formal' | 'warm' | 'casual' }),
    });
  };

  const updateEvaluationThreshold = (
    field: 'high' | 'pass',
    value: number
  ) => {
    onChange({
      ...parameters,
      eval_thresholds: {
        ...parameters.eval_thresholds,
        [field]: value,
      },
    });
  };

  const focusAreaKeys: FocusAreaKey[] = [
    'problem_clarity',
    'ai_nativeness',
    'technical_depth',
    'market_awareness',
    'founder_energy',
    'program_fit',
  ];

  return (
    <div className="space-y-4">
      {/* Focus Areas */}
      <div className="border border-[#30363D] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('focusAreas')}
          className="w-full bg-[#0D1117] hover:bg-[#161B22] px-4 py-3 flex items-center justify-between text-[#E6EDF3] font-medium transition"
        >
          <span>{lang === 'tr' ? 'Odak Alanları' : 'Focus Areas'}</span>
          <span className="text-[#8B949E]">
            {collapsed.focusAreas ? '▶' : '▼'}
          </span>
        </button>

        {!collapsed.focusAreas && (
          <div className="bg-[#161B22] px-4 py-4 space-y-4 border-t border-[#30363D]">
            {focusAreaKeys.map((key) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#E6EDF3]">
                    {focusAreaLabels[key][lang as 'tr' | 'en']}
                  </label>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: getWeightColor(parameters.focus_areas[key]) }}
                  >
                    {parameters.focus_areas[key].toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={parameters.focus_areas[key]}
                  onChange={(e) =>
                    updateFocusArea(key, parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-[#0D1117] border border-[#30363D] rounded-lg appearance-none cursor-pointer accent-[#58A6FF]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question Count */}
      <div className="border border-[#30363D] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('questionCount')}
          className="w-full bg-[#0D1117] hover:bg-[#161B22] px-4 py-3 flex items-center justify-between text-[#E6EDF3] font-medium transition"
        >
          <span>{lang === 'tr' ? 'Soru Sayısı' : 'Question Count'}</span>
          <span className="text-[#8B949E]">
            {collapsed.questionCount ? '▶' : '▼'}
          </span>
        </button>

        {!collapsed.questionCount && (
          <div className="bg-[#161B22] px-4 py-4 space-y-4 border-t border-[#30363D]">
            <div>
              <label className="text-sm font-medium text-[#E6EDF3] block mb-2">
                {lang === 'tr' ? 'Minimum' : 'Minimum'} ({parameters.min_questions})
              </label>
              <input
                type="number"
                min="4"
                max="8"
                value={parameters.min_questions}
                onChange={(e) =>
                  updateQuestionCount('min', parseInt(e.target.value, 10))
                }
                className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#E6EDF3] block mb-2">
                {lang === 'tr' ? 'Maksimum' : 'Maximum'} ({parameters.max_questions})
              </label>
              <input
                type="number"
                min="6"
                max="20"
                value={parameters.max_questions}
                onChange={(e) =>
                  updateQuestionCount('max', parseInt(e.target.value, 10))
                }
                className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Interview Style */}
      <div className="border border-[#30363D] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('interviewStyle')}
          className="w-full bg-[#0D1117] hover:bg-[#161B22] px-4 py-3 flex items-center justify-between text-[#E6EDF3] font-medium transition"
        >
          <span>{lang === 'tr' ? 'Görüşme Stili' : 'Interview Style'}</span>
          <span className="text-[#8B949E]">
            {collapsed.interviewStyle ? '▶' : '▼'}
          </span>
        </button>

        {!collapsed.interviewStyle && (
          <div className="bg-[#161B22] px-4 py-4 space-y-6 border-t border-[#30363D]">
            <div>
              <label className="text-sm font-medium text-[#E6EDF3] block mb-3">
                {lang === 'tr' ? 'Katılık' : 'Strictness'}
              </label>
              <div className="space-y-2">
                {['light', 'medium', 'strict'].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="strictness"
                      value={option}
                      checked={parameters.strictness === option}
                      onChange={(e) =>
                        updateInterviewStyle('strictness', e.target.value)
                      }
                      className="w-4 h-4 border-[#30363D] bg-[#0D1117] accent-[#58A6FF]"
                    />
                    <span className="text-sm text-[#E6EDF3]">
                      {option === 'light'
                        ? lang === 'tr'
                          ? 'Hafif'
                          : 'Light'
                        : option === 'medium'
                          ? lang === 'tr'
                            ? 'Orta'
                            : 'Medium'
                          : lang === 'tr'
                            ? 'Katı'
                            : 'Strict'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#E6EDF3] block mb-3">
                {lang === 'tr' ? 'Ton' : 'Tone'}
              </label>
              <div className="space-y-2">
                {['formal', 'warm', 'casual'].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tone"
                      value={option}
                      checked={parameters.tone === option}
                      onChange={(e) =>
                        updateInterviewStyle('tone', e.target.value)
                      }
                      className="w-4 h-4 border-[#30363D] bg-[#0D1117] accent-[#58A6FF]"
                    />
                    <span className="text-sm text-[#E6EDF3]">
                      {option === 'formal'
                        ? lang === 'tr'
                          ? 'Resmi'
                          : 'Formal'
                        : option === 'warm'
                          ? lang === 'tr'
                            ? 'Sıcak'
                            : 'Warm'
                          : lang === 'tr'
                            ? 'Rahat'
                            : 'Casual'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Depth Levels */}
      <div className="border border-[#30363D] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('depthLevels')}
          className="w-full bg-[#0D1117] hover:bg-[#161B22] px-4 py-3 flex items-center justify-between text-[#E6EDF3] font-medium transition"
        >
          <span>{lang === 'tr' ? 'Derinlik Seviyeleri' : 'Depth Levels'}</span>
          <span className="text-[#8B949E]">
            {collapsed.depthLevels ? '▶' : '▼'}
          </span>
        </button>

        {!collapsed.depthLevels && (
          <div className="bg-[#161B22] px-4 py-4 space-y-4 border-t border-[#30363D]">
            {focusAreaKeys.map((key) => (
              <div key={key}>
                <label className="text-sm font-medium text-[#E6EDF3] block mb-2">
                  {focusAreaLabels[key][lang as 'tr' | 'en']}
                </label>
                <select
                  value={parameters.depth_levels[key]}
                  onChange={(e) => updateDepthLevel(key, e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
                >
                  <option value="surface">
                    {lang === 'tr' ? 'Yüzeysel' : 'Surface'}
                  </option>
                  <option value="medium">
                    {lang === 'tr' ? 'Orta' : 'Medium'}
                  </option>
                  <option value="deep">
                    {lang === 'tr' ? 'Derin' : 'Deep'}
                  </option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evaluation Thresholds */}
      <div className="border border-[#30363D] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('evaluationThresholds')}
          className="w-full bg-[#0D1117] hover:bg-[#161B22] px-4 py-3 flex items-center justify-between text-[#E6EDF3] font-medium transition"
        >
          <span>
            {lang === 'tr' ? 'Değerlendirme Eşikleri' : 'Evaluation Thresholds'}
          </span>
          <span className="text-[#8B949E]">
            {collapsed.evaluationThresholds ? '▶' : '▼'}
          </span>
        </button>

        {!collapsed.evaluationThresholds && (
          <div className="bg-[#161B22] px-4 py-4 space-y-4 border-t border-[#30363D]">
            <div>
              <label className="text-sm font-medium text-[#E6EDF3] block mb-2">
                {lang === 'tr'
                  ? 'Yüksek Eşik'
                  : 'High Threshold'} ({parameters.eval_thresholds.high})
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={parameters.eval_thresholds.high}
                onChange={(e) =>
                  updateEvaluationThreshold(
                    'high',
                    parseInt(e.target.value, 10)
                  )
                }
                className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#E6EDF3] block mb-2">
                {lang === 'tr'
                  ? 'Geçiş Eşiği'
                  : 'Pass Threshold'} ({parameters.eval_thresholds.pass})
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={parameters.eval_thresholds.pass}
                onChange={(e) =>
                  updateEvaluationThreshold(
                    'pass',
                    parseInt(e.target.value, 10)
                  )
                }
                className="w-full bg-[#0D1117] border border-[#30363D] rounded px-3 py-2 text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
