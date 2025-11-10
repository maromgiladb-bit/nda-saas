#!/usr/bin/env python3
import re

# Read the file
with open('templates/design_mutual_nda_v1', 'r', encoding='utf-8') as f:
    content = f.read()

# Define all the replacements for field highlighting
replacements = [
    (r'{{doc_title}}', '<span class="field">{{doc_title}}</span>'),
    (r'{{effective_date_long}}', '<span class="field">{{effective_date_long}}</span>'),
    (r'{{party_1_name}}', '<span class="field">{{party_1_name}}</span>'),
    (r'{{party_1_address}}', '<span class="field">{{party_1_address}}</span>'),
    (r'{{party_1_phone}}', '<span class="field">{{party_1_phone}}</span>'),
    (r'{{party_1_emails_joined}}', '<span class="field">{{party_1_emails_joined}}</span>'),
    (r'{{party_1_signatory_name}}', '<span class="field">{{party_1_signatory_name}}</span>'),
    (r'{{party_1_signatory_title}}', '<span class="field">{{party_1_signatory_title}}</span>'),
    (r'{{party_2_name}}', '<span class="field">{{party_2_name}}</span>'),
    (r'{{party_2_address}}', '<span class="field">{{party_2_address}}</span>'),
    (r'{{party_2_phone}}', '<span class="field">{{party_2_phone}}</span>'),
    (r'{{party_2_emails_joined}}', '<span class="field">{{party_2_emails_joined}}</span>'),
    (r'{{party_2_signatory_name}}', '<span class="field">{{party_2_signatory_name}}</span>'),
    (r'{{party_2_signatory_title}}', '<span class="field">{{party_2_signatory_title}}</span>'),
    (r'{{information_scope_text}}', '<span class="field">{{information_scope_text}}</span>'),
    (r'{{purpose}}', '<span class="field">{{purpose}}</span>'),
    (r'{{governing_law_full}}', '<span class="field">{{governing_law_full}}</span>'),
    (r'{{term_years_number}}', '<span class="field">{{term_years_number}}</span>'),
    (r'{{term_years_words}}', '<span class="field">{{term_years_words}}</span>'),
]

# Apply all replacements
for old, new in replacements:
    content = content.replace(old, new)

# Write back
with open('templates/design_mutual_nda_v1', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully highlighted all fillable fields in yellow")
