import fs from 'fs';

const filePath = 'components/auth/AuthPage.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add firebase imports
if (!content.includes("import { auth, googleProvider } from '@/lib/firebase/client'")) {
  content = content.replace(
    "import { supabase } from '@/lib/supabase/client';",
    "import { auth, googleProvider } from '@/lib/firebase/client';\nimport { signInWithPopup } from 'firebase/auth';"
  );
}

// 2. Replace handleGoogleLogin body
const newHandleGoogleLogin = `
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // Firebase onAuthStateChanged in useAuth will handle the redirect
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal login dengan Google",
        variant: "destructive",
      });
    }
  };
`;

content = content.replace(
  /const handleGoogleLogin = async \(\) => \{[\s\S]*?toast\(\{[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?\};/,
  newHandleGoogleLogin.trim()
);

fs.writeFileSync(filePath, content);
console.log('Firebase Google login patched successfully!');
