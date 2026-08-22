import fs from 'fs';

const filePath = 'components/home/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const newRender = `  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-0">
      {/* Header Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 -z-10 rounded-b-[40px] shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 pt-8 md:pt-12">
        {/* Welcome Section */}
        <div className="mb-8 md:mb-10 relative">
          <div className="flex items-start justify-between">
            <div className="text-white space-y-2">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
                Selamat Datang, {role === 'admin' ? 'Administrator' : role === 'siswa' ? 'Siswa' : 'Guru'}
              </h1>
              <p className="text-blue-100 text-sm md:text-lg font-medium opacity-90">
                SMK Negeri 1 Banjarmasin
              </p>
              <div className="inline-flex items-center mt-3 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-xs md:text-sm font-medium">
                <Calendar className="h-4 w-4 mr-2 opacity-80" />
                <span>{currentDate}</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-xl border border-white/20 shadow-xl">
                <img
                  src="https://smkn1bjm.sch.id/wp-content/uploads/2016/07/Logo-SMKN-1-Fix.png"
                  alt="Logo SMKN 1 Banjarmasin"
                  className="h-20 w-20 bg-white rounded-xl p-2 shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pemberitahuan Section */}
        <div className="mb-8">
           <PemberitahuanSection />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12">
          <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-2xl hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 md:p-6 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-500">Total Rombel</CardTitle>
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                <GraduationCap className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="text-2xl md:text-4xl font-bold text-slate-800">{loading ? '...' : stats.totalRombel}</div>
              <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1 hidden md:block">Kelas terdaftar aktif</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-2xl hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 md:p-6 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-500">Total Siswa</CardTitle>
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                <Users className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="text-2xl md:text-4xl font-bold text-slate-800">{loading ? '...' : stats.totalSiswa}</div>
              <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1 hidden md:block">Siswa terdaftar aktif</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-2xl hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 md:p-6 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-500">Absen Hari Ini</CardTitle>
              <div className="bg-green-50 p-2 rounded-lg text-green-600">
                <UserCheck className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="text-2xl md:text-4xl font-bold text-slate-800">{loading ? '...' : stats.absensiHariIni}</div>
              <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1 hidden md:block">Kehadiran tercatat</p>
            </CardContent>
          </Card>
        </div>

        {/* Menu Grid Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Menu Utama</h2>
            <p className="text-sm text-slate-500 mt-1">Pilih layanan yang ingin Anda akses</p>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {currentMenuItems.map((item, index) => (
            <div
              key={index}
              onClick={() => router.push(item.path)}
              className="group relative bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
              
              <div className={\`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br \${item.color} flex items-center justify-center mb-4 shadow-lg shadow-\${item.color.split('-')[1]}-500/30 group-hover:scale-110 transition-transform duration-300\`}>
                <item.icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
              </div>
              
              <h3 className="text-base md:text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{item.title}</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed line-clamp-2">{item.description}</p>
              
              {/* Fake hidden button for accessibility or just layout padding */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-2 group-hover:translate-x-0">
                Akses Fitur <span className="ml-2">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
`;

content = content.replace(/return\s*\(\s*<div className="min-h-screen bg-gradient-to-br.*export default Dashboard;/s, newRender);
fs.writeFileSync(filePath, content);
