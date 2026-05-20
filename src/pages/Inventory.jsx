import React, { useState, useEffect } from 'react';
import { useAguaraStore } from '../store/aguaraStore';
import {
    Search, Plus, Edit3, Trash2, AlertTriangle, X, Save,
    Box, Droplet, Layers, Star, Settings2, Trash, History,
    ArrowUpRight, ArrowDownLeft, Scale,
    ClipboardList, MinusCircle, PlusCircle, FileUp, Download
} from 'lucide-react';

export default function Inventory() {
    const {
        menu, categories, ingredients, ingredientCategories, recipes, modifiers, stockHistory,
        priceLists, priceOverrides, activePriceListId,
        fetchCategories, fetchProducts, fetchIngredients, fetchIngredientCategories,
        addProduct, updateProduct, deleteProduct,
        addIngredient, updateIngredient, deleteIngredient,
        addCategory, addIngredientCategory,
        updateCategory, deleteCategory, updateIngredientCategory, deleteIngredientCategory,
        updateRecipe, deleteRecipe, setModifiers, adjustStock, addWaste, logMovement,
        addPriceList, updatePriceOverride, setActivePriceList, deletePriceList, updatePriceList,
        bulkImportProducts, bulkImportIngredients, reconcileStock
    } = useAguaraStore();

    useEffect(() => {
        fetchCategories();
        fetchProducts();
        fetchIngredients();
        fetchIngredientCategories();
    }, []);

    const [activeTab, setActiveTab] = useState('products'); // products, ingredients, recipes, modifiers, movements, priceLists
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedIngCategory, setSelectedIngCategory] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const openModal = (item = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const calculateProductCost = (productId) => {
        const recipe = recipes[productId] || [];
        return recipe.reduce((total, component) => {
            const ing = ingredients.find(i => i.id === component.ingredientId);
            return total + (ing ? ing.costPerUnit * component.quantity : 0);
        }, 0);
    };

    // Helper for manual product stock adjustment
    const adjustProductStock = (productId, amount, type, note) => {
        const product = menu.find(p => p.id === productId);
        if (!product) return;

        const change = type === 'waste' ? -Math.abs(amount) : amount;
        updateProduct({ ...product, stock: Math.max(0, product.stock + change) });

        logMovement(
            type === 'waste' ? 'waste' : (change > 0 ? 'entry' : 'adjustment'),
            productId,
            product.name,
            Math.abs(amount),
            'u',
            note
        );
    };

    return (
        <div className="page-container" style={{ padding: '2rem' }}>
            <header style={headerStyle}>
                <div>
                    <h2 className="title-xl font-serif" style={titleStyle}>Ecosistema</h2>
                    <p className="text-mystic" style={{ opacity: 0.6 }}>Gestión de suministros, auditoría de stock y personalización.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="obsidian-card" style={searchBoxStyle}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={searchInputStyle}
                        />
                    </div>
                    {/* Explicit Merma Button in Header */}
                    <button
                        onClick={() => openModal({ type: 'quick_adjust' })}
                        className="obsidian-card"
                        style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ff4444', cursor: 'pointer', fontWeight: 800 }}
                    >
                        <MinusCircle size={18} /> REGISTRAR MERMA
                    </button>
                    {(activeTab === 'products' || activeTab === 'ingredients') && (
                        <button onClick={() => openModal()} className="primary-button" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} /> AGREGAR {activeTab === 'products' ? 'PRODUCTO' : 'INGREDIENTE'}
                        </button>
                    )}
                </div>
            </header>

            <nav style={tabNavStyle}>
                <TabButton id="products" label="Productos" icon={<Box size={16} />} active={activeTab === 'products'} onClick={setActiveTab} />
                <TabButton id="ingredients" label="Ingredientes" icon={<Droplet size={16} />} active={activeTab === 'ingredients'} onClick={setActiveTab} />
                <TabButton id="recipes" label="Recetas" icon={<Layers size={16} />} active={activeTab === 'recipes'} onClick={setActiveTab} />
                <TabButton id="modifiers" label="Modificadores" icon={<Settings2 size={16} />} active={activeTab === 'modifiers'} onClick={setActiveTab} />
                <TabButton id="priceLists" label="Tarifas" icon={<Star size={16} />} active={activeTab === 'priceLists'} onClick={setActiveTab} />
                <TabButton id="movements" label="Movimientos" icon={<History size={16} />} active={activeTab === 'movements'} onClick={setActiveTab} />
                <TabButton id="import" label="Importar" icon={<FileUp size={16} />} active={activeTab === 'import'} onClick={setActiveTab} />
                <TabButton id="audit" label="Auditoría" icon={<Scale size={16} />} active={activeTab === 'audit'} onClick={setActiveTab} />
            </nav>

            <div className="obsidian-card" style={{ padding: '0', overflow: 'hidden' }}>
                {activeTab === 'products' && (
                    <ProductTable
                        menu={menu}
                        categories={categories}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        addCategory={addCategory}
                        updateCategory={updateCategory}
                        deleteCategory={deleteCategory}
                        searchTerm={searchTerm}
                        calculateCost={calculateProductCost}
                        onEdit={openModal}
                        onDelete={deleteProduct}
                        onAdjust={(p) => openModal({ type: 'adjust_product', product: p })}
                    />
                )}
                {activeTab === 'ingredients' && (
                    <IngredientTable
                        ingredients={ingredients}
                        ingredientCategories={ingredientCategories}
                        selectedCategory={selectedIngCategory}
                        setSelectedCategory={setSelectedIngCategory}
                        addIngredientCategory={addIngredientCategory}
                        updateIngredientCategory={updateIngredientCategory}
                        deleteIngredientCategory={deleteIngredientCategory}
                        searchTerm={searchTerm}
                        onEdit={openModal}
                        onDelete={deleteIngredient}
                        onAdjust={(ing) => openModal({ type: 'adjust', ingredient: ing })}
                    />
                )}
                {activeTab === 'recipes' && (
                    <RecipeGrid menu={menu} recipes={recipes} ingredients={ingredients} onEdit={(p) => openModal({ type: 'recipe', productId: p.id, ingredientsList: recipes[p.id] || [] })} onDelete={deleteRecipe} />
                )}
                {activeTab === 'modifiers' && (
                    <ModifierGrid menu={menu} modifiers={modifiers} onEdit={(p) => openModal({ type: 'modifiers', productId: p.id, groups: modifiers[p.id] || [] })} onClear={(p) => setModifiers(p.id, [])} />
                )}
                {activeTab === 'priceLists' && (
                    <PriceListEditor
                        menu={menu}
                        priceLists={priceLists}
                        priceOverrides={priceOverrides}
                        activePriceListId={activePriceListId}
                        onUpdatePrice={updatePriceOverride}
                        onAddList={addPriceList}
                        onDeleteList={deletePriceList}
                        onRenameList={updatePriceList}
                    />
                )}
                {activeTab === 'movements' && (
                    <MovementTable history={stockHistory} searchTerm={searchTerm} />
                )}
                {activeTab === 'import' && (
                    <BulkImporter
                        onImportProducts={bulkImportProducts}
                        onImportIngredients={bulkImportIngredients}
                        categories={categories}
                    />
                )}
                {activeTab === 'audit' && (
                    <StockAuditTool
                        menu={menu}
                        ingredients={ingredients}
                        categories={categories}
                        onReconcile={reconcileStock}
                    />
                )}
            </div>

            {isModalOpen && (
                <ManagementModal
                    type={editingItem?.type || activeTab}
                    item={editingItem}
                    ctx={{ categories, ingredientCategories, ingredients, menu }}
                    onClose={closeModal}
                    onSave={(data) => {
                        if (activeTab === 'products' && !editingItem?.type) {
                            if (editingItem) updateProduct({ ...editingItem, ...data });
                            else addProduct(data);
                        } else if (activeTab === 'ingredients' && !editingItem?.type) {
                            if (editingItem) updateIngredient({ ...editingItem, ...data });
                            else addIngredient(data);
                        } else if (editingItem?.type === 'recipe') {
                            updateRecipe(editingItem.productId, data);
                        } else if (editingItem?.type === 'modifiers') {
                            setModifiers(editingItem.productId, data);
                        } else if (editingItem?.type === 'adjust') {
                            if (data.type === 'waste') addWaste(editingItem.ingredient.id, data.qty, data.note);
                            else adjustStock(editingItem.ingredient.id, data.qty, data.note);
                        } else if (editingItem?.type === 'adjust_product') {
                            adjustProductStock(editingItem.product.id, data.qty, data.type, data.note);
                        } else if (editingItem?.type === 'quick_adjust') {
                            const isProduct = data.selectedItem.id.startsWith('m');
                            if (isProduct) adjustProductStock(data.selectedItem.id, data.qty, data.type, data.note);
                            else {
                                if (data.type === 'waste') addWaste(data.selectedItem.id, data.qty, data.note);
                                else adjustStock(data.selectedItem.id, data.qty, data.note);
                            }
                        }
                        closeModal();
                    }}
                />
            )}
        </div>
    );
}

