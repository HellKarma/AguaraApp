import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import KDS from './pages/KDS';
import Caja from './pages/Caja';
import Reports from './pages/Reports';
import Customers from './pages/Customers';


function App() {
  return (
    <Router>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', background: 'var(--bg-deep-black)' }}>
        {/* We keep smoke overlay disabled for now to ensure visibility */}
        <div className="smoke-overlay" />

        <Sidebar />

        <main style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 10,
          padding: '2rem'
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/kds" element={<KDS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/caja" element={<Caja />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/settings" element={<div className="page-container"><h2>Configuración</h2></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
