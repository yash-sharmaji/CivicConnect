import pg from 'pg';
import fs from 'fs';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.lookup('db.vqvicfubhjknlrrncpge.supabase.co', { family: 4 }, async (err, address) => {
  if (err) {
    console.error('DNS Lookup failed:', err);
    return;
  }
  console.log('Resolved IPv4 address:', address);
  
  const pw = '[ofcneAhoSg9CSsjC]';
  // Note: we must also pass the correct host header for SSL verification if needed, 
  // but pg SSL rejectUnauthorized: false ignores hostname mismatch.
  const connStr = `postgresql://postgres:${pw}@${address}:5432/postgres`;
  
  const client = new pg.Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('Connected via IPv4!');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(sql);
    console.log('Migration succeeded!');
  } catch (connectErr) {
    console.error('Connection failed:', connectErr);
  } finally {
    await client.end();
  }
});
