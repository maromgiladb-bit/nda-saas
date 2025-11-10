import { renderTemplate, getTemplateById } from './templateManager'

import Handlebars from "handlebars";

Handlebars.registerHelper("ph", function (value: unknown, label: string) {
  const s = typeof value === "string" ? value.trim() : (value ?? "").toString().trim();
  return s ? s : `[${label}]`;
});


/**
 * Render NDA HTML from form data
 * @param formData - The form data object from nda_drafts
 * @param templateId - Optional template ID (defaults to mutual-nda-v3)
 * @returns Rendered HTML string
 */
export async function renderNdaHtml(
  formData: Record<string, unknown>,
  templateId: string = 'mutual-nda-v3'
): Promise<string> {
  try {
    console.log(`📄 Rendering template: ${templateId}`)
    
    // Validate template exists
    const template = getTemplateById(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }
    
    // Prepare data with defaults
    const data = {
      ...formData,
      // Add any default values or transformations here
      current_date: formData.effective_date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
    }

    // Render using template manager
    const html = renderTemplate(templateId, data)
    
    console.log(`✅ Template rendered successfully (${html.length} chars)`)
    return html
  } catch (error) {
    console.error('❌ Error rendering NDA HTML:', error)
    throw error
  }
}

