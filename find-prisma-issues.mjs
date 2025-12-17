// Script to find all files that still need Prisma model name fixes
import { execSync } from 'child_process';

const patterns = [
    'prisma.nda_drafts',
    'prisma.users',
    'prisma.sign_requests',
    'prisma.signers',
    "external_id'",
    'created_by_id',
    'nda_drafts:',
];

console.log('Finding files with old Prisma table names...\n');

patterns.forEach(pattern => {
    console.log(`\n=== Searching for: ${pattern} ===`);
    try {
        const result = execSync(`rg "${pattern}" src/app/api --files-with-matches`, { encoding: 'utf-8' });
        console.log(result || 'No matches');
    } catch (e) {
        console.log('No matches or error');
    }
});
