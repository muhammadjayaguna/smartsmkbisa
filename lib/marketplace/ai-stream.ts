import { supabase } from '@/lib/marketplace/supabase';

const AI_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-assistant`;

export type Msg = { role: "user" | "assistant"; content: string };

export async function streamChat({
  type,
  messages,
  productContext,
  sellerId,
  onDelta,
  onDone,
  onError,
}: {
  type: "shop" | "seller" | "tutor";
  messages: Msg[];
  productContext?: string;
  sellerId?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (err: string) => void;
}) {
  // Get the user's session token if logged in
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, messages, productContext, sellerId }),
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.text();
    onError?.(err);
    onDone();
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}
