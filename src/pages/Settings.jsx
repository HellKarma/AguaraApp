import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
    return (
        <div className="page-container" style={{ padding: '2rem' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h2 className="title-xl font-serif" style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
                    Configuración
                </h2>
                <p className="text-mystic" style={{ opacity: 0.6 }}>Próximamente.</p>
            </header>
            <div className="obsidian-card" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <SettingsIcon size={64} style={{ marginBottom: '1.5rem' }} />
                <p className="font-serif" style={{ fontSize: '1.5rem' }}>En construcción.</p>
            </div>
        </div>
    );
}
