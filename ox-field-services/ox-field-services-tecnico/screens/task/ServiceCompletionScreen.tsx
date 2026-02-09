import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { techService, OrderDetails } from '../../services/tech';
import { AuthImage } from '../../components/AuthImage';

export const ServiceCompletionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!taskId) {
      navigate('/agenda');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const orderData = await techService.getOrder(taskId);
        setOrder(orderData);
        setPhotos(orderData.photos || []);
        setMaterials(orderData.materials || []);
      } catch (err: any) {
        console.error('Failed to fetch order:', err);
        const status = err.response?.status;
        const msg = err.response?.data?.message;
        if (status === 401) {
          alert(msg || 'Sessão expirada. Faça login novamente.');
          window.location.hash = '#/login';
          return;
        }
        alert(msg || 'Erro ao carregar OS');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, navigate]);

  const handlePhotoUpload = async (file: File) => {
    if (!taskId) return;

    try {
      setUploadingPhoto(true);
      const photoUrl = await techService.uploadPhoto(taskId, file, 'AFTER');
      setPhotos([...photos, photoUrl]);
    } catch (err: any) {
      console.error('Failed to upload photo:', err);
      alert(err.response?.data?.message || 'Erro ao fazer upload da foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const calculateDuration = () => {
    if (!order || !order.actualStartTime) return '0min';
    const start = new Date(order.actualStartTime).getTime();
    const end = Date.now();
    const minutes = Math.floor((end - start) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const startSignature = () => {
    setIsDrawing(false);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!signatureCanvasRef.current || !isDrawing) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const finishSignature = () => {
    if (!signatureCanvasRef.current) return;
    const canvas = signatureCanvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    setSignature(signatureData);
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!signatureCanvasRef.current) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const handleFinish = async () => {
    if (!taskId || !order) return;

    // Signature can only be submitted when order is IN_PROGRESS or COMPLETED
    if (order.status !== 'IN_PROGRESS' && order.status !== 'COMPLETED') {
      alert('Marque a chegada no local primeiro antes de finalizar o serviço.');
      return;
    }

    try {
      setSubmitting(true);

      // Submit signature if provided
      if (signature) {
        await techService.submitSignature(taskId, signature);
      }

      // Complete the order
      await techService.completeOrder(taskId, {
        notes,
        signature: signature || undefined,
        photos
      });

      navigate('/agenda');
    } catch (err: any) {
      console.error('Failed to complete order:', err);
      const status = err.response?.status;
      const data = err.response?.data;
      const msg = data?.message || data?.error;
      const code = data?.code;
      const details = data?.details;
      if (status === 401) {
        alert(msg || 'Sessão expirada. Faça login novamente.');
        window.location.hash = '#/login';
        return;
      }
      if (status === 422 && msg) {
        // Backend returns specific message (checklist, photo, or signature)
        const detailStr = details && typeof details === 'object'
          ? Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(', ')
          : '';
        alert(detailStr ? `${msg} (${detailStr})` : msg);
        return;
      }
      if (status === 422) {
        alert('Não foi possível finalizar. Verifique: checklist completo, pelo menos uma foto do serviço concluído e assinatura do cliente.');
        return;
      }
      alert(msg || 'Erro ao finalizar serviço');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 animate-spin-cw">sync</span>
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
        <div className="text-center text-red-400">
          <span className="material-symbols-outlined text-4xl mb-2">error</span>
          <p className="text-sm">OS não encontrada</p>
          <button
            onClick={() => navigate('/agenda')}
            className="mt-4 px-4 py-2 bg-slate-700 rounded-lg text-white"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col text-white pb-24">
      <header className="flex items-center justify-between px-4 py-3 bg-bg-dark border-b border-slate-800 sticky top-0 z-20">
         <button onClick={() => navigate(`/task/${taskId}`)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white">
          <span className="material-symbols-outlined">arrow_back</span>
         </button>
         <h1 className="text-base font-bold uppercase tracking-wide">Service Completion</h1>
         <button onClick={() => navigate('/agenda')} className="text-sm text-slate-400 hover:text-red-400">Cancel</button>
      </header>

      <div className="p-5 flex flex-col gap-6 overflow-y-auto">
         <section>
            <div className="flex justify-between mb-3 px-1">
               <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Foto do Serviço Concluído (obrigatória)</h2>
               <span className="text-xs text-slate-500">{photos.length} Photos</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
               {photos.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-xl bg-surface-dark relative overflow-hidden group">
                     <AuthImage src={photo} className="w-full h-full object-cover" alt={`Photo ${index + 1}`} />
                  </div>
               ))}
               <label className="aspect-square rounded-xl border-2 border-dashed border-slate-700 bg-surface-dark flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-accent hover:text-accent transition-colors cursor-pointer">
                  <input
                     type="file"
                     accept="image/*"
                     capture="environment"
                     onChange={handleFileInput}
                     className="hidden"
                     disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? (
                     <span className="material-symbols-outlined animate-spin-cw">sync</span>
                  ) : (
                     <>
                        <div className="size-8 rounded-full bg-slate-800 flex items-center justify-center">
                           <span className="material-symbols-outlined">add_a_photo</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase">Add Photo</span>
                     </>
                  )}
               </label>
            </div>
         </section>

         <div className="h-px bg-slate-800"></div>

         <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Service Summary</h2>
            <div className="bg-surface-dark rounded-2xl p-5 border border-slate-800 space-y-4">
               <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <span className="material-symbols-outlined text-green-400">check_circle</span>
                  <p className="text-sm text-green-300 font-medium">
                     Service completed successfully
                  </p>
               </div>
               
               <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-400">Duration</span>
                     <span className="text-white font-medium">{calculateDuration()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-400">Materials Used</span>
                     <span className="text-white font-medium">{materials.length} items</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-400">Photos Taken</span>
                     <span className="text-white font-medium">{photos.length} photos</span>
                  </div>
               </div>
            </div>
         </section>

         <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Signature</h2>
            <div className="bg-surface-dark rounded-2xl p-4 border border-slate-800">
               {signature ? (
                  <div className="relative">
                     <img src={signature} alt="Signature" className="w-full h-32 object-contain bg-white rounded" />
                     <button
                        onClick={clearSignature}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                     >
                        <span className="material-symbols-outlined text-sm">close</span>
                     </button>
                  </div>
               ) : (
                  <div className="space-y-2">
                     <canvas
                        ref={signatureCanvasRef}
                        width={300}
                        height={150}
                        className="w-full h-32 bg-white rounded border border-slate-700 cursor-crosshair"
                        onMouseDown={(e) => {
                           setIsDrawing(true);
                           drawSignature(e);
                        }}
                        onMouseMove={drawSignature}
                        onMouseUp={finishSignature}
                        onMouseLeave={finishSignature}
                     />
                     <p className="text-xs text-slate-400 text-center">Draw signature above</p>
                  </div>
               )}
            </div>
         </section>

         <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Notes</h2>
            <div className="bg-surface-dark rounded-2xl p-4 border border-slate-800">
               <textarea 
                  className="w-full min-h-[100px] bg-transparent text-white text-sm placeholder-slate-500 resize-none focus:outline-none"
                  placeholder="Add any notes about the service..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
               ></textarea>
            </div>
         </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-dark/90 backdrop-blur border-t border-slate-800 z-40">
         <div className="flex items-center justify-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            <span className="text-xs font-semibold text-slate-400">Online & Ready to Sync</span>
         </div>
         <button 
            onClick={handleFinish}
            disabled={submitting || !signature || photos.length === 0}
            className="w-full h-14 bg-primary hover:bg-[#0f2e36] text-white font-bold text-base rounded-xl shadow-lg border border-secondary flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
         >
            {submitting ? (
               <>
                  <span className="material-symbols-outlined animate-spin-cw">sync</span>
                  Finalizando...
               </>
            ) : (
               <>
                  FINISH SERVICE & SYNC <span className="material-symbols-outlined text-secondary">cloud_upload</span>
               </>
            )}
         </button>
         {(!signature || photos.length === 0) && (
            <p className="text-xs text-red-400 text-center mt-2">
              {!signature && photos.length === 0 && 'Assinatura e pelo menos uma foto do serviço concluído são obrigatórias'}
              {!signature && photos.length > 0 && 'Assinatura é obrigatória'}
              {signature && photos.length === 0 && 'Pelo menos uma foto do serviço concluído é obrigatória'}
            </p>
         )}
      </div>
    </div>
  );
};
