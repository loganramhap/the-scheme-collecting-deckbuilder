import type { AnnotationTemplate } from '../types/versioning';
import {
  DEFAULT_ANNOTATION_TEMPLATES,
  CUSTOM_ANNOTATION_TEMPLATES_KEY,
} from '../constants/annotationTemplates';

/**
 * Get all annotation templates (default + custom)
 */
export function getAllAnnotationTemplates(): AnnotationTemplate[] {
  const customTemplates = getCustomAnnotationTemplates();
  return [...DEFAULT_ANNOTATION_TEMPLATES, ...customTemplates];
}

/**
 * Get custom annotation templates from localStorage
 */
export function getCustomAnnotationTemplates(): AnnotationTemplate[] {
  try {
    const stored = localStorage.getItem(CUSTOM_ANNOTATION_TEMPLATES_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidAnnotationTemplate);
  } catch (error) {
    console.error('Failed to load custom annotation templates:', error);
    return [];
  }
}

/**
 * Save a custom annotation template
 */
export function saveCustomAnnotationTemplate(
  template: Omit<AnnotationTemplate, 'id'>
): AnnotationTemplate {
  const customTemplates = getCustomAnnotationTemplates();
  
  // Generate unique ID
  const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const newTemplate: AnnotationTemplate = {
    ...template,
    id,
  };
  
  // Add to custom templates
  const updatedTemplates = [...customTemplates, newTemplate];
  
  try {
    localStorage.setItem(
      CUSTOM_ANNOTATION_TEMPLATES_KEY,
      JSON.stringify(updatedTemplates)
    );
  } catch (error) {
    console.error('Failed to save custom annotation template:', error);
    throw new Error('Failed to save custom template');
  }
  
  return newTemplate;
}

/**
 * Delete a custom annotation template
 */
export function deleteCustomAnnotationTemplate(templateId: string): void {
  const customTemplates = getCustomAnnotationTemplates();
  const updatedTemplates = customTemplates.filter((t) => t.id !== templateId);
  
  try {
    localStorage.setItem(
      CUSTOM_ANNOTATION_TEMPLATES_KEY,
      JSON.stringify(updatedTemplates)
    );
  } catch (error) {
    console.error('Failed to delete custom annotation template:', error);
    throw new Error('Failed to delete custom template');
  }
}

/**
 * Update a custom annotation template
 */
export function updateCustomAnnotationTemplate(
  templateId: string,
  updates: Partial<Omit<AnnotationTemplate, 'id'>>
): void {
  const customTemplates = getCustomAnnotationTemplates();
  const templateIndex = customTemplates.findIndex((t) => t.id === templateId);
  
  if (templateIndex === -1) {
    throw new Error('Template not found');
  }
  
  const updatedTemplates = [...customTemplates];
  updatedTemplates[templateIndex] = {
    ...updatedTemplates[templateIndex],
    ...updates,
  };
  
  try {
    localStorage.setItem(
      CUSTOM_ANNOTATION_TEMPLATES_KEY,
      JSON.stringify(updatedTemplates)
    );
  } catch (error) {
    console.error('Failed to update custom annotation template:', error);
    throw new Error('Failed to update custom template');
  }
}

/**
 * Clear all custom annotation templates
 */
export function clearCustomAnnotationTemplates(): void {
  try {
    localStorage.removeItem(CUSTOM_ANNOTATION_TEMPLATES_KEY);
  } catch (error) {
    console.error('Failed to clear custom annotation templates:', error);
  }
}

/**
 * Validate annotation template structure
 */
function isValidAnnotationTemplate(template: any): template is AnnotationTemplate {
  return (
    typeof template === 'object' &&
    template !== null &&
    typeof template.id === 'string' &&
    typeof template.label === 'string' &&
    typeof template.reason === 'string' &&
    typeof template.category === 'string' &&
    ['testing', 'meta', 'performance', 'synergy', 'cost'].includes(template.category)
  );
}

/**
 * Check if a template is a custom template (not a default one)
 */
export function isCustomTemplate(templateId: string): boolean {
  return templateId.startsWith('custom-');
}
