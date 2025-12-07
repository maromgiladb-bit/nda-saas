const { Pool } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
    const connectionString = process.env.DATABASE_URL;
    console.log('URL:', connectionString ? connectionString.substring(0, 15) + '...' : 'MISSING');

    if (!connectionString) {
        console.error('DATABASE_URL is missing');
        process.exit(1);
    }

    try {
        const pool = new Pool({ connectionString });
        // Test base pool connection
        const client = await pool.connect();
        console.log('Pool connected successfully');
        const res = await client.query('SELECT NOW()');
        console.log('Query result:', res.rows[0]);
        client.release();
        await pool.end();

        console.log('Pool test passed. Testing Prisma...');

        // Test Prisma
        const pool2 = new Pool({ connectionString });
        const adapter = new PrismaNeon(pool2);
        const prisma = new PrismaClient({ adapter });

        await prisma.$connect();
        console.log('Prisma connected successfully');
        await prisma.$disconnect();
        await pool2.end();

    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
}

main();
