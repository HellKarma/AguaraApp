import React, { useState } from 'react';
import { signIn } from '../lib/auth';
import { Flame } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signIn(email, password);
        } catch (err) {
            setError('Credenciales incorrectas. Verificá email y contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg-deep-black)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem'
        }}>
            <div className="obsidian-card" style={{ width: '100%', maxWidth: '400px', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: 'rgba(255,69,0,0.15)', border: '1px solid var(--fire-orange)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <Flame size={28} color="var(--fire-orange)" />
                    </div>
                    <h1 className="font-serif" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Aguará</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ingresá con tus credenciales</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05rem' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="usuario@restaurante.com"
                            required
                            autoComplete="email"
                            className="search-input"
                            style={{ padding: '0.875rem 1rem', fontSize: '0.95rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05rem' }}>
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                            className="search-input"
                            style={{ padding: '0.875rem 1rem', fontSize: '0.95rem' }}
                        />
                    </div>

                    {error && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--fire-orange)', background: 'rgba(212,32,0,0.1)', border: '1px solid rgba(212,32,0,0.3)', borderRadius: '6px', padding: '0.75rem 1rem', margin: 0 }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="primary-button"
                        style={{ padding: '0.875rem', fontSize: '0.85rem', fontWeight: 900, marginTop: '0.5rem', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? 'INGRESANDO...' : 'INGRESAR'}
                    </button>
                </form>
            </div>
        </div>
    );
}
