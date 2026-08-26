import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { defineConfig as ormConfig } from '@prisma/orm-mongo/config';
import { definePrismaConfig } from 'prisma/config';

const envFile = fileURLToPath(new URL('./.env', import.meta.url));
if (existsSync(envFile)) {
  loadEnvFile(envFile);
}

export default definePrismaConfig({
  skills: {
    agents: ['claude', 'cursor', 'agents', 'devin'],
  },
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: {
      connection: process.env.VITE_DATABASE_URL!,
    },
  }),
});
