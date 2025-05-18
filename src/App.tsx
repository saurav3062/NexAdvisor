import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { AuthProvider } from './contexts/AuthContext';

// Lazy load other pages
const ExpertsPage = React.lazy(() => import('./pages/ExpertsPage').then(module => ({ default: module.ExpertsPage })));
const ExpertPage = React.lazy(() => import('./pages/ExpertPage').then(module => ({ default: module.ExpertPage })));
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage').then(module => ({ default: module.CategoriesPage })));
const HowItWorksPage = React.lazy(() => import('./pages/HowItWorksPage').then(module => ({ default: module.HowItWorksPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const BookingsPage = React.lazy(() => import('./pages/BookingsPage').then(module => ({ default: module.BookingsPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = React.lazy(() => import('./pages/SignupPage').then(module => ({ default: module.SignupPage })));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/experts" element={<ExpertsPage />} />
                <Route path="/experts/:id" element={<ExpertPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;