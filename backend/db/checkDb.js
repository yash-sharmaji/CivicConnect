import { supabase } from '../config/supabase.js';

async function run() {
  console.log('Checking Supabase connection and tables...');
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('name')
      .limit(5);

    if (error) {
      console.error('========================================================');
      console.error('ERROR: Could not query database.');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('This usually means the tables do not exist yet.');
      console.error('Please run "npm run db:setup" (after configuring DATABASE_URL)');
      console.error('or copy-paste backend/db/schema.sql into the Supabase SQL editor.');
      console.error('========================================================');
      process.exit(1);
    }

    console.log('========================================================');
    console.log('SUCCESS: Connected to database successfully!');
    console.log('Found categories in database:', categories.map(c => c.name).join(', '));
    console.log('========================================================');
  } catch (err) {
    console.error('Failed to run check script:', err.message);
    process.exit(1);
  }
}

run();
