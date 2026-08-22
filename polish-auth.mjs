import fs from 'fs';

const filePath = 'components/auth/AuthPage.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const newRender = `  return (
    <div className="min-h-screen flex w-full">
      {/* Kiri: Ilustrasi & Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-12 flex-col justify-between overflow-hidden">
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
            <span className="text-2xl font-bold text-white tracking-tight">SynapseSMK</span>
          </div>
          
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Masa Depan <br/>
            <span className="text-blue-200">Digitalisasi Sekolah.</span>
          </h1>
          <p className="text-blue-100/80 text-lg max-w-md leading-relaxed">
            Platform ERP cerdas terpadu untuk memudahkan pencatatan absensi, pemantauan kegiatan siswa magang, dan jurnal mengajar.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-blue-200/60 font-medium">
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
             <span className="font-bold text-xl text-slate-800">SynapseSMK</span>
           </div>
        </div>

        <div className="w-full max-w-[420px] mt-12 lg:mt-0">
          <Card className="border-0 shadow-2xl shadow-blue-900/5 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Selamat Datang 👋</CardTitle>
              <CardDescription className="text-base">
                Masuk ke akun Anda untuk mengakses sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 rounded-xl">
                  <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Masuk</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Daftar Baru</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="login-email" className="text-slate-600 font-medium text-sm">Alamat Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="user@smkn1bjm.sch.id"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                        required
                        className="h-11 px-4 bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-xl transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-slate-600 font-medium text-sm">Kata Sandi</Label>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginForm.password}
                        placeholder="••••••••"
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        required
                        className="h-11 px-4 bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-xl transition-all"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/20 font-medium transition-all active:scale-[0.98]" disabled={loading}>
                      {loading ? "Memproses..." : "Masuk ke Sistem"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="register-nama" className="text-slate-600 font-medium text-sm">Nama Lengkap</Label>
                      <Input
                        id="register-nama"
                        type="text"
                        placeholder="Cth: Budi Santoso"
                        value={registerForm.nama}
                        onChange={(e) => setRegisterForm({...registerForm, nama: e.target.value})}
                        required
                        className="h-11 px-4 bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-xl transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="register-email" className="text-slate-600 font-medium text-sm">Alamat Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="user@smkn1bjm.sch.id"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                        required
                        className="h-11 px-4 bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-xl transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="register-password" className="text-slate-600 font-medium text-sm">Kata Sandi</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Minimal 6 karakter"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        required
                        minLength={6}
                        className="h-11 px-4 bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-xl transition-all"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 font-medium transition-all active:scale-[0.98]" disabled={registerLoading}>
                      {registerLoading ? "Mendaftarkan..." : "Buat Akun Baru"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
`;

content = content.replace(/return\s*\(\s*<div className="min-h-screen bg-gradient-to-br.*export default AuthPage;/s, newRender);
fs.writeFileSync(filePath, content);
