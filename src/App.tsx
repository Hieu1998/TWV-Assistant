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

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="post-generator" element={<PostGenerator />} />
          <Route path="consultation" element={<Consultation />} />
          <Route path="calendar" element={<ContentCalendar />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
