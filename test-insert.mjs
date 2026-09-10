import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://drobutrmqoygfdpkifyz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyb2J1dHJtcW95Z2ZkcGtpZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNjgxMjAsImV4cCI6MjA5OTk0NDEyMH0.jr4F8k_UdcVckpr7ozdMyiyP2mq3p3f-ugEuzEjSqs8";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test() {
  console.log('Testing insert siswa...');
  const testNisn = '99999999';
  
  // get a rombel id
  const { data: rombel, error: rError } = await supabase.from('rombel').select('id').limit(1);
  if (rError) {
    console.error('Error fetching rombel:', rError);
    return;
  }
  const rombel_id = rombel[0]?.id;
  console.log('Using rombel_id:', rombel_id);

  // attempt insert
  const { error: insertError } = await supabase.from('siswa').insert([{
    nama: 'Test Siswa',
    nisn: testNisn,
    email: 'test@siswa.com',
    rombel_id: rombel_id
  }]);

  if (insertError) {
    console.error('Insert failed:', insertError);
  } else {
    console.log('Insert succeeded (no error returned).');
  }

  // fetch back
  const { data: siswa, error: fetchError } = await supabase.from('siswa').select('*').eq('nisn', testNisn);
  if (fetchError) {
    console.error('Fetch failed:', fetchError);
  } else {
    console.log('Fetched back:', siswa);
  }
}

test();
