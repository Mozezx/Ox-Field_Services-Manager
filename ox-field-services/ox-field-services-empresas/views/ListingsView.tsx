import React, { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '../components/Button';
import { empresaService, ServiceListingResponse, ServiceCategory } from '../services/empresa';

export const ListingsView: React.FC = () => {
  const [listings, setListings] = useState<ServiceListingResponse[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    description: '',
    priceFrom: '' as number | '',
    imageUrl: '',
    active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [listingsData, categoriesData] = await Promise.all([
        empresaService.getListings(),
        empresaService.getCategories()
      ]);
      setListings(listingsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      categoryId: categories[0]?.id || '',
      title: '',
      description: '',
      priceFrom: '',
      imageUrl: '',
      active: true
    });
    setShowForm(true);
  };

  const openEdit = (l: ServiceListingResponse) => {
    setEditingId(l.id);
    setFormData({
      categoryId: l.categoryId,
      title: l.title,
      description: l.description || '',
      priceFrom: l.priceFrom ?? '',
      imageUrl: l.imageUrl || '',
      active: l.active
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.categoryId) return;
    try {
      setSubmitting(true);
      const payload = {
        categoryId: formData.categoryId,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        priceFrom: typeof formData.priceFrom === 'number' ? formData.priceFrom : (formData.priceFrom ? parseFloat(String(formData.priceFrom)) : undefined),
        imageUrl: formData.imageUrl?.trim() || undefined,
        active: formData.active
      };
      if (editingId) {
        await empresaService.updateListing(editingId, payload);
      } else {
        await empresaService.createListing(payload);
      }
      closeForm();
      await loadData();
    } catch (err: unknown) {
      console.error('Failed to save listing:', err);
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to save listing.';
      setError(message as string);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this listing? It will no longer appear in the marketplace.')) return;
    try {
      await empresaService.deleteListing(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete listing:', err);
      setError('Failed to delete listing.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Tag className="text-primary" size={28} />
            Marketplace Listings
          </h1>
          <p className="text-secondary">Create and manage service ads that appear in the client marketplace.</p>
        </div>
        <Button variant="primary" onClick={openCreate} disabled={categories.length === 0}>
          <Plus size={18} />
          New Listing
        </Button>
      </div>

      {categories.length === 0 && !loading && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-sm mb-4">
          Create at least one category before adding listings.
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-surface rounded-xl border border-white/10 p-12 text-center">
          <Tag className="mx-auto text-secondary mb-4" size={48} />
          <p className="text-white font-medium mb-2">No listings yet</p>
          <p className="text-secondary text-sm mb-4">Listings appear in the client marketplace so customers can request your services.</p>
          <Button variant="primary" onClick={openCreate} disabled={categories.length === 0}>
            <Plus size={18} />
            New Listing
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div
              key={l.id}
              className="bg-surface rounded-xl border border-white/10 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0 flex items-center gap-4">
                {l.imageUrl && (
                  <img src={l.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-white/5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{l.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${l.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {l.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">{l.categoryName} ({l.categoryCode})</p>
                  {l.description && (
                    <p className="text-sm text-secondary mt-1 line-clamp-2">{l.description}</p>
                  )}
                  {l.priceFrom != null && (
                    <p className="text-sm text-primary mt-1">From ${Number(l.priceFrom).toFixed(2)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(l)}
                  className="p-2 rounded-lg hover:bg-white/10 text-secondary hover:text-white transition-colors"
                  title="Edit"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(l.id)}
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
                {editingId ? 'Edit Listing' : 'New Listing'}
              </h2>
              <button onClick={closeForm} className="text-secondary hover:text-white p-2 rounded-full hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-secondary mb-1">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. Standard AC Service"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none h-20 resize-none"
                  placeholder="What this service includes..."
                />
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">Price from (optional)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.priceFrom === '' ? '' : formData.priceFrom}
                  onChange={(e) => setFormData((p) => ({ ...p, priceFrom: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">Image URL (optional)</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                  placeholder="https://..."
                />
              </div>
              {editingId && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData((p) => ({ ...p, active: e.target.checked }))}
                    className="rounded border-white/20 bg-background text-primary focus:ring-primary"
                  />
                  <label htmlFor="active" className="text-sm text-secondary">Active (visible in marketplace)</label>
                </div>
              )}
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
