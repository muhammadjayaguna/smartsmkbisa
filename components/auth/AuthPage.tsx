
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { auth, googleProvider } from '@/lib/firebase/client';
import { signInWithPopup } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';

const AuthPage = () => {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ nama: '', email: '', password: '' });
  

  if (user) {
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    return null;
  }

  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!loginForm.email.trim()) {
      toast({
        title: "Error",
        description: "Email harus diisi",
        variant: "destructive",
      });
      return;
    }
    
    if (!loginForm.password) {
      toast({
        title: "Error",
        description: "Password harus diisi",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signIn(loginForm.email.trim(), loginForm.password);
      if (error) {
        toast({
          title: "Login Gagal",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Berhasil",
          description: "Login berhasil! Selamat datang.",
        });
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '';
      const isNetwork = errMsg.toLowerCase().includes('fetch') || errMsg.toLowerCase().includes('network');
      
      toast({
        title: "Error",
        description: isNetwork 
          ? "Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi."
          : "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!registerForm.nama.trim()) {
      toast({
        title: "Error",
        description: "Nama lengkap harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!registerForm.email.trim()) {
      toast({
        title: "Error",
        description: "Email harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!registerForm.password || registerForm.password.length < 6) {
      toast({
        title: "Error",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }

    setRegisterLoading(true);
    
    try {
      const { error } = await signUp(registerForm.email.trim(), registerForm.password, registerForm.nama.trim());
      if (error) {
        toast({
          title: "Registrasi Gagal",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Berhasil",
          description: "Registrasi berhasil! Silakan login dengan akun Anda.",
        });
        setRegisterForm({ nama: '', email: '', password: '' });
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '';
      const isNetwork = errMsg.toLowerCase().includes('fetch') || errMsg.toLowerCase().includes('network');
      
      toast({
        title: "Error",
        description: isNetwork
          ? "Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi."
          : "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setRegisterLoading(false);
    }
  };


    return (
    <div className="min-h-screen flex w-full">
      {/* Kiri: Ilustrasi & Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800 p-12 flex-col justify-between overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-white to-transparent blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center mb-12">
            <div className="bg-white p-2 rounded-xl shadow-lg mr-4">
              <img 
                src="https://smkn1bjm.sch.id/wp-content/uploads/2016/07/Logo-SMKN-1-Fix.png" 
                alt="Logo SMKN 1 Banjarmasin" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Smart SMK</span>
          </div>
          
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Masa Depan <br/>
            <span className="text-emerald-200">Digitalisasi Sekolah.</span>
          </h1>
          <p className="text-emerald-50 text-lg max-w-md leading-relaxed">
            Platform sistem informasi sekolah cerdas terpadu untuk kemudahan absensi, jurnal mengajar, dan kegiatan siswa.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-emerald-100 font-medium">
          <GraduationCap className="h-6 w-6" />
          <span>© {new Date().getFullYear()} SMK Negeri 1 Banjarmasin</span>
        </div>
      </div>

      {/* Kanan: Form Auth */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 bg-slate-50/50 relative">
        {/* Mobile Branding */}
        <div className="absolute top-8 left-0 w-full flex justify-center lg:hidden">
           <div className="flex items-center gap-3">
             <div className="bg-white p-1.5 rounded-lg shadow-sm">
                <img src="https://smkn1bjm.sch.id/wp-content/uploads/2016/07/Logo-SMKN-1-Fix.png" className="h-8 w-8" alt="Logo"/>
             </div>
             <span className="font-bold text-xl text-slate-800">Smart SMK</span>
           </div>
        </div>

        <div className="w-full max-w-[420px] mt-12 lg:mt-0">
          <Card className="border-0 shadow-2xl shadow-emerald-900/5 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Selamat Datang 👋</CardTitle>
              <CardDescription className="text-base">
                Masuk ke akun Anda untuk mengakses sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGoogleLogin} 
                  className="w-full h-14 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-2xl font-medium transition-all text-lg shadow-sm"
                >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    <path d="M1 1h22v22H1z" fill="none"/>
                  </svg>
                  Login dengan Google
                </Button>
                <p className="mt-6 text-sm text-slate-500 text-center">
                  Gunakan email sekolah (@smkn1bjm.sch.id) untuk masuk
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

