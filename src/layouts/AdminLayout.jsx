import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, ClipboardList, LogOut, Menu, X, LineChart, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (sidebarOpen) setSidebarOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30 h-16 sm:h-18 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between max-w-full">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2 transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={20} className="sm:w-6 sm:h-6" /> : <Menu size={20} className="sm:w-6 sm:h-6" />}
            </button>
            <Link to="/admin/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 truncate">MIS</span>
              <span className="text-xs sm:text-sm bg-blue-600 text-white px-2 sm:px-3 py-1 rounded whitespace-nowrap">ADMIN</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {user && (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <img 
                  src={user.image || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600'} 
                  alt={user.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0" 
                />
                <span className="text-sm sm:text-base font-medium text-gray-700 hidden md:inline-block truncate max-w-32 lg:max-w-none">
                  {user.name}
                </span>
              </div>
            )}
            <button 
              onClick={logout}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 transition-colors"
            >
              <LogOut size={16} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline-block text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16 sm:pt-18">
        {/* Sidebar */}
        <aside 
          className={`w-64 sm:w-72 lg:w-80 bg-white border-r border-gray-200 fixed top-16 sm:top-18 bottom-10 sm:bottom-12 left-0 z-20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-lg lg:shadow-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full overflow-y-auto mobile-scroll">
            <nav className="p-4 sm:p-5 space-y-2">
             
               <Link
                to="/admin/department"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium ${
                  isActive('/admin/department')
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={closeSidebar}
              >
                <LayoutDashboard size={20} className="shrink-0" />
                {/* <span className="truncate">Department</span> */}
                <span className="truncate">Dashboard</span>
              </Link>
               <Link
                to="/admin/dashboard"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium ${
                  isActive('/admin/dashboard')
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={closeSidebar}
              >
                <LineChart size={20} className="shrink-0" />
                {/* <span className="truncate">Dashboard</span> */}
                <span className="truncate">Graph Analysis</span>
              </Link>
              <Link
                to="/admin/history-commitment"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium ${
                  isActive('/admin/history-commitment')
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={closeSidebar}
              >
                <History size={20} className="shrink-0" />
                <span className="truncate">History Commitment</span>
              </Link>
              <Link
                to="/admin/today-tasks"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium ${
                  isActive('/admin/today-tasks')
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={closeSidebar}
              >
                <Calendar size={20} className="shrink-0" />
                <span className="truncate">Today Tasks</span>
              </Link>
              <Link
                to="/admin/pending-tasks"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium ${
                  isActive('/admin/pending-tasks')
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={closeSidebar}
              >
                <ClipboardList size={20} className="shrink-0" />
                <span className="truncate">Pending Tasks</span>
              </Link>
              <Link
                to="/admin/kpi-kra"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium ${
                  isActive('/admin/kpi-kra')
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={closeSidebar}
              >
                <LineChart size={20} className="shrink-0" />
                <span className="truncate">KPI & KRA</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 ml-0 lg:ml-64 xl:ml-80 pb-10 sm:pb-12 overflow-auto mobile-scroll">
          <div className="p-4 sm:p-6 lg:p-8 max-w-full min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Fixed Footer */}
      <Footer />

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;