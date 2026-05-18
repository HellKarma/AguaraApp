import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, Package, BarChart3, Settings, Flame, Utensils, Wallet, Users } from 'lucide-react';

export function Sidebar() {
    return (
        <aside className="sidebar obsidian-card" style={{
            width: '280px',
            height: 'calc(100vh - 2rem)',
            margin: '1rem',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem',
            borderRadius: 'var(--radius-tribal)',
            position: 'sticky',
            top: '1rem'
        }}>
            <div className="logo-container" style={{ marginBottom: '3rem' }}>
                <div className="logo-icon" style={{ width: '40px', height: '40px' }}>
                    <Flame size={24} />
                </div>
                <h1 className="logo-text" style={{ fontSize: '1.2rem', letterSpacing: '0.2rem' }}>Aguara</h1>
            </div>

            <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                <SidebarLink to="/pos" icon={<MapIcon size={20} />} label="Salón / POS" />
                <SidebarLink to="/kds" icon={<Utensils size={20} />} label="Cocina / KDS" />
                <SidebarLink to="/inventory" icon={<Package size={20} />} label="Inventario" />
                <SidebarLink to="/caja" icon={<Wallet size={20} />} label="Caja" />
                <SidebarLink to="/reports" icon={<BarChart3 size={20} />} label="Reportes" />
                <SidebarLink to="/customers" icon={<Users size={20} />} label="Clientes" />
            </nav>

            <div className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                <SidebarLink to="/settings" icon={<Settings size={20} />} label="Configuración" />
            </div>
        </aside>
    );
}

function SidebarLink({ to, icon, label }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
            }}
        >
            {icon}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</span>
            {/* Indicator for active state is handled via CSS in nav-link.active */}
        </NavLink>
    );
}