// --- Component Enhancements for Phase 3 ---

function IngredientTable({ ingredients, ingredientCategories, selectedCategory, setSelectedCategory, addIngredientCategory, updateIngredientCategory, deleteIngredientCategory, searchTerm, onEdit, onDelete, onAdjust }) {
    return (
        <div style={{ padding: '0 2rem 2rem 2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem', scrollbarWidth: 'none' }}>
                <button
                    onClick={() => setSelectedCategory('all')}
                    style={{
                        padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                        background: selectedCategory === 'all' ? 'var(--fire-orange)' : 'rgba(255,255,255,0.05)',
                        color: selectedCategory === 'all' ? 'black' : 'white',
                        border: 'none', whiteSpace: 'nowrap'
                    }}
                >TODOS</button>
                {ingredientCategories.map(cat => (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <button
                            onClick={() => setSelectedCategory(cat.id)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                                background: selectedCategory === cat.id ? 'var(--fire-orange)' : 'rgba(255,255,255,0.05)',
                                color: selectedCategory === cat.id ? 'black' : 'white',
                                border: 'none', whiteSpace: 'nowrap'
                            }}
                        >{cat.name.toUpperCase()}</button>
                        <button title="Renombrar" onClick={() => { const name = prompt('Nuevo nombre:', cat.name); if (name) updateIngredientCategory(cat.id, name); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '4px' }}><Edit3 size={11} /></button>
                        <button title="Eliminar" onClick={() => { if (confirm(`¿Eliminar categoría "${cat.name}"? Los ingredientes quedarán en "otros".`)) deleteIngredientCategory(cat.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '4px' }}><X size={11} /></button>
                    </div>
                ))}
                <button
                    onClick={() => {
                        const name = prompt('Nombre de la nueva categoría de insumos:');
                        if (name) addIngredientCategory({ name });
                    }}
                    style={{
                        padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                        background: 'rgba(255,255,255,0.05)', color: 'var(--fire-orange)', border: '1px dashed var(--fire-orange)', whiteSpace: 'nowrap'
                    }}
                >+ CATEGORÍA</button>
            </div>
            <table style={tableStyle}>
                <thead>
                    <tr style={tableHeaderRowStyle}>
                        <th style={thStyle}>INGREDIENTE</th>
                        <th style={thStyle}>STOCK ACTUAL</th>
                        <th style={thStyle}>STOCK MÍN</th>
                        <th style={thStyle}>COSTO UNITARIO</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
                    {ingredients
                        .filter(i => (selectedCategory === 'all' || i.category === selectedCategory) && i.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(ing => (
                            <tr key={ing.id} style={tableRowStyle}>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 700 }}>{ing.name}</div>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>{ing.unit}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ color: ing.currentStock < ing.minStock ? '#ff4444' : '#22c55e', fontWeight: 800 }}>
                                            {ing.currentStock} {ing.unit}
                                        </span>
                                        {ing.currentStock < ing.minStock && <AlertTriangle size={14} color="#ff4444" />}
                                    </div>
                                </td>
                                <td style={tdStyle}>{ing.minStock} {ing.unit}</td>
                                <td style={tdStyle}>${ing.costPerUnit}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>
                                    <div style={actionsContainerStyle}>
                                        <button title="Cargar Merma" onClick={() => onAdjust(ing)} style={{ ...editButtonStyle, color: '#ff4444' }}><MinusCircle size={18} /></button>
                                        <button title="Registrar Ingreso" onClick={() => onAdjust(ing)} style={{ ...editButtonStyle, color: '#22c55e' }}><PlusCircle size={18} /></button>
                                        <button title="Editar" onClick={() => onEdit(ing)} style={editButtonStyle}><Edit3 size={18} /></button>
                                        <button title="Eliminar" onClick={() => onDelete(ing.id)} style={deleteButtonStyle}><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}

function MovementTable({ history, searchTerm }) {
    return (
        <table style={tableStyle}>
            <thead>
                <tr style={tableHeaderRowStyle}>
                    <th style={thStyle}>FECHA</th>
                    <th style={thStyle}>TIPO</th>
                    <th style={thStyle}>İTEM</th>
                    <th style={thStyle}>CANTIDAD</th>
                    <th style={thStyle}>NOTA / MOTIVO</th>
                </tr>
            </thead>
            <tbody>
                {history.filter(h => h.itemName.toLowerCase().includes(searchTerm.toLowerCase())).map(h => (
                    <tr key={h.id} style={tableRowStyle}>
                        <td style={tdStyle}>
                            <div style={{ fontSize: '0.8rem' }}>{new Date(h.date).toLocaleDateString()}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>{new Date(h.date).toLocaleTimeString()}</div>
                        </td>
                        <td style={tdStyle}>
                            <span style={{
                                fontSize: '0.6rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 900,
                                background: h.type === 'sale' ? 'rgba(34, 197, 94, 0.1)' : h.type === 'waste' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 69, 0, 0.1)',
                                color: h.type === 'sale' ? '#22c55e' : h.type === 'waste' ? '#ef4444' : 'var(--fire-orange)'
                            }}>
                                {h.type.toUpperCase()}
                            </span>
                        </td>
                        <td style={tdStyle}>{h.itemName}</td>
                        <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: h.type === 'entry' ? '#22c55e' : '#ff4444' }}>
                                {h.type === 'entry' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                {h.qty} {h.unit}
                            </div>
                        </td>
                        <td style={{ ...tdStyle, opacity: 0.6, fontSize: '0.8rem' }}>{h.note || '-'}</td>
                    </tr>
                ))}
                {history.length === 0 && <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', opacity: 0.3 }}>Sin movimientos registrados.</td></tr>}
            </tbody>
        </table>
    );
}

