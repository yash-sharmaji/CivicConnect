import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('========================================================');
    console.error('ERROR: DATABASE_URL is not defined in backend/.env.');
    console.error('Please configure the connection string to apply the schema.');
    console.error('Example: DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres');
    console.error('Alternatively, copy and paste the contents of backend/db/schema.sql');
    console.error('directly into the Supabase SQL Editor on the web dashboard.');
    console.error('========================================================');
    process.exit(1);
  }

  console.log('Connecting to Supabase PostgreSQL database...');
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false } // Required for Supabase hosted databases
  });

  try {
    await client.connect();
    console.log('Connection established successfully!');

    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Reading schema from: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing SQL schema...');
    await client.query(sql);
    console.log('SQL schema executed successfully! Tables, triggers, indexes, and seed data created.');
  } catch (error) {
    console.error('Database migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
