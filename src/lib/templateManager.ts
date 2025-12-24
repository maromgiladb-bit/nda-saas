import Handlebars from 'handlebars';
import { TEMPLATE_CONFIG, getTemplateContent } from './bundledTemplates.generated';

// Template configuration structure
export interface TemplateConfig {
  id: string;
  name: string;
  version: string;
  category: 'mutual' | 'one-way' | 'custom';
  description: string;
  templateFile: string;
  isActive: boolean;
  requiredFields: string[];
  optionalFields: string[];
  defaultValues: Record<string, string>;
  previewImage?: string;
  tags: string[];
  changelog?: string; // Optional link to changelog section
  deprecated?: boolean; // Mark as deprecated but keep for old drafts
  replacedBy?: string; // ID of template that replaces this one
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

export interface FieldDefinition {
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea';
  description: string;
}

export interface TemplateRegistry {
  templates: TemplateConfig[];
  fieldDefinitions: Record<string, FieldDefinition>;
}

// Cache for compiled templates
const compiledTemplateCache = new Map<string, HandlebarsTemplateDelegate>();
let templateRegistry: TemplateRegistry | null = null;

/**
 * Load template configuration (now uses bundled config)
 */
export function getTemplateRegistry(): TemplateRegistry {
  if (templateRegistry) {
    return templateRegistry;
  }

  // Use bundled config instead of filesystem access
  templateRegistry = TEMPLATE_CONFIG as unknown as TemplateRegistry;
  return templateRegistry;
}

/**
 * Get all active templates
 */
export function getActiveTemplates(): TemplateConfig[] {
  const registry = getTemplateRegistry();
  return registry.templates.filter(t => t.isActive);
}

/**
 * Get a specific template by ID
 */
export function getTemplateById(templateId: string): TemplateConfig | null {
  const registry = getTemplateRegistry();
  return registry.templates.find(t => t.id === templateId) || null;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): TemplateConfig[] {
  const registry = getTemplateRegistry();
  return registry.templates.filter(t => t.category === category && t.isActive);
}

/**
 * Get field definitions for a template
 */
export function getTemplateFields(templateId: string): {
  required: Record<string, FieldDefinition>;
  optional: Record<string, FieldDefinition>;
} {
  const template = getTemplateById(templateId);
  const registry = getTemplateRegistry();

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const required: Record<string, FieldDefinition> = {};
  const optional: Record<string, FieldDefinition> = {};

  template.requiredFields.forEach(fieldName => {
    if (registry.fieldDefinitions[fieldName]) {
      required[fieldName] = registry.fieldDefinitions[fieldName];
    }
  });

  template.optionalFields.forEach(fieldName => {
    if (registry.fieldDefinitions[fieldName]) {
      optional[fieldName] = registry.fieldDefinitions[fieldName];
    }
  });

  return { required, optional };
}

/**
 * Get compiled Handlebars template by template ID
 * Uses caching for performance
 */
export function getCompiledTemplate(templateId: string): HandlebarsTemplateDelegate {
  // Check cache first
  if (compiledTemplateCache.has(templateId)) {
    return compiledTemplateCache.get(templateId)!;
  }

  // Get template config
  const templateConfig = getTemplateById(templateId);
  if (!templateConfig) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Get bundled template content (no filesystem access needed)
  const templateSource = getTemplateContent(templateId);
  if (!templateSource) {
    throw new Error(`Template content not found: ${templateId}. Run 'npm run generate-templates' to regenerate.`);
  }

  console.log(`📄 Loading bundled template: ${templateId}`);
  console.log(`📄 Template size: ${templateSource.length} chars`);

  // Compile and cache
  const compiled = Handlebars.compile(templateSource);
  compiledTemplateCache.set(templateId, compiled);

  return compiled;
}

/**
 * Render a template with data
 * @param templateId - The template ID from config
 * @param data - The data to fill into the template
 * @returns Rendered HTML string
 */
export function renderTemplate(templateId: string, data: Record<string, unknown>): string {
  const template = getCompiledTemplate(templateId);
  const templateConfig = getTemplateById(templateId);

  if (!templateConfig) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Merge with default values
  const mergedData = {
    ...templateConfig.defaultValues,
    ...data
  };

  // Validate required fields
  const missingFields = templateConfig.requiredFields.filter(
    field => !mergedData[field] || (typeof mergedData[field] === 'string' && (mergedData[field] as string).trim() === '')
  );

  if (missingFields.length > 0) {
    console.warn(`⚠️ Missing required fields for template ${templateId}:`, missingFields);
    // Don't throw - allow rendering with placeholders
  }

  return template(mergedData);
}

/**
 * Validate data against template requirements
 */
export function validateTemplateData(
  templateId: string,
  data: Record<string, unknown>
): { isValid: boolean; errors: string[] } {
  const templateConfig = getTemplateById(templateId);

  if (!templateConfig) {
    return { isValid: false, errors: [`Template not found: ${templateId}`] };
  }

  const errors: string[] = [];

  // Check required fields
  templateConfig.requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Clear template cache (useful for development/hot reload)
 */
export function clearTemplateCache(): void {
  compiledTemplateCache.clear();
  templateRegistry = null;
}

/**
 * Get template preview data (mock data for testing)
 */
export function getTemplatePreviewData(templateId: string): Record<string, string> {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const registry = getTemplateRegistry();
  const previewData: Record<string, string> = { ...template.defaultValues };

  // Add sample data for all fields
  [...template.requiredFields, ...template.optionalFields].forEach(fieldName => {
    const fieldDef = registry.fieldDefinitions[fieldName];
    if (!previewData[fieldName] && fieldDef) {
      // Generate sample data based on field type
      switch (fieldDef.type) {
        case 'email':
          previewData[fieldName] = 'example@company.com';
          break;
        case 'tel':
          previewData[fieldName] = '+1-555-123-4567';
          break;
        case 'date':
          previewData[fieldName] = new Date().toISOString().split('T')[0];
          break;
        case 'number':
          previewData[fieldName] = '12';
          break;
        default:
          previewData[fieldName] = `[${fieldDef.label}]`;
      }
    }
  });

  return previewData;
}

/**
 * Get version history for a template family (e.g., all mutual-nda versions)
 */
export function getTemplateVersions(templateIdPrefix: string): TemplateConfig[] {
  const registry = getTemplateRegistry();
  return registry.templates
    .filter(t => t.id.startsWith(templateIdPrefix))
    .sort((a, b) => {
      // Sort by version number (descending)
      const versionA = parseVersion(a.version);
      const versionB = parseVersion(b.version);
      return versionB.major - versionA.major || versionB.minor - versionA.minor || versionB.patch - versionA.patch;
    });
}

/**
 * Parse version string (e.g., "3.0" or "1.2.1")
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map(p => parseInt(p, 10) || 0);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

/**
 * Get the latest version of a template family
 */
export function getLatestTemplate(templateIdPrefix: string): TemplateConfig | null {
  const versions = getTemplateVersions(templateIdPrefix);
  return versions.find(t => t.isActive) || versions[0] || null;
}

/**
 * Compare two templates and return differences
 */
export function compareTemplates(templateId1: string, templateId2: string): {
  addedFields: string[];
  removedFields: string[];
  changedDefaults: Record<string, { old: string; new: string }>;
  versionDiff: string;
} {
  const template1 = getTemplateById(templateId1);
  const template2 = getTemplateById(templateId2);

  if (!template1 || !template2) {
    throw new Error('One or both templates not found');
  }

  const allFields1 = new Set([...template1.requiredFields, ...template1.optionalFields]);
  const allFields2 = new Set([...template2.requiredFields, ...template2.optionalFields]);

  const addedFields = [...allFields2].filter(f => !allFields1.has(f));
  const removedFields = [...allFields1].filter(f => !allFields2.has(f));

  const changedDefaults: Record<string, { old: string; new: string }> = {};
  Object.keys(template1.defaultValues).forEach(key => {
    if (template2.defaultValues[key] && template1.defaultValues[key] !== template2.defaultValues[key]) {
      changedDefaults[key] = {
        old: template1.defaultValues[key],
        new: template2.defaultValues[key]
      };
    }
  });

  const v1 = parseVersion(template1.version);
  const v2 = parseVersion(template2.version);
  let versionDiff = 'same';
  if (v2.major > v1.major) versionDiff = 'major';
  else if (v2.minor > v1.minor) versionDiff = 'minor';
  else if (v2.patch > v1.patch) versionDiff = 'patch';

  return {
    addedFields,
    removedFields,
    changedDefaults,
    versionDiff
  };
}

/**
 * Get template metadata for tracking
 */
export function getTemplateMetadata(templateId: string): {
  id: string;
  version: string;
  lastModified?: string;
  isDeprecated: boolean;
  replacementId?: string;
} {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  return {
    id: template.id,
    version: template.version,
    lastModified: template.updatedAt,
    isDeprecated: template.deprecated || false,
    replacementId: template.replacedBy
  };
}