function ProductTable({ menu, categories, selectedCategory, setSelectedCategory, addCategory, updateCategory, deleteCategory, searchTerm, calculateCost, onEdit, onDelete, onAdjust }) {
    const { recipes } = useAguaraStore();
    return (
        <div style={{ padding: '0 2rem 2rem 2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem', scrollbarWidth: 'none' }}>
                <button
                    onClick={() => setSelectedCategory('all')}
                    style={{
                        padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                        background: selectedCategory === 'all' ? 'var(--fire-orange)' : 'rgba(255,255,255,0.05)',
                        color: selectedCategory === 'all' ? 'black' : 'white',
                        border: 'none', whiteSpace: 'nowrap'
                    }}
                >TODOS</button>
                {categories.map(cat => (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <button
                            onClick={() => setSelectedCategory(cat.id)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                                background: selectedCategory === cat.id ? 'var(--fire-orange)' : 'rgba(255,255,255,0.05)',
                                color: selectedCategory === cat.id ? 'black' : 'white',
                                border: 'none', whiteSpace: 'nowrap'
                            }}
                        >{cat.name.toUpperCase()}</button>
                        <button title="Renombrar" onClick={() => { const name = prompt('Nuevo nombre:', cat.name); if (name) updateCategory(cat.id, name); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '4px' }}><Edit3 size={11} /></button>
                        <button title="Eliminar" onClick={() => { if (confirm(`¿Eliminar categoría "${cat.name}"? Los productos quedarán en "otros".`)) deleteCategory(cat.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '4px' }}><X size={11} /></button>
                    </div>
                ))}
                <button
                    onClick={() => {
                        const name = prompt('Nombre de la nueva categoría de productos:');
                        if (name) addCategory({ name });
                    }}
                    style={{
                        padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                        background: 'rgba(255,255,255,0.05)', color: 'var(--fire-orange)', border: '1px dashed var(--fire-orange)', whiteSpace: 'nowrap'
                    }}
                >+ CATEGORÍA</button>
            </div>
            <table style={tableStyle}>
                <thead>
                    <tr style={tableHeaderRowStyle}>
                        <th style={thStyle}>PRODUCTO</th>
                        <th style={thStyle}>STOCK</th>
                        <th style={thStyle}>PRECIO</th>
                        <th style={thStyle}>COSTO</th>
                        <th style={thStyle}>MARGEN</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
                    {menu
                        .filter(p => (selectedCategory === 'all' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(item => {
                            const cost = calculateCost(item.id);
                            const margin = item.price - cost;
                            const hasRecipe = recipes[item.id] && recipes[item.id].length > 0;
                            return (
                                <tr key={item.id} style={tableRowStyle}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>{item.category.toUpperCase()}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        {hasRecipe ? (
                                            <span style={{ fontSize: '0.65rem', opacity: 0.5, fontStyle: 'italic' }}>Calculado por Receta</span>
                                        ) : (
                                            <span style={{ fontWeight: 800, color: item.stock <= 0 ? '#ff4444' : 'white' }}>{item.stock} u</span>
                                        )}
                                    </td>
                                    <td style={tdStyle}>${item.price}</td>
                                    <td style={{ ...tdStyle, color: 'var(--fire-orange)' }}>${cost.toFixed(2)}</td>
                                    <td style={{ ...tdStyle, color: margin > 0 ? '#22c55e' : '#ff4444' }}>
                                        ${margin.toFixed(2)} ({item.price > 0 ? ((margin / item.price) * 100).toFixed(0) : 0}%)
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                        <div style={actionsContainerStyle}>
                                            {!hasRecipe && (
                                                <>
                                                    <button title="Cargar Merma" onClick={() => onAdjust(item)} style={{ ...editButtonStyle, color: '#ff4444' }}><MinusCircle size={18} /></button>
                                                    <button title="Registrar Ingreso" onClick={() => onAdjust(item)} style={{ ...editButtonStyle, color: '#22c55e' }}><PlusCircle size={18} /></button>
                                                </>
                                            )}
                                            <button title="Editar" onClick={() => onEdit(item)} style={editButtonStyle}><Edit3 size={18} /></button>
                                            <button title="Eliminar" onClick={() => onDelete(item.id)} style={deleteButtonStyle}><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                </tbody>
            </table>
        </div>
    );
}

function RecipeGrid({ menu, recipes, ingredients, onEdit, onDelete }) {
    return (
        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {menu.map(p => {
                const hasRecipe = recipes[p.id] && recipes[p.id].length > 0;
                return (
                    <div key={p.id} className="obsidian-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <h4 style={{ ...cardTitleStyle, marginBottom: 0 }}>{p.name}</h4>
                            {hasRecipe && (
                                <button
                                    title="Eliminar receta"
                                    onClick={() => { if (confirm(`¿Eliminar la receta de "${p.name}"?`)) onDelete(p.id); }}
                                    style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '2px', display: 'flex' }}
                                ><Trash2 size={14} /></button>
                            )}
                        </div>
                        <div style={cardContentStyle}>
                            {recipes[p.id]?.map((comp, idx) => (
                                <div key={idx} style={cardLineStyle}>
                                    <span>{ingredients.find(i => i.id === comp.ingredientId)?.name}</span>
                                    <span>{comp.quantity} {ingredients.find(i => i.id === comp.ingredientId)?.unit}</span>
                                </div>
                            ))}
                            {!hasRecipe && <p style={emptyCardTextStyle}>Sin receta configurada.</p>}
                        </div>
                        <button onClick={() => onEdit(p)} style={configButtonStyle}>CONFIGURAR RECETA</button>
                    </div>
                );
            })}
        </div>
    );
}

function ModifierGrid({ menu, modifiers, onEdit, onClear }) {
    return (
        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {menu.map(p => {
                const hasModifiers = modifiers[p.id] && modifiers[p.id].length > 0;
                return (
                    <div key={p.id} className="obsidian-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <h4 style={{ ...cardTitleStyle, marginBottom: 0 }}>{p.name}</h4>
                            {hasModifiers && (
                                <button
                                    title="Limpiar modificadores"
                                    onClick={() => { if (confirm(`¿Eliminar todos los modificadores de "${p.name}"?`)) onClear(p); }}
                                    style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '2px', display: 'flex' }}
                                ><Trash2 size={14} /></button>
                            )}
                        </div>
                        <div style={cardContentStyle}>
                            {modifiers[p.id]?.map((group, idx) => (
                                <div key={idx} style={cardLineStyle}>
                                    <span>{group.name}</span>
                                    <span>{group.options.length} opciones</span>
                                </div>
                            ))}
                            {!hasModifiers && <p style={emptyCardTextStyle}>Sin modificadores.</p>}
                        </div>
                        <button onClick={() => onEdit(p)} style={configButtonStyle}>GESTIONAR OPCIONES</button>
                    </div>
                );
            })}
        </div>
    );
}

function PriceListEditor({ menu, priceLists, priceOverrides, activePriceListId, onUpdatePrice, onAddList, onDeleteList, onRenameList }) {
    const PROTECTED = ['salon', 'delivery', 'mostrador'];
    const [selectedList, setSelectedList] = useState(priceLists[0]?.id || 'salon');
    const [search, setSearch] = useState('');

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={labelStyle}>Lista de Precios Activa</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {priceLists.map(l => {
                            const isSelected = selectedList === l.id;
                            const isProtected = PROTECTED.includes(l.id);
                            const isActive = activePriceListId === l.id;
                            return (
                                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <button
                                        onClick={() => setSelectedList(l.id)}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
                                            background: isSelected ? 'var(--fire-orange)' : 'rgba(255,255,255,0.05)',
                                            color: isSelected ? 'black' : 'white', border: isActive ? '1px solid var(--fire-orange)' : 'none', whiteSpace: 'nowrap'
                                        }}
                                    >{l.name.toUpperCase()}{isActive ? ' ●' : ''}</button>
                                    {!isProtected && (
                                        <>
                                            <button title="Renombrar" onClick={() => { const n = prompt('Nuevo nombre:', l.name); if (n) onRenameList(l.id, n); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '4px' }}><Edit3 size={11} /></button>
                                            <button title={isActive ? 'No se puede eliminar la lista activa' : 'Eliminar tarifa'} onClick={() => { if (isActive) { alert('No puedes eliminar la lista de precios activa.'); return; } if (confirm(`¿Eliminar la tarifa "${l.name}"?`)) { onDeleteList(l.id); if (selectedList === l.id) setSelectedList('salon'); } }} style={{ background: 'transparent', border: 'none', color: isActive ? 'var(--text-muted)' : '#ff4444', cursor: isActive ? 'not-allowed' : 'pointer', padding: '2px', display: 'flex', borderRadius: '4px', opacity: isActive ? 0.4 : 1 }}><X size={11} /></button>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '200px' }}>
                    <label style={labelStyle}>Buscar por nombre</label>
                    <div className="obsidian-card" style={{ ...searchBoxStyle, width: '100%', maxWidth: '400px' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={searchInputStyle}
                        />
                    </div>
                </div>

                <button
                    onClick={() => {
                        const name = prompt('Nombre de la nueva lista (ej: VIP, Especial, Evento):');
                        if (name) onAddList(name);
                    }}
                    className="obsidian-card"
                    style={{ padding: '1rem 1.5rem', background: 'rgba(255, 69, 0, 0.1)', border: '1px solid var(--fire-orange)', color: 'var(--fire-orange)', cursor: 'pointer', fontWeight: 800, fontSize: '0.7rem' }}
                >+ CREAR NUEVA TARIFA</button>
            </div>

            <div className="obsidian-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={tableHeaderRowStyle}>
                            <th style={thStyle}>PRODUCTO</th>
                            <th style={thStyle}>PRECIO GENERAL</th>
                            <th style={thStyle}>PRECIO EN "{priceLists.find(l => l.id === selectedList)?.name.toUpperCase()}"</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>ESTADO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menu.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => {
                            const currentOverride = priceOverrides[p.id]?.[selectedList];
                            const isOverridden = currentOverride !== undefined;
                            return (
                                <tr key={p.id} style={tableRowStyle}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>{p.category.toUpperCase()}</div>
                                    </td>
                                    <td style={tdStyle}>${p.price}</td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <input
                                                type="number"
                                                placeholder={p.price}
                                                value={currentOverride ?? ''}
                                                onChange={e => onUpdatePrice(p.id, selectedList, e.target.value === '' ? undefined : Number(e.target.value))}
                                                style={{ ...inputStyle, padding: '0.5rem 1rem', width: '120px', border: isOverridden ? '1px solid var(--fire-orange)' : '1px solid rgba(255,255,255,0.05)' }}
                                            />
                                            {isOverridden && (
                                                <button
                                                    title="Eliminar excepción"
                                                    onClick={() => onUpdatePrice(p.id, selectedList, undefined)}
                                                    style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                                                ><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                        {isOverridden ? (
                                            <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(255, 69, 0, 0.1)', color: 'var(--fire-orange)', fontWeight: 900 }}>DIFERENCIADO</span>
                                        ) : (
                                            <span style={{ fontSize: '0.6rem', opacity: 0.3 }}>PRECIO BASE</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ManagementModal({ type, item, ctx, onClose, onSave }) {
    const [formData, setFormData] = useState(item || (
        type === 'recipe' ? { ingredientsList: [] } :
            type === 'modifiers' ? { groups: [] } :
                type === 'ingredients' ? { name: '', unit: 'u', costPerUnit: 0, currentStock: 0, minStock: 0, category: ctx.ingredientCategories?.[0]?.id || '' } :
                    (type === 'adjust' || type === 'adjust_product' || type === 'quick_adjust') ? { qty: 0, note: '', type: 'waste', selectedItem: null } :
                        { name: '', price: 0, category: ctx.categories[0]?.id || '', stock: 0 }
    ));

    const renderProductForm = () => (
        <div style={formStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={labelStyle}>Nombre</label>
                <input placeholder="Nombre" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={labelStyle}>Precio Venta</label>
                    <input placeholder="Precio" type="number" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={labelStyle}>Stock Inicial</label>
                    <input placeholder="Stock" type="number" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} style={inputStyle} />
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={labelStyle}>Categoría</label>
                <select value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} style={inputStyle}>
                    {ctx.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <button onClick={() => onSave(formData)} className="primary-button" style={{ marginTop: '1rem' }}>GUARDAR PRODUCTO</button>
        </div>
    );

    const renderIngredientForm = () => (
        <div style={formStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={labelStyle}>Nombre del Insumo</label>
                <input placeholder="Nombre" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={labelStyle}>Categoría</label>
                <select value={formData.category || ctx.ingredientCategories?.[0]?.id || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} style={inputStyle}>
                    {(ctx.ingredientCategories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={labelStyle}>Unidad (gr, ml, u)</label>
                    <input placeholder="Unidad" value={formData.unit || ''} onChange={e => setFormData({ ...formData, unit: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={labelStyle}>Costo por Unidad</label>
                    <input placeholder="Costo" type="number" value={formData.costPerUnit || ''} onChange={e => setFormData({ ...formData, costPerUnit: Number(e.target.value) })} style={inputStyle} />
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={labelStyle}>Stock Actual</label>
                    <input placeholder="Stock Actual" type="number" value={formData.currentStock || ''} onChange={e => setFormData({ ...formData, currentStock: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={labelStyle}>Stock Mínimo</label>
                    <input placeholder="Stock Mínimo" type="number" value={formData.minStock || ''} onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })} style={inputStyle} />
                </div>
            </div>
            <button onClick={() => onSave(formData)} className="primary-button" style={{ marginTop: '1rem' }}>GUARDAR INSUMO</button>
        </div>
    );

    const renderAdjustForm = () => {
        const isQuick = type === 'quick_adjust';
        const [search, setSearch] = useState('');
        const allOptions = [
            ...ctx.menu.map(p => ({ ...p, type: 'product' })),
            ...ctx.ingredients.map(i => ({ ...i, type: 'ingredient' }))
        ].filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

        return (
            <div style={formStyle}>
                <h4 style={{ fontSize: '0.75rem', opacity: 0.5, letterSpacing: '0.1rem', marginBottom: '0.5rem' }}>GESTIÓN DE MERMAS Y AJUSTES</h4>

                {isQuick && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={labelStyle}>Seleccionar İtem (Producto o Insumo)</label>
                        <div className="obsidian-card" style={{ padding: '0.5rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
                                <Search size={16} opacity={0.4} />
                                <input
                                    placeholder="Filtrar items..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div style={{ maxHeight: formData.selectedItem ? '80px' : '200px', overflowY: 'auto', transition: 'max-height 0.3s' }}>
                                {allOptions.map(o => (
                                    <button
                                        key={o.id}
                                        onClick={() => setFormData({ ...formData, selectedItem: o })}
                                        style={{
                                            width: '100%', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            background: formData.selectedItem?.id === o.id ? 'rgba(255, 69, 0, 0.1)' : 'transparent',
                                            border: 'none', borderBottom: '1px solid rgba(255,255,255,0.02)', color: 'white', cursor: 'pointer', textAlign: 'left',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        <div>
                                            <span style={{ fontWeight: 600 }}>{o.name}</span>
                                            <span style={{
                                                fontSize: '0.6rem', marginLeft: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                                                background: o.type === 'product' ? 'rgba(100, 100, 255, 0.1)' : 'rgba(100, 255, 100, 0.1)',
                                                color: o.type === 'product' ? '#99f' : '#9f9', opacity: 0.8
                                            }}>
                                                {o.type.toUpperCase()}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>
                                            Stock: {o.type === 'product' ? (o.stock || 0) : (o.currentStock || 0)} {o.unit || 'u'}
                                        </span>
                                    </button>
                                ))}
                                {allOptions.length === 0 && <p style={{ padding: '1rem', textAlign: 'center', opacity: 0.3, fontSize: '0.8rem' }}>No se encontraron items.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {(!isQuick || formData.selectedItem) && (
                    <>
                        {!isQuick && (
                            <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Ajustando stock para: <strong style={{ color: 'white' }}>{item.ingredient?.name || item.product?.name}</strong></p>
                        )}
                        {isQuick && formData.selectedItem && (
                            <p style={{ opacity: 0.6, fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                                Seleccionado: <strong style={{ color: 'var(--fire-orange)' }}>{formData.selectedItem.name}</strong>
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'adjustment' })}
                                style={{ flex: 1, padding: '1rem', background: formData.type === 'adjustment' ? 'var(--fire-orange)' : 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 800, fontSize: '0.7rem' }}
                            >INGRESO / AJUSTE</button>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'waste' })}
                                style={{ flex: 1, padding: '1rem', background: formData.type === 'waste' ? '#ff4444' : 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 800, fontSize: '0.7rem' }}
                            >MERMA / DESCARTE</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem' }}>
                            <label style={labelStyle}>Cantidad {(!isQuick || formData.selectedItem) ? `(${formData.selectedItem?.unit || item?.ingredient?.unit || 'u'})` : ''}</label>
                            <input placeholder="0.00" type="number" value={formData.qty || ''} onChange={e => setFormData({ ...formData, qty: Number(e.target.value) })} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={labelStyle}>Motivo / Nota</label>
                            <input placeholder="Ej: Compra semanal, Vencimiento, Rotura..." value={formData.note || ''} onChange={e => setFormData({ ...formData, note: e.target.value })} style={inputStyle} />
                        </div>
                        <button
                            disabled={isQuick && !formData.selectedItem}
                            onClick={() => onSave(formData)}
                            className="primary-button"
                            style={{ marginTop: '1rem', opacity: (isQuick && !formData.selectedItem) ? 0.3 : 1 }}
                        >
                            CONFIRMAR MOVIMIENTO
                        </button>
                    </>
                )}
            </div>
        );
    };

    const renderRecipeForm = () => {
        const recipe = formData.ingredientsList || [];
        const addComp = () => setFormData({ ...formData, ingredientsList: [...recipe, { ingredientId: ctx.ingredients[0]?.id, quantity: 0 }] });

        return (
            <div style={formStyle}>
                <div style={modalScrollArea}>
                    {recipe.map((comp, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <select
                                value={comp.ingredientId}
                                onChange={e => {
                                    const newList = [...recipe];
                                    newList[idx].ingredientId = e.target.value;
                                    setFormData({ ...formData, ingredientsList: newList });
                                }}
                                style={{ ...inputStyle, flex: 1 }}
                            >
                                {ctx.ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                            <input type="number" value={comp.quantity} onChange={e => {
                                const newList = [...recipe];
                                newList[idx].quantity = Number(e.target.value);
                                setFormData({ ...formData, ingredientsList: newList });
                            }} style={{ ...inputStyle, width: '80px' }} />
                            <button onClick={() => setFormData({ ...formData, ingredientsList: recipe.filter((_, i) => i !== idx) })} style={deleteRowButton}><Trash size={16} /></button>
                        </div>
                    ))}
                    {recipe.length === 0 && <p style={emptyCardTextStyle}>Añade ingredientes para calcular costos.</p>}
                </div>
                <button onClick={addComp} className="obsidian-card" style={addRowButton}>+ AÑADIR İTEM</button>
                <button onClick={() => onSave(recipe)} className="primary-button">VINCULAR RECETA</button>
            </div>
        );
    };

    const renderModifierForm = () => {
        const groups = formData.groups || [];
        const addGroup = () => setFormData({ ...formData, groups: [...groups, { name: 'Punto de Carne', options: [{ name: 'Jugoso', extraPrice: 0 }] }] });

        return (
            <div style={formStyle}>
                <div style={modalScrollArea}>
                    {groups.map((group, gidx) => (
                        <div key={gidx} className="obsidian-card" style={{ padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input placeholder="Nombre Grupo (ej: Punto)" value={group.name} onChange={e => {
                                    const next = [...groups]; next[gidx].name = e.target.value;
                                    setFormData({ ...formData, groups: next });
                                }} style={{ ...inputStyle, flex: 1 }} />
                                <button onClick={() => setFormData({ ...formData, groups: groups.filter((_, i) => i !== gidx) })} style={deleteRowButton}><Trash size={16} /></button>
                            </div>
                            {group.options.map((opt, oidx) => (
                                <div key={oidx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input placeholder="Opción" value={opt.name} onChange={e => {
                                        const next = [...groups]; next[gidx].options[oidx].name = e.target.value;
                                        setFormData({ ...formData, groups: next });
                                    }} style={{ ...inputStyle, flex: 2, padding: '0.5rem' }} />
                                    <input placeholder="$0" type="number" value={opt.extraPrice} onChange={e => {
                                        const next = [...groups]; next[gidx].options[oidx].extraPrice = Number(e.target.value);
                                        setFormData({ ...formData, groups: next });
                                    }} style={{ ...inputStyle, flex: 1, padding: '0.5rem' }} />
                                    <button onClick={() => {
                                        const next = [...groups]; next[gidx].options = group.options.filter((_, i) => i !== oidx);
                                        setFormData({ ...formData, groups: next });
                                    }} style={deleteRowButton}><X size={14} /></button>
                                </div>
                            ))}
                            <button onClick={() => {
                                const next = [...groups]; next[gidx].options.push({ name: '', extraPrice: 0 });
                                setFormData({ ...formData, groups: next });
                            }} style={addSmallRowButton}>+ Añadir Selección</button>
                        </div>
                    ))}
                    {groups.length === 0 && <p style={emptyCardTextStyle}>Añade grupos de personalización (ej: Guarniciones, Términos).</p>}
                </div>
                <button onClick={addGroup} className="obsidian-card" style={addRowButton}>+ AÑADIR GRUPO DE MODIFICADORES</button>
                <button onClick={() => onSave(groups)} className="primary-button">GUARDAR MODIFICADORES</button>
            </div>
        );
    };

    return (
        <div style={modalOverlayStyle}>
            <div className="obsidian-card" style={modalContentStyle}>
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', flexShrink: 0 }}>
                    <h3 className="font-serif" style={{ fontSize: '1.8rem' }}>
                        {type === 'products' ? 'Gestionar Producto' : type === 'ingredients' ? 'Gestionar Ingrediente' : type === 'recipe' ? 'Configurar Receta' : (type === 'adjust' || type === 'adjust_product' || type === 'quick_adjust') ? 'Gestión de Stock' : 'Modificadores'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </header>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {type === 'products' && renderProductForm()}
                    {type === 'ingredients' && renderIngredientForm()}
                    {type === 'recipe' && renderRecipeForm()}
                    {type === 'modifiers' && renderModifierForm()}
                    {(type === 'adjust' || type === 'adjust_product' || type === 'quick_adjust') && renderAdjustForm()}
                </div>
            </div>
        </div>
    );
}

// Helper Components
function TabButton({ id, label, icon, active, onClick }) {
    return (
        <button onClick={() => onClick(id)} className="obsidian-card" style={{
            padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
            border: active ? '1px solid var(--fire-orange)' : '1px solid transparent',
            background: active ? 'rgba(255, 69, 0, 0.05)' : 'rgba(255,255,255,0.02)',
            color: active ? 'var(--fire-orange)' : 'white', cursor: 'pointer',
            fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem'
        }}>
            {icon} {label}
        </button>
    );
}

// Shared Styles
const headerStyle = { marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' };
const titleStyle = { fontSize: '3.5rem', marginBottom: '0.5rem' };
const searchBoxStyle = { padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' };
const searchInputStyle = { background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '200px' };
const tabNavStyle = { display: 'flex', gap: '1rem', marginBottom: '2rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeaderRowStyle = { background: 'rgba(255,255,255,0.02)' };
const thStyle = { padding: '1.5rem 2rem' };
const tdStyle = { padding: '1.25rem 2rem' };
const tableRowStyle = { borderBottom: '1px solid rgba(255,255,255,0.02)' };
const configButtonStyle = { width: '100%', padding: '0.75rem', border: '1px solid var(--fire-orange)', background: 'transparent', color: 'var(--fire-orange)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800 };
const labelStyle = { fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05rem', marginBottom: '0.2rem' };
const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '1rem', borderRadius: '4px', outline: 'none' };
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalContentStyle = { width: '100%', maxWidth: '600px', maxHeight: '85vh', padding: '2.5rem', display: 'flex', flexDirection: 'column' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '1.2rem' };
const actionsContainerStyle = { display: 'flex', gap: '1rem', justifyContent: 'flex-end' };
const editButtonStyle = { background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' };
const deleteButtonStyle = { background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4444' };
const cardTitleStyle = { marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' };
const cardContentStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' };
const cardLineStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.6 };
const emptyCardTextStyle = { fontSize: '0.7rem', opacity: 0.3, fontStyle: 'italic' };
const modalScrollArea = { maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' };
const deleteRowButton = { background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' };
const addRowButton = { width: '100%', padding: '0.75rem', border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: 'white', cursor: 'pointer' };
const addSmallRowButton = { width: '100%', padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.7rem' };

function BulkImporter({ onImportProducts, onImportIngredients, categories }) {
    const [fileType, setFileType] = useState('products'); // products, ingredients
    const [previewData, setPreviewData] = useState(null);
    const [error, setError] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                if (lines.length < 2) throw new Error('El archivo está vacío o no tiene encabezados');

                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                const data = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim());
                    const obj = {};
                    headers.forEach((h, i) => obj[h] = values[i]);
                    return obj;
                });

                // Validation based on type
                if (fileType === 'products') {
                    if (!headers.includes('name') || !headers.includes('price'))
                        throw new Error('Formato inválido. Se requieren las columnas: name, price');
                } else {
                    if (!headers.includes('name') || !headers.includes('unit') || !headers.includes('costperunit'))
                        throw new Error('Formato inválido. Se requieren las columnas: name, unit, costPerUnit');
                }

                setPreviewData(data);
                setError(null);
            } catch (err) {
                setError(err.message);
                setPreviewData(null);
            }
        };
        reader.readAsText(file);
    };

    const confirmImport = () => {
        if (!previewData) return;

        if (fileType === 'products') {
            const products = previewData.map(p => ({
                name: p.name,
                price: Number(p.price) || 0,
                category: p.category || categories[0]?.id || 'general',
                stock: Number(p.stock) || 0
            }));
            onImportProducts(products);
        } else {
            const ingredients = previewData.map(i => ({
                name: i.name,
                unit: i.unit || 'u',
                costPerUnit: Number(i.costperunit) || 0,
                currentStock: Number(i.currentstock) || 0,
                minStock: Number(i.minstock) || 0
            }));
            onImportIngredients(ingredients);
        }

        setPreviewData(null);
        alert('¡Importación completada con éxito!');
    };

    const downloadTemplate = () => {
        let content = '';
        if (fileType === 'products') {
            content = 'name,price,category,stock\nHamburguesa Simple,1200,parrilla,50\nPapas Fritas,800,entradas,100';
        } else {
            content = 'name,unit,costPerUnit,currentStock,minStock\nCarne de Res,kg,4500,20,5\nSal fina,kg,200,10,2';
        }
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plantilla_${fileType}.csv`;
        a.click();
    };

    return (
        <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Importador Masivo</h3>
                <p style={{ opacity: 0.6 }}>Carga tus archivos CSV para actualizar o agregar {fileType === 'products' ? 'productos' : 'ingredientes'} en segundos.</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => { setFileType('products'); setPreviewData(null); }} className="obsidian-card" style={{ flex: 1, padding: '1.5rem', border: fileType === 'products' ? '1px solid var(--fire-orange)' : '1px solid transparent', background: fileType === 'products' ? 'rgba(255, 69, 0, 0.05)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.3s' }}>
                    <Box size={24} color={fileType === 'products' ? 'var(--fire-orange)' : 'white'} style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: 800 }}>PRODUCTOS</div>
                </button>
                <button onClick={() => { setFileType('ingredients'); setPreviewData(null); }} className="obsidian-card" style={{ flex: 1, padding: '1.5rem', border: fileType === 'ingredients' ? '1px solid var(--fire-orange)' : '1px solid transparent', background: fileType === 'ingredients' ? 'rgba(255, 69, 0, 0.05)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.3s' }}>
                    <Droplet size={24} color={fileType === 'ingredients' ? 'var(--fire-orange)' : 'white'} style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: 800 }}>INGREDIENTES</div>
                </button>
            </div>

            <div className="obsidian-card" style={{ padding: '2.5rem', border: '2px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                {!previewData ? (
                    <>
                        <FileUp size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                        <label className="primary-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '1rem 2rem' }}>
                            <FileUp size={20} /> SELECCIONAR ARCHIVO CSV
                            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                        </label>
                        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', opacity: 0.4 }}>Solo archivos .csv | Máximo 5MB</p>

                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button onClick={downloadTemplate} style={{ background: 'transparent', border: 'none', color: 'var(--fire-orange)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto', fontSize: '0.75rem', fontWeight: 800 }}>
                                <Download size={16} /> DESCARGAR PLANTILLA
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ fontWeight: 800, color: 'var(--fire-orange)' }}>VISTA PREVIA ({previewData.length} ítems detectados)</h4>
                            <button onClick={() => setPreviewData(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}>CANCELAR</button>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', opacity: 0.5 }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>NOMBRE</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>{fileType === 'products' ? 'PRECIO' : 'COSTO'}</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>{fileType === 'products' ? 'STOCK' : 'MÍN'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 10).map((p, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '0.5rem' }}>{p.name}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>${p.price || p.costperunit}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>{p.stock || p.minstock}</td>
                                        </tr>
                                    ))}
                                    {previewData.length > 10 && (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '1rem', textAlign: 'center', opacity: 0.3 }}>... y {previewData.length - 10} filas más</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={confirmImport} className="primary-button" style={{ width: '100%', marginTop: '2rem', padding: '1.25rem' }}>
                            IMPORTAR AHORA
                        </button>
                    </div>
                )}

                {error && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ff4444', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

function StockAuditTool({ menu, ingredients, categories, onReconcile }) {
    const [filterType, setFilterType] = useState('all'); // all, products, ingredients
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [auditData, setAuditData] = useState({}); // {id: physicalCount }
    const [isSubmitting, setIsSubmitting] = useState(false);

    const allItems = [
        ...menu.map(p => ({ ...p, type: 'product', currentStock: p.stock })),
        ...ingredients.map(i => ({ ...i, type: 'ingredient' }))
    ].filter(item => {
        const matchesType = filterType === 'all' || (filterType === 'products' ? item.type === 'product' : item.type === 'ingredient');
        const matchesCat = selectedCategory === 'all' || item.category === selectedCategory || (item.type === 'ingredient' && selectedCategory === 'all');
        return matchesType && matchesCat;
    });

    const handleCountChange = (id, value) => {
        setAuditData(prev => ({ ...prev, [id]: value === '' ? undefined : Number(value) }));
    };

    const handleFinishAudit = () => {
        const adjustments = Object.entries(auditData)
            .filter(([_, count]) => count !== undefined)
            .map(([id, count]) => {
                const item = allItems.find(i => i.id === id);
                return { id, name: item.name, physicalCount: count };
            });

        if (adjustments.length === 0) {
            alert('No has ingresado ningún conteo físico.');
            return;
        }

        if (confirm(`¿Estás seguro de finalizar la auditoría? Se realizarán ${adjustments.length} ajustes de stock.`)) {
            setIsSubmitting(true);
            onReconcile(adjustments);
            setAuditData({});
            setIsSubmitting(false);
            alert('Auditoría finalizada y stock actualizado.');
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={labelStyle}>Tipo de İtem</label>
                        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inputStyle, padding: '0.6rem', background: '#111', color: 'white' }}>
                            <option value="all" style={{ background: '#111', color: 'white' }}>TODOS</option>
                            <option value="products" style={{ background: '#111', color: 'white' }}>SOLO PRODUCTOS</option>
                            <option value="ingredients" style={{ background: '#111', color: 'white' }}>SOLO INSUMOS</option>
                        </select>
                    </div>
                    {filterType !== 'ingredients' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={labelStyle}>Categoría</label>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ ...inputStyle, padding: '0.6rem', background: '#111', color: 'white' }}>
                                <option value="all" style={{ background: '#111', color: 'white' }}>TODAS</option>
                                {categories.map(c => <option key={c.id} value={c.id} style={{ background: '#111', color: 'white' }}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleFinishAudit}
                    disabled={Object.keys(auditData).length === 0 || isSubmitting}
                    className="primary-button"
                    style={{ padding: '1rem 2rem', opacity: Object.keys(auditData).length > 0 ? 1 : 0.5 }}
                >
                    FINALIZAR AUDITORÍA ({Object.keys(auditData).length})
                </button>
            </header>

            <div className="obsidian-card" style={{ overflow: 'hidden' }}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={tableHeaderRowStyle}>
                            <th style={thStyle}>İTEM</th>
                            <th style={thStyle}>SISTEMA</th>
                            <th style={thStyle}>CONTEO FÍSICO</th>
                            <th style={thStyle}>DIFERENCIA</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>ESTADO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allItems.map(item => {
                            const physical = auditData[item.id];
                            const diff = physical !== undefined ? physical - item.currentStock : 0;
                            const hasChange = physical !== undefined;

                            return (
                                <tr key={item.id} style={tableRowStyle}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>{item.type.toUpperCase()}</div>
                                    </td>
                                    <td style={tdStyle}>{item.currentStock} {item.unit || 'u'}</td>
                                    <td style={tdStyle}>
                                        <input
                                            type="number"
                                            placeholder="--"
                                            value={physical ?? ''}
                                            onChange={e => handleCountChange(item.id, e.target.value)}
                                            style={{ ...inputStyle, width: '100px', padding: '0.5rem', textAlign: 'center', border: hasChange ? '1px solid var(--fire-orange)' : '1px solid rgba(255,255,255,0.05)' }}
                                        />
                                    </td>
                                    <td style={{ ...tdStyle, color: diff === 0 ? 'white' : (diff > 0 ? '#22c55e' : '#ff4444'), fontWeight: 800 }}>
                                        {hasChange ? (diff > 0 ? `+${diff}` : diff) : '--'}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                        {!hasChange ? (
                                            <span style={{ fontSize: '0.6rem', opacity: 0.3 }}>PENDIENTE</span>
                                        ) : diff === 0 ? (
                                            <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontWeight: 900 }}>COINCIDE</span>
                                        ) : diff < 0 ? (
                                            <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 900 }}>FALTANTE</span>
                                        ) : (
                                            <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.1)', color: '#99f', fontWeight: 900 }}>SOBRANTE</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
