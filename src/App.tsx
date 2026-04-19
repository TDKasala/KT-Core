/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { ProductGuard } from './components/ProductGuard';
import { SuperAdminGuard } from './components/SuperAdminGuard';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Admin from './pages/Admin';
import SupAdmin from './pages/SupAdmin';
import { startBackgroundSync } from './services/syncService';

export default function App() {
  useEffect(() => {
    // Start background sync service when the app loads
    const cleanup = startBackgroundSync();
    return cleanup;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            <AuthGuard>
              <Login />
            </AuthGuard>
          } 
        />
        
        <Route 
          path="/onboarding" 
          element={
            <AuthGuard>
              <Onboarding />
            </AuthGuard>
          } 
        />

        <Route 
          path="/pos" 
          element={
            <AuthGuard>
              <ProductGuard appCode="kt_pos" appName="Point de Vente Kasala">
                <POS />
              </ProductGuard>
            </AuthGuard>
          } 
        />

        <Route 
          path="/inventory" 
          element={
            <AuthGuard>
              <ProductGuard appCode="kt_inventory" appName="Gestion des Stocks">
                <Inventory />
              </ProductGuard>
            </AuthGuard>
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <AuthGuard>
              <Admin />
            </AuthGuard>
          } 
        />

        <Route
          path="/superadmin"
          element={
            <AuthGuard>
              <SuperAdminGuard>
                <SupAdmin />
              </SuperAdminGuard>
            </AuthGuard>
          }
        />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
