import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://drobutrmqoygfdpkifyz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyb2J1dHJtcW95Z2ZkcGtpZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNjgxMjAsImV4cCI6MjA5OTk0NDEyMH0.jr4F8k_UdcVckpr7ozdMyiyP2mq3p3f-ugEuzEjSqs8";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testFetchData() {
  try {
    let allSiswa = [];
    let from = 0;
    let to = 999;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('siswa')
        .select(`
          *,
          rombel:rombel_id (
            nama_rombel
          )
        `)
        .order('nama')
        .range(from, to);

      if (error) throw error;

      if (data && data.length > 0) {
        allSiswa = [...allSiswa, ...data];
        if (data.length < 1000) {
          hasMore = false;
        } else {
          from += 1000;
          to += 1000;
        }
      } else {
        hasMore = false;
      }
    }

    console.log('Success! Length:', allSiswa.length);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

testFetchData();
