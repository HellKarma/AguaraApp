import React, { useMemo } from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    PieChart,
    Activity,
    Target,
    Zap,
    Map as MapIcon,
    Flame,
    DollarSign,
    Award
} from 'lucide-react';
import { useAguaraStore } from '../store/aguaraStore';

function Reports() {
    const { orderHistory, getProductProfitability, tables } = useAguaraStore();
    const profitability = useMemo(() => getProductProfitability(), [getProductProfitability]);

    // Data for Sales Trend (Last 7 days mock or real)
    const salesTrend = useMemo(() => {
        // Simple aggregation by day/hour for the chart
        return orderHistory.slice(0, 7).reverse().map(h => h.total);
    }, [orderHistory]);

    const totalRevenue = orderHistory.reduce((acc, h) => acc + h.total, 0);
    const avgTicket = orderHistory.length > 0 ? totalRevenue / orderHistory.length : 0;

    // Table Profitability Mapping
    const tableRevenue = useMemo(() => {
        const mapping = {};
        orderHistory.forEach(h => {
            mapping[h.tableName] = (mapping[h.tableName] || 0) + h.total;
        });
        return mapping;
    }, [orderHistory]);

    const maxTableRev = Math.max(...Object.values(tableRevenue), 1);

    return (
        <div className="content-wrapper">
            {/* Header */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ height: '1px', width: '40px', background: 'var(--fire-orange)' }}></div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.4rem', color: 'var(--fire-orange)', fontWeight: 700 }}>SABIDURÍA DE DATOS</span>
                </div>
                <h2 className="title-xl font-serif" style={{ fontSize: '3.5rem' }}>Análisis del Territorio</h2>
                <p className="text-mystic" style={{ opacity: 0.6 }}>Decodificando el rastro de las ventas para dominar el mercado.</p>
            </div>

            {/* Top Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                <ReportMetric label="Ingresos Totales" value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSign size={20} color="var(--fire-orange)" />} trend="+12%" />
                <ReportMetric label="Ticket Promedio" value={`$${avgTicket.toFixed(0)}`} icon={<Activity size={20} color="#22c55e" />} trend="+5%" />
                <ReportMetric label="Órdenes" value={orderHistory.length} icon={<Zap size={20} color="var(--amber-warm)" />} trend="+8%" />
                <ReportMetric label="Margen Promedio" value="68%" icon={<Award size={20} color="#3b82f6" />} trend="+2%" />
            </div>

            {/* Main Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>

                {/* Sales Trend SVG Chart */}
                <div className="obsidian-card" style={{ padding: '2.5rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 className="font-serif" style={{ fontSize: '1.5rem' }}>Tendencia de Ventas (Últimos Movimientos)</h3>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', fontWeight: 800 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--fire-orange)' }}></div> INGRESOS
                            </span>
                        </div>
                    </div>

                    <div style={{ flex: 1, position: 'relative', marginTop: '1rem' }}>
                        <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
                            {/* Grid Lines */}
                            {[0, 1, 2, 3].map(i => (
                                <line key={i} x1="0" y1={75 * i} x2="800" y2={75 * i} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                            ))}

                            {/* The Path */}
                            <path
                                d={generatePath(salesTrend, 800, 300)}
                                fill="none"
                                stroke="var(--fire-orange)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ filter: 'drop-shadow(0 0 10px rgba(255, 69, 0, 0.4))' }}
                            />

                            {/* Gradient Fill */}
                            <path
                                d={`${generatePath(salesTrend, 800, 300)} L 800 300 L 0 300 Z`}
                                fill="url(#salesGradient)"
                                opacity="0.1"
                            />

                            <defs>
                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--fire-orange)" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>

                            {/* Data Points */}
                            {salesTrend.map((v, i) => {
                                const x = (i / (salesTrend.length - 1)) * 800;
                                const maxV = Math.max(...salesTrend, 1);
                                const y = 300 - (v / maxV) * 250 - 25;
                                return (
                                    <circle key={i} cx={x} cy={y} r="5" fill="var(--fire-orange)" />
                                );
                            })}
                        </svg>

                        {/* X Axis Labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', padding: '0 10px' }}>
                            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(d => (
                                <span key={d} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800 }}>{d}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Profitable Products */}
                <div className="obsidian-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <Award size={20} color="var(--amber-warm)" />
                        <h3 className="font-serif" style={{ fontSize: '1.2rem' }}>Líderes de Rentabilidad</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {profitability.slice(0, 5).map((p, i) => (
                            <div key={p.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                                    <span style={{ color: '#22c55e', fontWeight: 900 }}>{p.marginPct.toFixed(0)}% Margen</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${p.marginPct}%`,
                                            background: `linear-gradient(90deg, var(--fire-orange), #ff8c00)`,
                                            boxShadow: '0 0 10px rgba(255, 69, 0, 0.3)'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="primary-button" style={{ width: '100%', marginTop: '2.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>
                        VER TODOS LOS PRODUCTOS
                    </button>
                </div>
            </div>

            {/* Secondary Row: Heatmap & Recent Orders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Heatmap Section */}
                <div className="obsidian-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <MapIcon size={20} color="var(--fire-orange)" />
                        <h3 className="font-serif" style={{ fontSize: '1.2rem' }}>Mapa de Calor (Recaudación)</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {tables.map(t => {
                            const rev = tableRevenue[t.name] || 0;
                            const intensity = rev / maxTableRev;
                            return (
                                <div
                                    key={t.id}
                                    style={{
                                        aspectRatio: '1',
                                        background: `rgba(255, 69, 0, ${0.05 + intensity * 0.9})`,
                                        borderRadius: 'var(--radius-tribal)',
                                        border: `1px solid rgba(255, 69, 0, ${intensity})`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.2rem',
                                        boxShadow: intensity > 0.7 ? '0 0 15px rgba(255, 69, 0, 0.3)' : 'none'
                                    }}
                                >
                                    <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>{t.name}</span>
                                    <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>${rev}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Intelligence Logs */}
                <div className="obsidian-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <PieChart size={20} color="#3b82f6" />
                        <h3 className="font-serif" style={{ fontSize: '1.2rem' }}>Desempeño por Medio de Pago</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <MethodBar label="Efectivo" amount={orderHistory.filter(h => h.method === 'cash').reduce((a, b) => a + b.total, 0)} total={totalRevenue} color="var(--fire-orange)" />
                        <MethodBar label="Tarjeta" amount={orderHistory.filter(h => h.method === 'card').reduce((a, b) => a + b.total, 0)} total={totalRevenue} color="#3b82f6" />
                        <MethodBar label="Mercado Pago" amount={orderHistory.filter(h => h.method === 'mp').reduce((a, b) => a + b.total, 0)} total={totalRevenue} color="#22c55e" />
                        <MethodBar label="Transferencia" amount={orderHistory.filter(h => h.method === 'transfer').reduce((a, b) => a + b.total, 0)} total={totalRevenue} color="#a855f7" />
                    </div>
                </div>

            </div>
        </div>
    );
}

// Helper: Generate SVG Path for Sparkline
function generatePath(data, width, height) {
    if (data.length < 2) return `M 0 ${height / 2} L ${width} ${height / 2}`;
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (v / max) * (height - 50) - 25;
        return `${x},${y}`;
    });
    return `M ${points[0]} ${points.slice(1).map(p => `L ${p}`).join(' ')}`;
}

function ReportMetric({ label, value, icon, trend }) {
    return (
        <div className="obsidian-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
                {icon}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 900 }}>{value}</span>
                <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>{trend}</span>
            </div>
        </div>
    );
}

function MethodBar({ label, amount, total, color }) {
    const pct = total > 0 ? (amount / total) * 100 : 0;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 800 }}>${amount.toLocaleString()} ({pct.toFixed(0)}%)</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px' }}></div>
            </div>
        </div>
    );
}

export default Reports;
