import { useState, useEffect, useCallback } from 'react';
import type { AnnotationTemplate } from '../types/versioning';
import {
  getAllAnnotationTemplates,
  getCustomAnnotationTemplates,
  saveCustomAnnotationTemplate,
  deleteCustomAnnotationTemplate,
  updateCustomAnnotationTemplate,
  isCustomTemplate,
} from '../utils/annotationTemplateUtils';

/**
 * Hook for managing annotation templates (default + custom)
 */
export function useAnnotationTemplates() {
  const [templates, setTemplates] = useState<AnnotationTemplate[]>([]);
  const [customTemplates, setCustomTemplates] = useState<AnnotationTemplate[]>([]);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = useCallback(() => {
    const allTemplates = getAllAnnotationTemplates();
    const custom = getCustomAnnotationTemplates();
    setTemplates(allTemplates);
    setCustomTemplates(custom);
  }, []);

  const addCustomTemplate = useCallback(
    (template: Omit<AnnotationTemplate, 'id'>) => {
      try {
        const newTemplate = saveCustomAnnotationTemplate(template);
        loadTemplates();
        return newTemplate;
      } catch (error) {
        console.error('Failed to add custom template:', error);
        throw error;
      }
    },
    [loadTemplates]
  );

  const removeCustomTemplate = useCallback(
    (templateId: string) => {
      try {
        deleteCustomAnnotationTemplate(templateId);
        loadTemplates();
      } catch (error) {
        console.error('Failed to remove custom template:', error);
        throw error;
      }
    },
    [loadTemplates]
  );

  const editCustomTemplate = useCallback(
    (templateId: string, updates: Partial<Omit<AnnotationTemplate, 'id'>>) => {
      try {
        updateCustomAnnotationTemplate(templateId, updates);
        loadTemplates();
      } catch (error) {
        console.error('Failed to edit custom template:', error);
        throw error;
      }
    },
    [loadTemplates]
  );

  const isCustom = useCallback((templateId: string) => {
    return isCustomTemplate(templateId);
  }, []);

  return {
    templates,
    customTemplates,
    addCustomTemplate,
    removeCustomTemplate,
    editCustomTemplate,
    isCustom,
    refresh: loadTemplates,
  };
}
