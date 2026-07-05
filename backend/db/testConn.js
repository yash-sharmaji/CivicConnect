import pg from 'pg';

async function test(pw) {
  const connStr = `postgresql://postgres:${pw}@db.vqvicfubhjknlrrncpge.supabase.co:5432/postgres`;
  console.log('Testing pw:', pw);
  const client = new pg.Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('SUCCESS with pw:', pw);
    await client.end();
    return true;
  } catch (err) {
    console.log('FAILED with pw:', pw, 'Error:', err.message);
    return false;
  }
}

async function run() {
  const success1 = await test('ofcneAhoSg9CSsjC');
  if (success1) return;
  await test('[ofcneAhoSg9CSsjC]');
}

run();
