# DOCX Template Placeholders Guide

## How to Add Placeholders to Word Document

Open `public/pdfs/251025 Mutual NDA v1.docx` in Microsoft Word and replace the text with these placeholders:

## Required Placeholders

### Document Information
- `{{docName}}` - Document title/name
- `{{effective_date}}` - Effective date of the agreement

### Terms
- `{{term_months}}` - Agreement term in months
- `{{confidentiality_period_months}}` - Confidentiality period in months

### Party A Information
- `{{party_a_name}}` - Party A company/person name
- `{{party_a_address}}` - Party A address
- `{{party_a_signatory_name}}` - Person signing for Party A
- `{{party_a_title}}` - Title of Party A signatory
- `{{party_a_email}}` - Party A email address (optional)

### Party B Information
- `{{party_b_name}}` - Party B company/person name
- `{{party_b_address}}` - Party B address
- `{{party_b_signatory_name}}` - Person signing for Party B
- `{{party_b_title}}` - Title of Party B signatory
- `{{party_b_email}}` - Party B email address

### Additional Clauses
- `{{governing_law}}` - Governing law/jurisdiction
- `{{ip_ownership}}` - IP ownership terms
- `{{non_solicit}}` - Non-solicitation terms
- `{{exclusivity}}` - Exclusivity clause
- `{{non_compete_clause}}` - Non-compete details (or "N/A")
- `{{dispute_resolution_clause}}` - Dispute resolution method (or "N/A")
- `{{termination_clause}}` - Termination conditions (or "N/A")

## Example

Instead of writing:
```
This Agreement is entered into by ABC Corp...
```

Write:
```
This Agreement "{{docName}}" is entered into by {{party_a_name}} and {{party_b_name}}...
```

## Special Handling

When the user checks "Ask receiver to fill":
- Party A or Party B placeholders will be replaced with: `[To be filled by receiving party]`

## Testing

After adding placeholders:
1. Save the Word document
2. Go to `/fillnda` in the app
3. Fill out the form
4. Click "Preview"
5. A filled DOCX file will download automatically

## Tips

- Use double curly braces: `{{placeholder}}`
- Placeholders are case-sensitive
- Keep placeholder names exactly as shown above
- You can format the placeholder text (bold, italic, etc.) and it will be preserved
