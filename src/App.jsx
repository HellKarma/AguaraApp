import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import { useAguaraStore } from './store/aguaraStore';
import { Sidebar } from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import KDS from './pages/KDS';
import Caja from './pages/Caja';
import Reports from './pages/Reports';
import Customers from './pages/Customers';
import Settings from './pages/Settings';

async function loadProfile(session, setAuth) {
    const { data: profile } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        setAuth({ user: session.user, session, tenantId: profile.tenant_id, role: profile.role });
        if (profile.role === 'admin') {
            await useAguaraStore.getState().seedTenantIfNew();
        }
    }
}

function RoleGuard({ children, roles }) {
    const { role } = useAuthStore();
    if (!roles.includes(role)) return <Navigate to="/" replace />;
    return children;
}

function AuthenticatedApp() {
    const { role, loading } = useAuthStore();

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-deep-black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.2rem', textTransform: 'uppercase' }}>Cargando...</p>
            </div>
        );
    }

    if (!role) return <Navigate to="/login" replace />;

    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', background: 'var(--bg-deep-black)' }}>
            <div className="smoke-overlay" />
            <Sidebar />
            <main style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative', zIndex: 10 }}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pos" element={
                        <RoleGuard roles={['admin', 'barra', 'camarero']}><POS /></RoleGuard>
                    } />
                    <Route path="/kds" element={
                        <RoleGuard roles={['admin', 'cocina']}><KDS /></RoleGuard>
                    } />
                    <Route path="/inventory" element={
                        <RoleGuard roles={['admin', 'barra']}><Inventory /></RoleGuard>
                    } />
                    <Route path="/caja" element={
                        <RoleGuard roles={['admin', 'barra']}><Caja /></RoleGuard>
                    } />
                    <Route path="/reports" element={
                        <RoleGuard roles={['admin', 'barra']}><Reports /></RoleGuard>
                    } />
                    <Route path="/customers" element={
                        <RoleGuard roles={['admin', 'barra']}><Customers /></RoleGuard>
                    } />
                    <Route path="/settings" element={
                        <RoleGuard roles={['admin']}><Settings /></RoleGuard>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    const { setAuth, clearAuth } = useAuthStore();

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) await loadProfile(session, setAuth);
            else clearAuth();
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) await loadProfile(session, setAuth);
            else clearAuth();
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
        </Router>
    );
}

export default App;
