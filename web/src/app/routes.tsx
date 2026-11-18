import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import HomePage from '../features/home/HomePage';

// Home ships in the main bundle; other screens are code-split.
const PredictionsPage = lazy(() => import('../features/predictions/PredictionsPage'));
const SimulatorPage = lazy(() => import('../features/simulator/SimulatorPage'));
const MethodologyPage = lazy(() => import('../features/methodology/MethodologyPage'));
// Team-only area (not linked in the nav). Ships Firebase Auth in its own chunk.
const AdminPage = lazy(() => import('../features/admin/AdminPage'));

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'previsoes', element: <PredictionsPage /> },
      { path: 'simulador', element: <SimulatorPage /> },
      { path: 'metodologia', element: <MethodologyPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];
