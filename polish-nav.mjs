import fs from 'fs';

// 1. MobileNavbar.tsx
const mobilePath = 'components/layout/MobileNavbar.tsx';
let mobileContent = fs.readFileSync(mobilePath, 'utf-8');

const newMobileRender = `  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom p-4">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
                isActive 
                  ? "text-blue-600" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-blue-50/50 rounded-xl m-1 -z-10 animate-in fade-in zoom-in duration-300" />
              )}
              <div className="relative">
                <item.icon className={cn(
                  "h-5 w-5 mb-1 transition-transform duration-300",
                  isActive ? "scale-110 drop-shadow-md" : "scale-100"
                )} />
                {item.label === 'Chat' && totalUnread > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[10px] bg-red-500 text-white border-2 border-white"
                  >
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-300",
                isActive ? "font-bold tracking-wide" : ""
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};`;

mobileContent = mobileContent.replace(/return\s*\(\s*<nav className="fixed bottom-0.*};/s, newMobileRender);
fs.writeFileSync(mobilePath, mobileContent);

// 2. Navbar.tsx
const navPath = 'components/layout/Navbar.tsx';
let navContent = fs.readFileSync(navPath, 'utf-8');

// Replace the `<nav>` part
const newNavRender = `  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer group" onClick={() => router.push('/')}>
            <div className="bg-gradient-to-br from-blue-50 to-slate-100 p-2 rounded-xl shadow-inner mr-3 group-hover:scale-105 transition-transform duration-300">
              <img
                src="https://smkn1bjm.sch.id/wp-content/uploads/2016/07/Logo-SMKN-1-Fix.png"
                alt="Logo SMKN 1 Banjarmasin"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight group-hover:from-blue-600 group-hover:to-indigo-600 transition-colors">Absensi Digital</h1>
              <p className="text-xs font-medium text-slate-500">SMK Negeri 1 Banjarmasin</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/direct-chat')}
                className="relative text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full h-10 px-3 md:px-4 transition-colors"
              >
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:block font-medium">Chat</span>
                  {totalUnread > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full text-[10px] bg-red-500 hover:bg-red-600 text-white border-2 border-white shadow-sm animate-pulse" 
                    >
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </Badge>
                  )}
                </div>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/settings')}
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full h-10 w-10 p-0 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </Button>

              {user.email === 'kunbobo42@gmail.com' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/admin/chat')}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full h-10 px-3 md:px-4 transition-colors"
                >
                  <Bot className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:block font-medium">AI Chat</span>
                </Button>
              )}

              <div className="w-px h-6 bg-slate-200 mx-2"></div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-full h-10 px-4 transition-all"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:block font-medium">
                  {isLoggingOut ? 'Keluar...' : 'Keluar'}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;`;

// We just replace the `return (` part until `export default Navbar;`
navContent = navContent.replace(/return\s*\(\s*<nav className="bg-white shadow-lg.*export default Navbar;/s, newNavRender);
fs.writeFileSync(navPath, navContent);
