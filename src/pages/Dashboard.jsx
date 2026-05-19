import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Flame, Map as MapIcon, Zap, ChevronRight, Bell, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAguaraStore } from '../store/aguaraStore';

function Dashboard() {
    const { menu, tables, orderHistory, ingredients, fetchOrderHistory } = useAguaraStore();

    useEffect(() => { fetchOrderHistory(); }, []);
    const navigate = useNavigate();

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const todayOrders = orderHistory.filter(h => h.date?.slice(0, 10) === today);
    const yesterdayOrders = orderHistory.filter(h => h.date?.slice(0, 10) === yesterday);

    const todaySales = todayOrders.reduce((acc, h) => acc + h.total, 0);
    const yesterdaySales = yesterdayOrders.reduce((acc, h) => acc + h.total, 0);
    const avgTicket = todayOrders.length > 0 ? todaySales / todayOrders.length : 0;
    const prevAvgTicket = yesterdayOrders.length > 0 ? yesterdaySales / yesterdayOrders.length : 0;
    const salesTrend = orderHistory.slice(0, 10).reverse().map(h => h.total);

    const calcTrend = (curr, prev) => {
        if (curr === 0 && prev === 0) return null;
        if (prev === 0) return 'Nuevo';
        const pct = Math.round(((curr - prev) / prev) * 100);
        return `${pct >= 0 ? '+' : ''}${pct}%`;
    };

    // Stock crítico: productos sin receta con stock bajo + ingredientes bajo mínimo
    const lowStockProducts = menu.filter(m => m.stock < 5);
    const lowStockIngredients = ingredients.filter(ing => ing.currentStock < (ing.minStock || 5));
    const totalCritical = lowStockProducts.length + lowStockIngredients.length;

    // Panel de stock: mostrar ingredientes críticos primero, luego productos
    const stockAlerts = [
        ...lowStockIngredients.map(ing => ({ name: ing.name, current: ing.currentStock, min: ing.minStock || 5, unit: ing.unit, type: 'ingredient' })),
        ...lowStockProducts.map(p => ({ name: p.name, current: p.stock, min: 5, unit: 'uds.', type: 'product' }))
    ].slice(0, 5);

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
                <MetricCard label="Ventas de Hoy" value={`$${todaySales.toLocaleString()}`} trend={calcTrend(todaySales, yesterdaySales)} icon={<Flame size={20} className="fire-text" />} />
                <MetricCard label="Mesas Activas" value={`${tables.filter(t => t.status === 'occupied').length}/${tables.length}`} trend={null} icon={<MapIcon size={20} />} />
                <MetricCard label="Ticket Promedio" value={`$${avgTicket.toFixed(0)}`} trend={calcTrend(avgTicket, prevAvgTicket)} icon={<Zap size={20} />} />
                <MetricCard label="Críticos Stock" value={totalCritical} trend={totalCritical > 0 ? '⚠ Revisar' : null} icon={<Bell size={20} />} />
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 className="font-serif" style={{ fontSize: '1.75rem' }}>Stock Crítico</h3>
                        {totalCritical > 0 && <AlertTriangle size={18} color="var(--fire-orange)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                        {stockAlerts.length > 0 ? stockAlerts.map((item, i) => (
                            <StockRow
                                key={i}
                                name={item.name}
                                percent={Math.min(100, (item.current / (item.min * 3)) * 100)}
                                stockVal={item.current}
                                unit={item.unit}
                                minStock={item.min}
                            />
                        )) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, flexDirection: 'column', gap: '0.5rem' }}>
                                <Bell size={32} />
                                <p style={{ fontSize: '0.85rem' }}>Sin alertas de stock</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => navigate('/inventory')} className="primary-button" style={{ marginTop: 'auto' }}>
                        IR AL INVENTARIO
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
                {trend != null && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--amber-warm)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05rem' }}>{trend}</span>
                )}
            </div>
            <span className="metric-label">{label}</span>
            <span className="metric-value">{value}</span>
        </div>
    );
}

function StockRow({ name, percent, stockVal, unit = 'uds.', minStock }) {
    const isCritical = stockVal <= (minStock || 5);
    const isWarning = !isCritical && stockVal <= (minStock || 5) * 2;
    const barColor = isCritical
        ? 'linear-gradient(90deg, #d42000, #ff4500)'
        : isWarning ? 'linear-gradient(90deg, #ff8c00, #ffb300)'
        : 'rgba(255,255,255,0.1)';

    return (
        <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                <span style={{ opacity: isCritical ? 1 : 0.7, fontWeight: isCritical ? 700 : 400, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isCritical && <AlertTriangle size={12} color="var(--fire-orange)" />}
                    {name}
                </span>
                <span style={{ color: isCritical ? 'var(--fire-orange)' : isWarning ? 'var(--amber-warm)' : 'var(--text-muted)', fontWeight: 700 }}>
                    {stockVal} {unit}
                </span>
            </div>
            <div className="progress-track" style={{ height: '4px', background: 'rgba(255,255,255,0.03)' }}>
                <div className="progress-bar" style={{ width: `${Math.max(2, percent)}%`, background: barColor }}></div>
            </div>
            {minStock && <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Mínimo: {minStock} {unit}</p>}
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
