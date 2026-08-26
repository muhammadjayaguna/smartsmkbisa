import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching products...");
  const { data, error } = await supabase
    .from('products')
    .select('id, title, price, image_url, category, rating, sold, seller_id, profiles:users(full_name:nama)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Success! Data:", data.length, "items");
    console.dir(data, { depth: null });
  }
}

test();
