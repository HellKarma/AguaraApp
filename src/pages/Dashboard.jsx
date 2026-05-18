import { useNavigate } from 'react-router-dom';
import { Sparkles, Flame, Map as MapIcon, Zap, ChevronRight, Bell, TrendingUp } from 'lucide-react';
import { useAguaraStore } from '../store/aguaraStore';

function Dashboard() {
    const { menu, tables, orderHistory } = useAguaraStore();
    const navigate = useNavigate();

    const todaySales = orderHistory.reduce((acc, h) => acc + h.total, 0); // Simplified for today
    const avgTicket = orderHistory.length > 0 ? todaySales / orderHistory.length : 0;
    const salesTrend = orderHistory.slice(0, 10).reverse().map(h => h.total);

    return (
        <div className="content-wrapper" style={{ padding: 0 }}>
            {/* Hero Section */}
            <section style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ height: '1px', width: '40px', background: 'var(--fire-orange)' }}></div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.4rem', color: 'var(--fire-orange)', fontWeight: 700 }}>
                        Territorio Protegido
                    </span>
                </div>
                <h2 className="title-xl font-serif" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                    Mística Salvaje <br />
                    <span className="fire-text pulsate">Nocturna</span>
                </h2>
                <p className="text-mystic" style={{ fontSize: '1.1rem', maxWidth: '600px', opacity: 0.8 }}>
                    El espíritu del Aguara Guazu custodia tu negocio. Gestiona cada detalle con el poder de la tierra y el fuego.
                </p>
            </section>

            {/* Core Metrics */}
            <section className="metrics-grid" style={{ padding: 0, marginBottom: '4rem' }}>
                <MetricCard label="Ventas de Hoy" value={`$${todaySales.toLocaleString()}`} trend="+15%" icon={<Flame size={20} className="fire-text" />} />
                <MetricCard label="Mesas Activas" value={`${tables.filter(t => t.status === 'occupied').length}/${tables.length}`} trend="Ocupación" icon={<MapIcon size={20} />} />
                <MetricCard label="Ticket Promedio" value={`$${avgTicket.toFixed(0)}`} trend="+5%" icon={<Zap size={20} />} />
                <MetricCard label="Críticos Stock" value={menu.filter(m => m.stock < 15).length} trend="Alertas" icon={<Bell size={20} />} />
            </section>

            {/* Main Visual Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>

                <div className="obsidian-card" style={{ minHeight: '400px', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h3 className="font-serif" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Flujo de Energía</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1rem' }}>Actividad de Ventas Nocturnas</p>
                        </div>
                        <button
                            onClick={() => navigate('/reports')}
                            className="text-xs font-bold text-orange-500 flex items-center gap-1 hover:underline"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fire-orange)' }}
                        >
                            REPORTE COMPLETO <ChevronRight size={14} />
                        </button>
                    </div>
                    <div style={{ flex: 1, position: 'relative', marginTop: '1rem' }}>
                        {salesTrend.length > 1 ? (
                            <svg width="100%" height="150" viewBox="0 0 400 150" preserveAspectRatio="none">
                                <path
                                    d={generateSimplePath(salesTrend, 400, 150)}
                                    fill="none"
                                    stroke="var(--fire-orange)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                <path
                                    d={`${generateSimplePath(salesTrend, 400, 150)} L 400 150 L 0 150 Z`}
                                    fill="var(--fire-orange)"
                                    opacity="0.05"
                                />
                            </svg>
                        ) : (
                            <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <p style={{ opacity: 0.2, fontStyle: 'italic' }}>Las brasas del gráfico se están encendiendo...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="obsidian-card" style={{ minHeight: '400px', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="font-serif" style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>Territorio: Stock Bajo</h3>
                    <div style={{ flex: 1 }}>
                        {menu.slice(0, 3).map(item => (
                            <StockRow key={item.id} name={item.name} percent={(item.stock / 50) * 100} stockVal={item.stock} />
                        ))}
                    </div>
                    <button className="primary-button" style={{ marginTop: 'auto' }}>
                        ALIMENTAR STOCK
                    </button>
                </div>

            </div>
        </div>
    );
}

function MetricCard({ label, value, trend, icon }) {
    return (
        <div className="obsidian-card metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                {icon}
                <span style={{ fontSize: '0.65rem', color: 'var(--amber-warm)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05rem' }}>{trend}</span>
            </div>
            <span className="metric-label">{label}</span>
            <span className="metric-value">{value}</span>
        </div>
    );
}

function StockRow({ name, percent, stockVal }) {
    const isCritical = stockVal < 15;
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ opacity: isCritical ? 1 : 0.7, fontWeight: isCritical ? 700 : 400 }}>{name}</span>
                <span style={{ color: isCritical ? 'var(--fire-orange)' : 'var(--text-muted)', fontWeight: 700 }}>{stockVal} units</span>
            </div>
            <div className="progress-track" style={{ height: '4px', background: 'rgba(255,255,255,0.03)' }}>
                <div className="progress-bar" style={{
                    width: `${percent}%`,
                    background: isCritical ? 'linear-gradient(90deg, #d42000, #ff4500)' : 'rgba(255,255,255,0.1)'
                }}></div>
            </div>
        </div>
    );
}

function generateSimplePath(data, width, height) {
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (v / max) * (height - 40) - 20;
        return `${x},${y}`;
    });
    return `M ${points[0]} ${points.slice(1).map(p => `L ${p}`).join(' ')}`;
}

export default Dashboard;
