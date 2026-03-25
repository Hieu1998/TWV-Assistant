/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PostGenerator from './pages/PostGenerator';
import Consultation from './pages/Consultation';
import ContentCalendar from './pages/ContentCalendar';
import Customers from './pages/Customers';
import Appointments from './pages/Appointments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Services from './pages/Services';
import Sources from './pages/Sources';
import { SupabaseProvider, useSupabase } from './contexts/SupabaseContext';
import SupabaseSetup from './components/SupabaseSetup';

function AppContent() {
  const { isConfigured, setConfigured } = useSupabase();

  if (!isConfigured) {
    return <SupabaseSetup onConfigured={() => setConfigured(true)} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="services" element={<Services />} />
          <Route path="sources" element={<Sources />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="post-generator" element={<PostGenerator />} />
          <Route path="consultation" element={<Consultation />} />
          <Route path="calendar" element={<ContentCalendar />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return (
    <SupabaseProvider>
      <AppContent />
    </SupabaseProvider>
  );
}
