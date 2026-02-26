import { createBrowserRouter, Navigate, redirect } from 'react-router';

import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import BatchPage from './pages/batch/BatchPage';
import ComparePage from './pages/compare/ComparePage';
import HistoryPage from './pages/history/HistoryPage';
import ModelsPage from './pages/models/ModelsPage';
import StatsPage from './pages/stats/StatsPage';
import TestSetsPage from './pages/testsets/TestSetsPage';

function authLoader() {
  if (!localStorage.getItem('token')) return redirect('/login');
  return null;
}

function loginLoader() {
  if (localStorage.getItem('token')) return redirect('/models');
  return null;
}

export const router = createBrowserRouter([
  { path: '/login', loader: loginLoader, element: <LoginPage /> },
  {
    path: '/',
    loader: authLoader,
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/models" replace /> },
      { path: 'models', element: <ModelsPage /> },
      { path: 'compare', element: <ComparePage /> },
      { path: 'batch', element: <BatchPage /> },
      { path: 'testsets', element: <TestSetsPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'stats', element: <StatsPage /> },
    ],
  },
]);
