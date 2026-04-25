import { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, X, Plus, Lock, Pencil, Check } from 'lucide-react';
import { api } from '../../utils/api';
import { fmt } from '../../utils/helpers';
import Modal from '../shared/Modal';

const MAX_PHOTO_BYTES    = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTOS         = 12;
const MAX_CAPTION_LEN    = 200;
const INITIAL_VISIBLE    = 1;
const LOAD_STEP          = 3;

export default function PhotoGallery({ tournamentId, isOwner = false, canUpload = false }) {
  const fileInputRef = useRef(null);
  const [photos,     setPhotos]     = useState([]);
  const [visible,    setVisible]    = useState(INITIAL_VISIBLE);
  const [loading,    setLoading]    = useState(true);
  const [listError,  setListError]  = useState(null);

  // Upload (single, con modal de caption)
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState(null);
  const [captionDraft, setCaptionDraft] = useState('');
  const [pendingFile,  setPendingFile]  = useState(null);

  // Upload múltiple (batch)
  const [batch, setBatch] = useState(null); // { total, done }

  // Edición inline de caption
  const [editingId,  setEditingId]  = useState(null);
  const [editDraft,  setEditDraft]  = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [lightbox,     setLightbox]     = useState(null);
  const [confirmDel,   setConfirmDel]   = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setListError(null);
    api.photos.list(tournamentId)
      .then((list) => { if (alive) { setPhotos(Array.isArray(list) ? list : []); setVisible(INITIAL_VISIBLE); } })
      .catch((e)   => { if (alive) { setListError(e.message); console.error('[PhotoGallery] list failed:', e); } })
      .finally(()  => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tournamentId]);

  function openFilePicker() {
    if (uploading || batch) return;
    setUploadError(null);
    fileInputRef.current?.click();
  }

  function validateFile(file) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) return `${file.name}: formato no soportado`;
    if (file.size > MAX_PHOTO_BYTES)             return `${file.name}: excede 10 MB`;
    return null;
  }

  async function handleFilesPicked(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const issues = [];
    const valid  = [];
    for (const f of files) {
      const err = validateFile(f);
      if (err) issues.push(err); else valid.push(f);
    }

    const slotsLeft = Math.max(0, MAX_PHOTOS - photos.length);
    if (slotsLeft === 0) {
      setUploadError(`Límite de ${MAX_PHOTOS} fotos alcanzado`); return;
    }
    const toUpload = valid.slice(0, slotsLeft);
    const overflow = valid.length - toUpload.length;

    if (toUpload.length === 0) {
      setUploadError(issues.join(' · ') || 'No hay archivos válidos'); return;
    }

    // 1 archivo → modal para agregar caption antes de subir.
    if (toUpload.length === 1 && issues.length === 0 && overflow === 0) {
      setPendingFile(toUpload[0]);
      setCaptionDraft('');
      setUploadError(null);
      return;
    }

    // >1 archivo → batch sin caption (el usuario las puede editar después).
    await uploadBatch(toUpload, { issues, overflow });
  }

  async function uploadBatch(files, { issues = [], overflow = 0 } = {}) {
    setUploadError(null);
    setBatch({ total: files.length, done: 0 });
    const uploaded = [];
    const errors   = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const created = await api.photos.upload(tournamentId, files[i], '');
        uploaded.push(created);
      } catch (err) {
        errors.push(`${files[i].name}: ${err.message}`);
      }
      setBatch({ total: files.length, done: i + 1 });
    }

    // Mantener orden: más nuevas primero.
    setPhotos((prev) => [...uploaded.reverse(), ...prev]);
    setBatch(null);

    const msg = [];
    if (issues.length)   msg.push(...issues);
    if (overflow > 0)    msg.push(`${overflow} no subida(s) por el límite de ${MAX_PHOTOS}`);
    if (errors.length)   msg.push(...errors);
    if (msg.length)      setUploadError(msg.join(' · '));
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const created = await api.photos.upload(tournamentId, pendingFile, captionDraft.trim());
      setPhotos((prev) => [created, ...prev]);
      setPendingFile(null);
      setCaptionDraft('');
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function cancelPending() {
    if (uploading) return;
    setPendingFile(null);
    setCaptionDraft('');
    setUploadError(null);
  }

  async function handleDelete(photoId) {
    try {
      await api.photos.delete(tournamentId, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setConfirmDel(null);
      setLightbox((lb) => (lb?.id === photoId ? null : lb));
    } catch (err) {
      setUploadError(err.message);
      setConfirmDel(null);
    }
  }

  function startEdit(photo) {
    setEditingId(photo.id);
    setEditDraft(photo.caption ?? '');
    setUploadError(null);
  }

  function cancelEdit() {
    if (editSaving) return;
    setEditingId(null);
    setEditDraft('');
  }

  async function saveEdit(photoId) {
    setEditSaving(true);
    try {
      const updated = await api.photos.updateCaption(tournamentId, photoId, editDraft.trim());
      setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, caption: updated.caption } : p));
      setEditingId(null);
      setEditDraft('');
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  const total        = photos.length;
  const shown        = photos.slice(0, visible);
  const remaining    = Math.max(0, total - visible);
  const reachedLimit = total >= MAX_PHOTOS;
  const busy         = uploading || !!batch;

  if (loading) {
    return (
      <div className="mt-8 pt-6 border-t border-border">
        <div className="font-condensed font-bold text-sm tracking-[3px] text-muted">FOTOS</div>
        <div className="text-xs font-mono text-dim mt-3">Cargando...</div>
      </div>
    );
  }

  // Visitante sin fotos y sin error: galería oculta.
  if (!isOwner && total === 0 && !listError) return null;

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="font-condensed font-bold text-sm tracking-[3px] text-muted flex items-center gap-2">
          <ImageIcon size={14} /> FOTOS {total > 0 && <span className="text-dim font-mono">({total}/{MAX_PHOTOS})</span>}
        </div>

        {canUpload && !reachedLimit && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFilesPicked}
            />
            <button
              type="button"
              onClick={openFilePicker}
              disabled={busy}
              className="flex items-center gap-1.5 bg-brand text-base border-0 px-3 py-1.5 font-condensed font-bold text-[12px] tracking-wide cursor-pointer rounded disabled:opacity-50 disabled:cursor-wait"
            >
              <Camera size={13} />
              {batch
                ? `SUBIENDO ${batch.done}/${batch.total}...`
                : 'SUBIR FOTOS'}
            </button>
          </>
        )}

        {isOwner && !canUpload && (
          <div className="flex items-center gap-1.5 text-[11px] text-dim font-mono border border-border-strong rounded px-2 py-1">
            <Lock size={11} /> Solo Premium
          </div>
        )}
      </div>

      {listError && (
        <div className="text-xs text-danger font-mono mb-3">{listError}</div>
      )}
      {uploadError && (
        <div className="text-xs text-danger font-mono mb-3">{uploadError}</div>
      )}

      {total === 0 && canUpload && (
        <div className="text-center text-dim py-8 px-5 font-sans text-sm border border-dashed border-border-mid rounded-lg">
          Todavía no hay fotos. Subí la primera para darle vida al torneo.
        </div>
      )}

      {shown.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shown.map((p) => {
            const isEditing = editingId === p.id;
            return (
              <div key={p.id} className="relative group rounded-lg overflow-hidden border border-border-mid bg-surface">
                <button
                  type="button"
                  onClick={() => setLightbox(p)}
                  className="block w-full p-0 bg-transparent border-0 cursor-pointer"
                >
                  <img
                    src={p.url}
                    alt={p.caption || 'Foto del torneo'}
                    loading="lazy"
                    className="w-full h-48 object-cover"
                  />
                </button>

                {isEditing ? (
                  <div className="px-3 py-2 flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')  saveEdit(p.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      maxLength={MAX_CAPTION_LEN}
                      placeholder="Descripción"
                      className="flex-1 bg-base border border-border-mid text-white px-2.5 py-1.5 rounded text-[12px] outline-none font-[Barlow]"
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(p.id)}
                      disabled={editSaving}
                      title="Guardar"
                      className="bg-brand text-base border-0 w-7 h-7 flex items-center justify-center cursor-pointer rounded disabled:opacity-50"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={editSaving}
                      title="Cancelar"
                      className="bg-transparent text-muted border border-border-strong w-7 h-7 flex items-center justify-center cursor-pointer rounded disabled:opacity-50"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="px-3 py-2 text-[12px] font-mono flex items-center justify-between gap-2">
                    <span className={`truncate ${p.caption ? 'text-muted' : 'text-dim italic'}`}>
                      {p.caption || (isOwner ? 'Sin descripción' : '')}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          title="Editar descripción"
                          className="bg-transparent text-dim border-0 cursor-pointer hover:text-white transition p-0"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      <span className="text-dim whitespace-nowrap">{fmt(p.created_at)}</span>
                    </div>
                  </div>
                )}

                {isOwner && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setConfirmDel(p)}
                    title="Eliminar foto"
                    className="absolute top-2 right-2 bg-base/80 text-muted border border-border-strong rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:text-danger hover:border-danger transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {remaining > 0 && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => setVisible((v) => Math.min(total, v + LOAD_STEP))}
            className="flex items-center gap-1.5 bg-transparent text-muted border border-border-strong px-4 py-2 text-xs font-mono cursor-pointer rounded hover:text-white hover:border-white transition"
          >
            <Plus size={12} /> Ver {Math.min(LOAD_STEP, remaining)} foto{remaining === 1 ? '' : 's'} más
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-1000 p-5"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 bg-surface text-white border border-border-strong rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-border-mid transition"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.caption || ''} className="w-full max-h-[80vh] object-contain rounded" />
            {lightbox.caption && (
              <div className="mt-3 text-center text-sm font-mono text-muted">{lightbox.caption}</div>
            )}
          </div>
        </div>
      )}

      {/* Modal de upload single (con caption opcional) */}
      {pendingFile && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-1000 p-5">
          <div className="bg-surface border border-border-strong rounded-[10px] p-6 max-w-105 w-full">
            <div className="font-condensed font-bold text-2xl text-white mb-2.5">Subir foto</div>
            <div className="text-sm text-secondary font-sans mb-4">
              {pendingFile.name} · {(pendingFile.size / 1024 / 1024).toFixed(1)} MB
            </div>
            <label className="block text-[11px] tracking-[2px] text-dim font-mono mb-1.5">DESCRIPCIÓN (OPCIONAL)</label>
            <input
              type="text"
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              maxLength={MAX_CAPTION_LEN}
              placeholder="Ej: Final del torneo"
              className="w-full bg-surface border border-border-mid text-white px-3.5 py-2.5 rounded text-sm outline-none font-[Barlow]"
            />
            {uploadError && <div className="text-xs text-danger font-mono mt-3">{uploadError}</div>}
            <div className="flex gap-2.5 justify-end mt-5">
              <button
                onClick={cancelPending}
                disabled={uploading}
                className="bg-transparent text-muted border border-border-strong px-5 py-2.5 text-sm cursor-pointer rounded font-sans disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmUpload}
                disabled={uploading}
                className="border-0 px-5 py-2.5 font-condensed font-bold text-sm tracking-wide cursor-pointer rounded whitespace-nowrap text-base bg-brand disabled:opacity-50 disabled:cursor-wait"
              >
                {uploading ? 'SUBIENDO...' : 'SUBIR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de borrado */}
      {confirmDel && (
        <Modal
          title="Eliminar foto"
          message="Esta acción es permanente."
          confirmText="Eliminar"
          confirmDanger
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => handleDelete(confirmDel.id)}
        />
      )}
    </div>
  );
}
