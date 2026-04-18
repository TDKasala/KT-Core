/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

export default function App() {
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
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
