import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Import all page components
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transacations';
import CreateTransaction from './pages/CreateTransaction';
import TransactionDetail from './pages/TransactionDetail';
import AddMoney from './pages/AddMoney';

// Layout Component with Navbar
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if current page should show navbar
  const hideNavbarPaths = ['/login', '/register'];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  useEffect(() => {
    // Check localStorage for user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {shouldShowNavbar && (
        <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-gray-100">
                  SecureEscrow
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-slate-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/transactions"
                      className="text-slate-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors"
                    >
                      Transactions
                    </Link>
                    <Link
                      to="/create-transaction"
                      className="text-slate-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors"
                    >
                      Create
                    </Link>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-900 dark:text-gray-100">
                          {user?.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-500 capitalize">
                          {user?.role}
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-gray-100 px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to="/"
                      className="text-slate-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors"
                    >
                      Home
                    </Link>
                    <Link
                      to="/login"
                      className="text-slate-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-slate-600 dark:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700">
                {isLoggedIn ? (
                  <div className="space-y-2">
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg mb-3">
                      <div className="font-medium text-slate-900 dark:text-gray-100">
                        {user?.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-gray-500 capitalize">
                        {user?.role}
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/transactions"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Transactions
                    </Link>
                    <Link
                      to="/create-transaction"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Create Transaction
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Home
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 bg-teal-600 text-white rounded-lg text-center transition-colors"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Page Content */}
      <main>{children}</main>

      {/* Footer */}
      {shouldShowNavbar && (
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-gray-100">
                    SecureEscrow
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  Secure escrow services for safe online transactions.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-gray-100 mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-gray-400">
                  <li><Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400">Features</Link></li>
                  <li><Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400">Pricing</Link></li>
                  <li><Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400">Security</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-gray-100 mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-gray-400">
                  <li><Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400">About</Link></li>
                  <li><Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400">Contact</Link></li>
                  <li><Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400">Careers</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-gray-100 mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-gray-400">
                  <li><Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400">Privacy</Link></li>
                  <li><Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400">Terms</Link></li>
                  <li><Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400">Compliance</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-8 text-center text-sm text-slate-600 dark:text-gray-400">
              <p>&copy; 2025 SecureEscrow. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = localStorage.getItem('user') !== null;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-money"
            element={
              <ProtectedRoute>
                <AddMoney />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-transaction"
            element={
              <ProtectedRoute>
                <CreateTransaction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transaction/:id"
            element={
              <ProtectedRoute>
                <TransactionDetail />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

// 404 Page Component
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-teal-600 dark:text-teal-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-gray-100 mb-4">
          Page Not Found
        </h2>
        <p className="text-slate-600 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium inline-block transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default App;
