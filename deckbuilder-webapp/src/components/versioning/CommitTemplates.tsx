import React from 'react';
import type { CommitTemplate } from '../../types/versioning';
import { DEFAULT_COMMIT_TEMPLATES } from '../../constants/commitTemplates';
import { formatTemplatePreview } from '../../utils/commitMessageUtils';

interface CommitTemplatesProps {
  onSelectTemplate: (template: CommitTemplate) => void;
  selectedTemplateId?: string;
}

/**
 * Component to display commit message template options
 * Based on Requirements 9.1, 9.2, 9.3
 */
export const CommitTemplates: React.FC<CommitTemplatesProps> = ({
  onSelectTemplate,
  selectedTemplateId,
}) => {
  // Group templates by category
  const templatesByCategory = DEFAULT_COMMIT_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, CommitTemplate[]>);

  const categoryLabels: Record<string, string> = {
    testing: 'Testing',
    optimization: 'Optimization',
    meta: 'Meta Adaptation',
    custom: 'General',
  };

  return (
    <div className="commit-templates">
      <label className="commit-templates-label">
        Quick Templates
      </label>
      
      <div className="commit-templates-grid">
        {Object.entries(templatesByCategory).map(([category, templates]) => (
          <div key={category} className="template-category">
            <h4 className="template-category-title">
              {categoryLabels[category] || category}
            </h4>
            
            <div className="template-buttons">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`template-button ${
                    selectedTemplateId === template.id ? 'selected' : ''
                  }`}
                  onClick={() => onSelectTemplate(template)}
                  title={formatTemplatePreview(template.template)}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .commit-templates {
          margin-bottom: 1rem;
        }

        .commit-templates-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .commit-templates-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .template-category {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.75rem;
          background-color: #f9fafb;
        }

        .template-category-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .template-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .template-button {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background-color: white;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .template-button:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .template-button.selected {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .template-button:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};
