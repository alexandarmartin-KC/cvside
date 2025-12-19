'use client';

import { useState, useEffect } from 'react';
import { CVEditor } from '@/components/CVEditor';
import { DesignPanel } from '@/components/DesignPanel';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
};

type TailoredCV = {
  name: string;
  title: string;
  summary: string;
  skills: {
    primary: string[];
    secondary: string[];
  };
  experience: Array<{
    company: string;
    role: string;
    location?: string;
    start_date: string;
    end_date: string;
    bullets: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    start_date?: string;
    end_date?: string;
  }>;
  certifications?: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
  }>;
};

type Template = {
  id: string;
  display_name: string;
  description: string;
  strengths: string[];
};

type ColorTheme = {
  id: string;
  name: string;
  hex: string;
};

type TailorResponse = {
  tailored_cv: TailoredCV;
  design_options: {
    templates: Template[];
    colors: ColorTheme[];
    photo_option: {
      enabled: boolean;
      recommended_size: string;
      shape: string;
    };
  };
  designer_panel_ui: any;
  instructions_for_user_editing: string;
};

export function TailorClient({ job }: { job: Job }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tailoredCV, setTailoredCV] = useState<TailoredCV | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [colors, setColors] = useState<ColorTheme[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('classic-clean');
  const [selectedColor, setSelectedColor] = useState('neutral-black');
  const [userNotes, setUserNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const fetchTailoredCV = async (notes?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cv/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          userNotes: notes || userNotes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to tailor CV');
      }

      const data: TailorResponse = await response.json();
      setTailoredCV(data.tailored_cv);
      setTemplates(data.design_options.templates);
      setColors(data.design_options.colors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTailoredCV();
  }, [job.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Tailoring your CV for {job.company}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => fetchTailoredCV()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!tailoredCV) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tailor CV</h1>
            <p className="text-gray-600 mt-1">
              for <span className="font-semibold">{job.title}</span> at {job.company}
            </p>
          </div>
          <a
            href="/dashboard/matches"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Jobs
          </a>
        </div>

        {/* User Notes Toggle */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {showNotes ? 'Hide' : 'Add'} Tailoring Notes
        </button>

        {showNotes && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tailoring Instructions (Optional)
            </label>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="E.g., 'Emphasize leadership experience' or 'Focus on Python skills'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <button
              onClick={() => fetchTailoredCV(userNotes)}
              disabled={loading}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              Regenerate with Notes
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CV Editor (Left - 2 columns) */}
        <div className="lg:col-span-2">
          <CVEditor
            cv={tailoredCV}
            onChange={setTailoredCV}
            template={selectedTemplate}
            color={selectedColor}
          />
        </div>

        {/* Design Panel (Right - 1 column) */}
        <div className="lg:col-span-1">
          <DesignPanel
            templates={templates}
            colors={colors}
            selectedTemplate={selectedTemplate}
            selectedColor={selectedColor}
            onTemplateChange={setSelectedTemplate}
            onColorChange={setSelectedColor}
            onExportPDF={() => {
              alert('PDF export coming soon!');
            }}
            onExportDOCX={() => {
              alert('DOCX export coming soon!');
            }}
            onSave={async () => {
              alert('Save functionality coming soon!');
            }}
          />
        </div>
      </div>
    </div>
  );
}
