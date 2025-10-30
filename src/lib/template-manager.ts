/**
 * Template Manager - Handles NDA template configuration
 * Makes it easy to swap templates by updating nda-config.json
 */

import fs from 'fs'
import path from 'path'

export interface FieldConfig {
  label: string
  type: 'text' | 'date' | 'number' | 'email'
  required: boolean
  placeholder?: string
  pdfFieldName?: string // Optional - for form field mode
  pdfPosition?: { page: number; x: number; y: number } // Optional - for overlay mode
  section: string
}

export interface SectionConfig {
  title: string
  order: number
}

export interface TemplateConfig {
  version: string
  templateName: string
  templateFile: string
  description: string
  fillMode?: 'overlay' | 'formFields' // New: specify fill mode
  fields: Record<string, FieldConfig>
  sections: Record<string, SectionConfig>
  notes?: string[]
}

class TemplateManager {
  private config: TemplateConfig | null = null
  private configPath: string

  constructor() {
    this.configPath = path.join(process.cwd(), 'templates', 'nda-config.json')
  }

  /**
   * Load template configuration from JSON file
   */
  loadConfig(): TemplateConfig {
    if (!this.config) {
      const configContent = fs.readFileSync(this.configPath, 'utf-8')
      this.config = JSON.parse(configContent)
    }
    return this.config!
  }

  /**
   * Get the path to the current PDF template
   */
  getTemplatePath(): string {
    const config = this.loadConfig()
    return path.join(process.cwd(), 'public', 'pdfs', config.templateFile)
  }

  /**
   * Get all fields grouped by section
   */
  getFieldsBySection(): Record<string, FieldConfig[]> {
    const config = this.loadConfig()
    const result: Record<string, FieldConfig[]> = {}

    Object.entries(config.fields).forEach(([fieldName, fieldConfig]) => {
      const section = fieldConfig.section
      if (!result[section]) {
        result[section] = []
      }
      result[section].push({ ...fieldConfig, pdfFieldName: fieldName })
    })

    return result
  }

  /**
   * Get ordered sections
   */
  getOrderedSections(): Array<{ key: string; title: string; order: number }> {
    const config = this.loadConfig()
    return Object.entries(config.sections)
      .map(([key, section]) => ({ key, ...section }))
      .sort((a, b) => a.order - b.order)
  }

  /**
   * Validate form data against config
   * Takes into account party_a_ask_receiver_fill and party_b_ask_receiver_fill flags
   */
  validateData(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const config = this.loadConfig()
    const errors: string[] = []

    // Check if receiver should fill party A or B
    const partyAReceiverFills = data.party_a_ask_receiver_fill === true
    const partyBReceiverFills = data.party_b_ask_receiver_fill === true

    Object.entries(config.fields).forEach(([fieldName, fieldConfig]) => {
      // Skip validation if this field's party is being filled by receiver
      const skipValidation = 
        (fieldConfig.section === 'party_a' && partyAReceiverFills) ||
        (fieldConfig.section === 'party_b' && partyBReceiverFills)
      
      if (skipValidation) {
        return // Don't validate fields that receiver will fill
      }

      // Validate required fields
      if (fieldConfig.required && !data[fieldName]) {
        errors.push(`${fieldConfig.label} is required`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Map form data to PDF field names (for form field mode)
   */
  mapDataToPDFFields(data: Record<string, unknown>): Record<string, string> {
    const config = this.loadConfig()
    const mapped: Record<string, string> = {}

    Object.entries(config.fields).forEach(([fieldName, fieldConfig]) => {
      const value = data[fieldName]
      if (value !== undefined && value !== null && value !== '' && fieldConfig.pdfFieldName) {
        mapped[fieldConfig.pdfFieldName] = String(value)
      }
    })

    return mapped
  }

  /**
   * Get template metadata
   */
  getMetadata(): { name: string; version: string; description: string } {
    const config = this.loadConfig()
    return {
      name: config.templateName,
      version: config.version,
      description: config.description
    }
  }
}

// Singleton instance
export const templateManager = new TemplateManager()
