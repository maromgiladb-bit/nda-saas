/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'jsondiffpatch'

const diffpatcher = create({
  objectHash: (obj: any) => obj?.id || obj?._id || JSON.stringify(obj),
  arrays: { detectMove: true }
})

export interface FieldChange {
  path: string
  before: unknown
  after: unknown
  type: 'added' | 'modified' | 'deleted'
}

/**
 * Compute diff between base and next form data
 */
export function diffForms(base: Record<string, unknown>, next: Record<string, unknown>): any {
  return diffpatcher.diff(base, next) || {}
}

/**
 * Convert jsondiffpatch delta to flat list of changes with JSON pointers
 */
export function listChanges(diff: Record<string, unknown>): FieldChange[] {
  const changes: FieldChange[] = []
  
  function walk(delta: Record<string, unknown>, path: string[] = []) {
    if (!delta || typeof delta !== 'object') return
    
    for (const key in delta) {
      const currentPath = [...path, key]
      const jsonPointer = '/' + currentPath.join('/')
      const value = delta[key]
      
      if (Array.isArray(value)) {
        // jsondiffpatch format:
        // [oldValue, newValue] = modified
        // [newValue] = added
        // [oldValue, 0, 0] = deleted
        // [..., ..., ...] with length > 3 = text diff (skip for now)
        
        if (value.length === 2) {
          // Modified
          changes.push({
            path: jsonPointer,
            before: value[0],
            after: value[1],
            type: 'modified'
          })
        } else if (value.length === 1) {
          // Added
          changes.push({
            path: jsonPointer,
            before: undefined,
            after: value[0],
            type: 'added'
          })
        } else if (value.length === 3 && value[1] === 0 && value[2] === 0) {
          // Deleted
          changes.push({
            path: jsonPointer,
            before: value[0],
            after: undefined,
            type: 'deleted'
          })
        }
      } else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        // Nested object, recurse
        walk(value as Record<string, unknown>, currentPath)
      }
    }
  }
  
  walk(diff)
  return changes
}

/**
 * Get a human-readable field name from JSON pointer path
 */
export function formatFieldPath(path: string): string {
  return path
    .replace(/^\//, '')
    .split('/')
    .map(segment => 
      segment
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
    )
    .join(' → ')
}

/**
 * Apply a diff to a base object (for reconstruction if needed)
 */
export function applyDiff(base: Record<string, unknown>, diff: any): Record<string, unknown> {
  return diffpatcher.patch(JSON.parse(JSON.stringify(base)), diff) as Record<string, unknown>
}
