export const TABLES = [
  { id: 1, name: 'Mesa 1', status: 'available', position: { x: 10, y: 10 }, shape: 'round' },
  { id: 2, name: 'Mesa 2', status: 'occupied', position: { x: 40, y: 10 }, shape: 'round' },
  { id: 3, name: 'Mesa 3', status: 'available', position: { x: 70, y: 10 }, shape: 'square' },
  { id: 4, name: 'Mesa 4', status: 'paying', position: { x: 10, y: 40 }, shape: 'square' },
  { id: 5, name: 'Barra 1', status: 'occupied', position: { x: 40, y: 40 }, shape: 'rect' },
  { id: 6, name: 'Barra 2', status: 'available', position: { x: 70, y: 40 }, shape: 'rect' },
];

export const CATEGORIES = [
  { id: 'parrilla', name: 'Parrilla', icon: 'Flame' },
  { id: 'entradas', name: 'Entradas', icon: 'Bowl' },
  { id: 'vinos', name: 'Vinos', icon: 'Wine' },
  { id: 'postres', name: 'Postres', icon: 'IceCream' },
];

export const MENU_ITEMS = [
  { id: 'm1', name: 'Ojo de Bife Madurado', price: 4200, category: 'parrilla', stock: 15, image: 'steak.jpg' },
  { id: 'm2', name: 'Entraña de Novillo', price: 3800, category: 'parrilla', stock: 10, image: 'steak2.jpg' },
  { id: 'm3', name: 'Empanadas de Wagyu', price: 850, category: 'entradas', stock: 50, image: 'empanada.jpg' },
  { id: 'm4', name: 'Malbec Gran Reserva', price: 7500, category: 'vinos', stock: 12, image: 'wine.jpg' },
  { id: 'm5', name: 'Volcán de Chocolate', price: 1200, category: 'postres', stock: 20, image: 'dessert.jpg' },
];
