# Annotation Templates

This document describes the annotation template system for card change annotations.

## Overview

The annotation template system provides quick, reusable reasons for card changes. It includes:
- **Default templates**: Pre-defined templates covering common scenarios
- **Custom templates**: User-created templates stored in localStorage

## Default Templates

Default templates are defined in `annotationTemplates.ts` and organized by category:

### Categories
- **Testing**: For experimental card changes
- **Meta**: For meta-game adaptations
- **Performance**: For performance-based decisions
- **Synergy**: For synergy and combo improvements
- **Cost**: For mana curve and budget adjustments

### Examples
- "Testing this card"
- "Adapting to meta shift"
- "Card underperformed in testing"
- "Part of combo strategy"
- "Mana curve adjustment"

## Custom Templates

Users can create custom templates that are stored in localStorage and persist across sessions.

### Usage

```typescript
import { useAnnotationTemplates } from '../hooks/useAnnotationTemplates';

function MyComponent() {
  const { 
    templates,           // All templates (default + custom)
    customTemplates,     // Only custom templates
    addCustomTemplate,   // Add a new custom template
    removeCustomTemplate,// Remove a custom template
    editCustomTemplate,  // Edit a custom template
    isCustom,           // Check if template is custom
  } = useAnnotationTemplates();

  // Add a custom template
  const newTemplate = addCustomTemplate({
    label: 'Budget upgrade',
    reason: 'Upgraded to better card within budget',
    category: 'cost',
  });

  // Remove a custom template
  removeCustomTemplate(templateId);

  // Edit a custom template
  editCustomTemplate(templateId, {
    label: 'New label',
    reason: 'Updated reason',
  });
}
```

### Utility Functions

Direct utility functions are available in `utils/annotationTemplateUtils.ts`:

```typescript
import {
  getAllAnnotationTemplates,
  getCustomAnnotationTemplates,
  saveCustomAnnotationTemplate,
  deleteCustomAnnotationTemplate,
  updateCustomAnnotationTemplate,
  clearCustomAnnotationTemplates,
  isCustomTemplate,
} from '../utils/annotationTemplateUtils';
```

## Storage

Custom templates are stored in localStorage under the key:
```
deckbuilder:customAnnotationTemplates
```

The data is stored as a JSON array of `AnnotationTemplate` objects.

## Integration

The `CardChangeAnnotator` component automatically uses all templates (default + custom) when displaying template options to users.

## Validation

Templates are validated to ensure:
- Required fields are present (id, label, reason, category)
- Category is one of: testing, meta, performance, synergy, cost
- Data structure is correct

Invalid templates are filtered out when loading from localStorage.

## Error Handling

All localStorage operations include try-catch blocks to handle:
- Storage quota exceeded
- Invalid JSON
- Browser privacy settings blocking localStorage
- Corrupted data

Errors are logged to console but don't break the application.
