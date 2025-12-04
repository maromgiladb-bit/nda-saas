import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
    // where your schema lives
    schema: 'prisma/schema.prisma',

    // where migrations go (if you use migrate)
    migrations: {
        path: 'prisma/migrations',
    },

    // THIS replaces `url = env("DATABASE_URL")` in schema.prisma
    datasource: {
        url: env('DATABASE_URL'),
    },
});
