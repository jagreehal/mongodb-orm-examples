import mongo from '@prisma/orm-mongo/runtime';
import type { Contract } from './contract.d.ts';
import contractJson from './contract.json' with { type: 'json' };

const databaseUrl = process.env.VITE_DATABASE_URL;

export const db = databaseUrl
  ? mongo<Contract>({ contractJson, url: databaseUrl })
  : mongo<Contract>({ contractJson });

let connection: Promise<void> | undefined;

export function connectDatabase(): Promise<void> {
  connection ??= db
    .connect()
    .then(() => undefined)
    .catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
  return connection;
}
