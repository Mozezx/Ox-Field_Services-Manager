import React, { useState, useEffect } from 'react';
import { Layers, Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '../components/Button';
import { empresaService, ServiceCategory } from '../services/empresa';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    defaultDurationMinutes: 60,
    priceMultiplier: 1
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await empresaService.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      defaultDurationMinutes: 60,
      priceMultiplier: 1
    });
    setShowForm(true);
    setDeleteError(null);
  };

  const openEdit = (c: ServiceCategory) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      code: c.code,
      description: c.description || '',
      defaultDurationMinutes: c.defaultDurationMinutes ?? 60,
      priceMultiplier: c.priceMultiplier ?? 1
    });
    setShowForm(true);
    setDeleteError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.code?.trim()) {
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await empresaService.updateCategory(editingId, {
          name: formData.name.trim(),
          code: formData.code.trim(),
          description: formData.description?.trim() || undefined,
          defaultDurationMinutes: formData.defaultDurationMinutes,
          priceMultiplier: formData.priceMultiplier
        });
      } else {
        await empresaService.createCategory({
          name: formData.name.trim(),
          code: formData.code.trim(),
          description: formData.description?.trim() || undefined,
          defaultDurationMinutes: formData.defaultDurationMinutes,
          priceMultiplier: formData.priceMultiplier
        });
      }
      closeForm();
      await loadCategories();
    } catch (err: unknown) {
      console.error('Failed to save category:', err);
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to save category.';
      setError(message as string);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category? It cannot be deleted if it is used by orders or listings.')) return;
    try {
      setDeleteError(null);
      await empresaService.deleteCategory(id);
      await loadCategories();
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Cannot delete category (may be in use).';
      setDeleteError(message as string);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Layers className="text-primary" size={28} />
            Service Categories
          </h1>
          <p className="text-secondary">Create and manage service categories for orders and marketplace listings.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={18} />
          New Category
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}
      {deleteError && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-sm mb-4">
          {deleteError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-surface rounded-xl border border-white/10 p-12 text-center">
          <Layers className="mx-auto text-secondary mb-4" size={48} />
          <p className="text-white font-medium mb-2">No categories yet</p>
          <p className="text-secondary text-sm mb-4">Create categories to use in orders and marketplace listings.</p>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={18} />
            New Category
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-surface rounded-xl border border-white/10 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{c.name}</span>
                  <span className="text-xs bg-white/10 text-secondary px-2 py-0.5 rounded">{c.code}</span>
                </div>
                {c.description && (
                  <p className="text-sm text-secondary mt-1 truncate">{c.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-secondary">
                  <span>Duration: {c.defaultDurationMinutes ?? 60} min</span>
                  <span>Price multiplier: {c.priceMultiplier ?? 1}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 rounded-lg hover:bg-white/10 text-secondary hover:text-white transition-colors"
                  title="Edit"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-secondary hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={closeForm} className="text-secondary hover:text-white p-2 rounded-full hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-secondary mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. HVAC"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. hvac"
                  required
                />
                <p className="text-xs text-secondary mt-1">Lowercase, no spaces (used in API and listings).</p>
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none h-20 resize-none"
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-secondary mb-1">Default duration (minutes)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={formData.defaultDurationMinutes}
                    onChange={(e) => setFormData((p) => ({ ...p, defaultDurationMinutes: parseInt(e.target.value, 10) || 60 }))}
                    className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-secondary mb-1">Price multiplier</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={formData.priceMultiplier}
                    onChange={(e) => setFormData((p) => ({ ...p, priceMultiplier: parseFloat(e.target.value) || 1 }))}
                    className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" type="button" onClick={closeForm}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : (editingId ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
