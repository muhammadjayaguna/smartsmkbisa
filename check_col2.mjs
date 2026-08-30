import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('pengaturan_guru').select('nama_guru').limit(1);
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Success, column exists. Data:', data);
  }
}
main();
