import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Public Layout & Pages
import { PublicLayout } from './components/PublicLayout';
import { HomePage } from './pages/HomePage';
import { PostsPage } from './pages/PostsPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { SearchPage } from './pages/SearchPage';
import { SeriesPage } from './pages/SeriesPage';
import { SeriesDetailPage } from './pages/SeriesDetailPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPostsPage } from './pages/admin/AdminPostsPage';
import { AdminPostEditorPage } from './pages/admin/AdminPostEditorPage';
import { AdminSeriesPage } from './pages/admin/AdminSeriesPage';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes with Sticky Header and Literary Footer */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="posts" element={<PostsPage />} />
                <Route path="post/:slug" element={<PostDetailPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="series" element={<SeriesPage />} />
                <Route path="series/:id" element={<SeriesDetailPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Admin Auth Route */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Admin CMS Protected Sub-routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="posts" element={<AdminPostsPage />} />
                <Route path="posts/new" element={<AdminPostEditorPage />} />
                <Route path="posts/:id/edit" element={<AdminPostEditorPage />} />
                <Route path="series" element={<AdminSeriesPage />} />
              </Route>
            </Routes>
            <Toaster position="bottom-right" richColors closeButton />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
