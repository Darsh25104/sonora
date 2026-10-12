import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { useUI } from '../context/UIContext.jsx';
import * as songsService from '../services/songs.service.js';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import CoverImage from '../components/common/CoverImage.jsx';
import { UploadIcon, MusicNoteIcon, XIcon } from '../components/common/icons.jsx';

const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg'];
const AUDIO_EXT = /\.(mp3|wav|ogg)$/i;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Reads the audio file locally to measure its duration (seconds) before
 * uploading — this is the value the backend stores and the seek bar uses.
 */
function readAudioDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      const seconds = Number.isFinite(probe.duration) ? probe.duration : 0;
      URL.revokeObjectURL(url);
      resolve(seconds);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    probe.src = url;
  });
}

function UploadContent() {
  useDocumentTitle('Upload song');
  const { showToast } = useUI();
  const navigate = useNavigate();
  const audioInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [form, setForm] = useState({ title: '', artist: '', album: '', genre: '' });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const pickAudio = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const valid = AUDIO_TYPES.includes(file.type) || AUDIO_EXT.test(file.name);
    if (!valid) {
      showToast('Only MP3, WAV or OGG audio files are allowed.', 'error');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      showToast('Audio file is larger than 50 MB.', 'error');
      event.target.value = '';
      return;
    }
    setAudioFile(file);
    // Auto-fill the title from the filename when it's still empty.
    setForm((f) => (f.title ? f : { ...f, title: file.name.replace(AUDIO_EXT, '') }));
  };

  const pickCover = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      showToast('Cover must be a JPG, PNG or WebP image.', 'error');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast('Cover image must be smaller than 5 MB.', 'error');
      event.target.value = '';
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const clearAudio = () => {
    setAudioFile(null);
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const clearCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;

    if (!form.title.trim() || !form.artist.trim()) {
      showToast('Title and artist are required.', 'error');
      return;
    }
    if (!audioFile) {
      showToast('Please choose an audio file (MP3, WAV or OGG).', 'error');
      return;
    }

    const duration = await readAudioDuration(audioFile);

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('artist', form.artist.trim());
    formData.append('album', form.album.trim());
    formData.append('genre', form.genre.trim());
    formData.append('duration', String(Math.round(duration)));
    formData.append('audio', audioFile);
    if (coverFile) formData.append('cover', coverFile);

    setBusy(true);
    setProgress(0);
    try {
      const song = await songsService.create(formData, (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      });
      showToast(`"${song.title}" uploaded successfully`, 'success');
      navigate('/admin');
    } catch (err) {
      showToast(err.message || 'Upload failed.', 'error');
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="page page--narrow">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Admin / Artist</p>
          <h1>Upload a song</h1>
          <p className="muted">MP3, WAV or OGG up to 50 MB · cover image up to 5 MB (JPG, PNG, WebP).</p>
        </div>
        <Link to="/admin" className="btn btn--ghost">← Dashboard</Link>
      </header>

      <form className="panel form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Song title *</span>
          <input className="input" value={form.title} onChange={update('title')} placeholder="Neon Horizon" required />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Artist *</span>
            <input className="input" value={form.artist} onChange={update('artist')} placeholder="Lumen Fields" required />
          </label>
          <label className="field">
            <span>Album</span>
            <input className="input" value={form.album} onChange={update('album')} placeholder="Leave empty for Single" />
          </label>
        </div>

        <label className="field">
          <span>Genre</span>
          <input className="input" value={form.genre} onChange={update('genre')} placeholder="Synthwave" />
        </label>

        {/* -------- audio picker -------- */}
        <div className="field">
          <span>Audio file *</span>
          {!audioFile ? (
            <button
              type="button"
              className="dropzone"
              onClick={() => audioInputRef.current?.click()}
            >
              <MusicNoteIcon size={26} />
              <strong>Choose an audio file</strong>
              <small>MP3 · WAV · OGG — max 50 MB</small>
            </button>
          ) : (
            <div className="file-chip">
              <MusicNoteIcon size={18} />
              <span className="file-chip__name">{audioFile.name}</span>
              <span className="file-chip__size">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</span>
              <button type="button" className="icon-btn" onClick={clearAudio} aria-label="Remove audio file">
                <XIcon size={16} />
              </button>
            </div>
          )}
          <input
            ref={audioInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
            onChange={pickAudio}
            hidden
          />
        </div>

        {/* -------- cover picker -------- */}
        <div className="field">
          <span>Cover image (optional)</span>
          <div className="cover-picker">
            <button type="button" className="cover-picker__preview" onClick={() => coverInputRef.current?.click()}>
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" />
              ) : (
                <span><UploadIcon size={22} /> Choose cover</span>
              )}
            </button>
            {coverFile && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={clearCover}>
                Remove
              </button>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={pickCover}
            hidden
          />
        </div>

        {/* -------- live preview -------- */}
        <div className="upload-preview">
          <CoverImage
            src={coverPreview || ''}
            alt={form.title || 'New song'}
            seed={form.title || 'new-song'}
            className="upload-preview__cover"
            iconSize={26}
          />
          <div>
            <strong>{form.title || 'Untitled'}</strong>
            <p className="muted">{form.artist || 'Unknown artist'} · {form.album || 'Single'}</p>
          </div>
        </div>

        {busy && (
          <div className="progress-upload" aria-live="polite">
            <div className="progress-upload__bar" style={{ width: `${progress}%` }} />
            <span>{progress < 100 ? `Uploading... ${progress}%` : 'Processing...'}</span>
          </div>
        )}

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={() => navigate('/admin')} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn--play" disabled={busy}>
            <UploadIcon size={18} /> {busy ? 'Uploading...' : 'Upload song'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminUpload() {
  return (
    <ProtectedRoute adminOnly>
      <UploadContent />
    </ProtectedRoute>
  );
}
