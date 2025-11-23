/**
 * Sanitizes text for safe HTML rendering by escaping special characters
 * and converting newlines to HTML line breaks.
 * 
 * This is essential for PDF generation to ensure:
 * 1. Special HTML characters are properly escaped
 * 2. Newlines in multi-line fields (addresses, terms) are preserved as <br /> tags
 * 
 * @param value - The text to sanitize (can be string, undefined, or null)
 * @returns Sanitized string safe for HTML rendering
 */
export function sanitizeForHtml(value: string | undefined | null): string {
	if (!value) return '';
	
	return value
		.replace(/&/g, "&amp;")   // Escape ampersands
		.replace(/</g, "&lt;")    // Escape less-than signs
		.replace(/>/g, "&gt;")    // Escape greater-than signs
		.replace(/"/g, "&quot;")  // Escape quotes
		.replace(/\n/g, "<br />"); // Convert newlines to HTML line breaks
}

/**
 * Sanitizes an object's string values for HTML rendering.
 * Recursively processes all string values in the object.
 * 
 * @param obj - Object with values to sanitize
 * @returns New object with sanitized string values
 */
export function sanitizeObjectForHtml<T extends Record<string, any>>(obj: T): T {
	const result: any = {};
	
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'string') {
			result[key] = sanitizeForHtml(value);
		} else if (value && typeof value === 'object' && !Array.isArray(value)) {
			result[key] = sanitizeObjectForHtml(value);
		} else {
			result[key] = value;
		}
	}
	
	return result;
}
