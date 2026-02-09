import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { techService } from '../../services/tech';

interface MaterialItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  count: number;
  img?: string;
  category?: string;
  unitPrice?: number;
}

export const MaterialsLogScreen: React.FC = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const materials = await techService.getMaterialsCatalog(categoryFilter !== 'ALL' ? categoryFilter : undefined);
        setItems(materials.map((m: any) => ({
          id: m.id,
          name: m.name,
          sku: m.sku,
          stock: m.stockQuantity || 0,
          count: 0,
          img: m.imageUrl,
          category: m.category,
          unitPrice: m.unitPrice
        })));
      } catch (err: any) {
        console.error('Failed to fetch materials:', err);
        alert(err.response?.data?.message || 'Erro ao carregar materiais');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [categoryFilter]);

  const updateCount = (id: string, delta: number) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, count: Math.max(0, item.count + delta) } 
        : item
    ));
  };

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query)
    );
  });

  const addedCount = items.reduce((acc, item) => acc + (item.count > 0 ? 1 : 0), 0);

  const handleSave = async () => {
    if (!taskId) return;

    const materialsToAdd = items
      .filter(item => item.count > 0)
      .map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.count,
        unit: 'unit',
        cost: item.unitPrice || 0
      }));

    if (materialsToAdd.length === 0) {
      navigate(-1);
      return;
    }

    try {
      setSaving(true);
      await techService.addMaterials(taskId, materialsToAdd);
      navigate(-1);
    } catch (err: any) {
      console.error('Failed to save materials:', err);
      alert(err.response?.data?.message || 'Erro ao salvar materiais');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      <header className="flex items-center px-4 py-4 bg-bg-dark border-b border-slate-800 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-white text-lg font-bold flex-1 text-center pr-10">Materials Log</h2>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 py-4 space-y-4">
          <div className="flex w-full items-center rounded-xl bg-surface-dark border border-slate-700 h-12 overflow-hidden">
             <span className="material-symbols-outlined pl-4 text-slate-500">search</span>
             <input 
               className="w-full bg-transparent border-none text-white placeholder-slate-500 pl-3 focus:ring-0" 
               placeholder="Search Inventory..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
             <button 
               onClick={() => setCategoryFilter('ALL')}
               className={`h-8 px-4 rounded-full text-xs font-bold uppercase whitespace-nowrap ${
                 categoryFilter === 'ALL'
                   ? 'bg-accent text-primary'
                   : 'bg-surface-dark border border-slate-700 text-slate-300'
               }`}
             >
               All
             </button>
             {['ELECTRICAL', 'PLUMBING', 'HVAC', 'GENERAL'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`h-8 px-4 rounded-full text-xs font-medium whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-accent text-primary'
                      : 'bg-surface-dark border border-slate-700 text-slate-300'
                  }`}
                >
                  {cat}
                </button>
             ))}
          </div>
        </div>

        <div className="bg-surface-dark px-5 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md border-b border-slate-800">
           <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-accent">inventory_2</span>
              <h3 className="text-white text-sm font-bold uppercase tracking-wider">Inventory Catalog</h3>
           </div>
           <span className="text-accent/60 text-xs font-medium">{filteredItems.length} Items</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 animate-spin-cw">sync</span>
              <p className="text-sm">Carregando...</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
             {filteredItems.length === 0 ? (
               <div className="text-center py-12 text-slate-400">
                 <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                 <p className="text-sm">Nenhum material encontrado</p>
               </div>
             ) : (
               filteredItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 px-4 py-4 bg-bg-dark hover:bg-surface-dark/50">
                     {item.img ? (
                       <img src={item.img} className="size-16 rounded-lg bg-slate-800 object-cover" alt={item.name} />
                     ) : (
                       <div className="size-16 rounded-lg bg-slate-800 flex items-center justify-center">
                         <span className="material-symbols-outlined text-slate-600">inventory_2</span>
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{item.name}</p>
                        <p className="text-slate-400 text-xs mt-1">SKU: {item.sku}</p>
                        <div className="flex items-center gap-1 mt-1">
                           <span className={`size-2 rounded-full ${item.stock < 10 ? 'bg-red-500' : 'bg-green-500'}`}></span>
                           <p className="text-slate-400 text-xs">{item.stock < 10 ? 'Low Stock' : 'Stock'}: {item.stock}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 bg-surface-dark rounded-lg p-1 border border-slate-700">
                        <button onClick={() => updateCount(item.id, -1)} disabled={item.count === 0} className="size-8 flex items-center justify-center text-accent hover:bg-white/5 rounded disabled:opacity-30">
                           <span className="material-symbols-outlined">remove</span>
                        </button>
                        <span className="text-white w-4 text-center font-mono">{item.count}</span>
                        <button onClick={() => updateCount(item.id, 1)} disabled={item.count >= item.stock} className="size-8 flex items-center justify-center bg-accent text-primary rounded shadow-sm hover:bg-accent/90 disabled:opacity-30">
                           <span className="material-symbols-outlined">add</span>
                        </button>
                     </div>
                  </div>
               ))
             )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg-dark via-bg-dark to-transparent z-40">
        {addedCount > 0 && (
           <div className="mb-4 bg-surface-dark/90 backdrop-blur rounded-lg border border-slate-700 p-3 flex justify-between items-center animate-slide-up">
              <span className="text-sm text-white font-medium">{addedCount} Items Added</span>
              <span className="text-xs text-accent">Tap to review</span>
           </div>
        )}
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-accent hover:bg-cyan-400 text-primary font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
           {saving ? (
             <>
               <span className="material-symbols-outlined animate-spin-cw">sync</span>
               Salvando...
             </>
           ) : (
             <>
               Save & Continue <span className="material-symbols-outlined">arrow_forward</span>
             </>
           )}
        </button>
      </div>
    </div>
  );
};
