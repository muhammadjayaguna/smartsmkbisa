import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://drobutrmqoygfdpkifyz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyb2J1dHJtcW95Z2ZkcGtpZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNjgxMjAsImV4cCI6MjA5OTk0NDEyMH0.jr4F8k_UdcVckpr7ozdMyiyP2mq3p3f-ugEuzEjSqs8";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkSiswa() {
  const { data: siswa, error } = await supabase.from('siswa').select('*, rombel(nama_rombel)').eq('nisn', '12345678');
  if (error) {
    console.error('Error fetching siswa:', error);
  } else {
    console.dir(siswa, { depth: null });
  }
}

checkSiswa();
