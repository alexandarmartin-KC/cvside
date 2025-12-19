'use client';

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

type DesignPanelProps = {
  templates: Template[];
  colors: ColorTheme[];
  selectedTemplate: string;
  selectedColor: string;
  onTemplateChange: (templateId: string) => void;
  onColorChange: (colorId: string) => void;
  onExportPDF: () => void;
  onExportDOCX: () => void;
  onSave: () => void;
};

export function DesignPanel({
  templates,
  colors,
  selectedTemplate,
  selectedColor,
  onTemplateChange,
  onColorChange,
  onExportPDF,
  onExportDOCX,
  onSave,
}: DesignPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 sticky top-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Style Your CV
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Choose Template
          </label>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onTemplateChange(template.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition ${
                  selectedTemplate === template.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {template.display_name}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                  {selectedTemplate === template.id && (
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Theme */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Color Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((color) => (
              <button
                key={color.id}
                onClick={() => onColorChange(color.id)}
                className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                  selectedColor === color.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                title={color.name}
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-200"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-xs text-gray-700 text-center leading-tight">
                  {color.name.split(' ')[0]}
                </span>
                {selectedColor === color.id && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 pt-6 space-y-3">
          <button
            onClick={onSave}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save CV Version
          </button>

          <button
            onClick={onExportPDF}
            className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Download PDF
          </button>

          <button
            onClick={onExportDOCX}
            className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download DOCX
          </button>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-xs text-blue-900">
              <p className="font-medium mb-1">Pro Tips:</p>
              <ul className="space-y-1 list-disc list-inside text-blue-800">
                <li>Click any text to edit it</li>
                <li>Use action verbs in bullets</li>
                <li>Quantify achievements</li>
                <li>Keep it concise</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
