// src/components/views/DevicesView.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Cpu,
  Wifi,
  Unlink,
  Check,
  Volume2,
  Edit2,
  Plus,
  Loader2,
  Camera,
  Smile,
  Download,
  Trash2
} from 'lucide-react';
import { PairRobotModal } from '../modals/PairRobotModal';

const FACE_OPTIONS = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'excited', emoji: '🤩', label: 'Excited' },
  { id: 'love', emoji: '🥰', label: 'Love' },
  { id: 'proud', emoji: '🏆', label: 'Proud' },
  { id: 'correct', emoji: '✅', label: 'Correct' },
  { id: 'surprised', emoji: '😮', label: 'Surprised' },
  { id: 'thinking', emoji: '🤔', label: 'Thinking' },
  { id: 'focus', emoji: '🎯', label: 'Focus' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'grumpy', emoji: '😠', label: 'Grumpy' },
  { id: 'sleep', emoji: '😴', label: 'Sleep' },
  { id: 'idle', emoji: '🙂', label: 'Normal' }
] as const;

interface CameraPhotoItem {
  id: string;
  device_id: string;
  child_id: string | null;
  cmd_id: number | null;
  created_at: string;
  signed_url: string;
}

interface ChildOption {
  id: string;
  name: string;
  cbse_class: number;
  avatar: string;
}

interface DevicesViewProps {
  childrenList?: ChildOption[];
  onRefresh?: () => void;
  onOpenChangeClass?: () => void;
}

export function DevicesView({ childrenList = [], onRefresh, onOpenChangeClass }: DevicesViewProps) {
  const [sayText, setSayText] = useState('');
  const [showSayModal, setShowSayModal] = useState(false);
  const [showUnpairModal, setShowUnpairModal] = useState(false);
  const [showPairModal, setShowPairModal] = useState(false);
  const [sayStatus, setSayStatus] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('DuDu');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUnpaired, setIsUnpaired] = useState(false);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildOption[]>(childrenList);
  const [assigning, setAssigning] = useState(false);

  // Camera & Face state
  const [faceDuration, setFaceDuration] = useState<'10' | '60' | '0'>('10');
  const [faceSending, setFaceSending] = useState<string | null>(null);
  const [faceFeedback, setFaceFeedback] = useState<string | null>(null);
  const [cameraPhotos, setCameraPhotos] = useState<CameraPhotoItem[]>([]);
  const [pendingPhotoCmdId, setPendingPhotoCmdId] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const photoPollAttemptsRef = useRef(0);

  const fetchDevice = useCallback(async () => {
    try {
      const res = await fetch('/api/device/status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDeviceData(data);
        setIsUnpaired(!data.paired);
        if (data.name) setDeviceName(data.name);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchCameraPhotos = useCallback(async (devId: string, cmdId?: number | null) => {
    try {
      const qs = cmdId ? `?cmd_id=${cmdId}` : '';
      const res = await fetch(`/api/devices/${devId}/photos${qs}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data.photos)) {
        setCameraPhotos(data.photos);
      }
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchDevice();
    if (childrenList.length > 0) {
      setChildren(childrenList);
    } else {
      fetch('/api/children')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.children) setChildren(d.children);
        })
        .catch(() => {});
    }
  }, [childrenList, fetchDevice]);

  // Watching heartbeat (every 60s while visible) + device status refresh (every 8s)
  useEffect(() => {
    const devId = deviceData?.id;
    if (!devId || isUnpaired) return;

    fetchCameraPhotos(devId);

    const pingWatching = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      fetch(`/api/devices/${devId}/watching`, { method: 'POST' }).catch(() => {});
    };

    pingWatching();
    const watchTimer = setInterval(pingWatching, 60000);
    const statusTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchDevice();
      }
    }, 8000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        pingWatching();
        fetchDevice();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(watchTimer);
      clearInterval(statusTimer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [deviceData?.id, isUnpaired, fetchDevice, fetchCameraPhotos]);

  // Poll for pending photo every 3s for up to 2 minutes (40 attempts)
  useEffect(() => {
    const devId = deviceData?.id;
    if (!devId || !pendingPhotoCmdId) return;

    photoPollAttemptsRef.current = 0;
    const timer = setInterval(async () => {
      photoPollAttemptsRef.current += 1;
      const data = await fetchCameraPhotos(devId, pendingPhotoCmdId);
      if (data) {
        const arrived = (data.photos || []).some(
          (p: CameraPhotoItem) => p.cmd_id === pendingPhotoCmdId
        );
        if (arrived) {
          setPendingPhotoCmdId(null);
          setPhotoError(null);
          clearInterval(timer);
          return;
        }
        if (data.cmd_status?.photo_error) {
          setPhotoError(data.cmd_status.photo_error);
          setPendingPhotoCmdId(null);
          clearInterval(timer);
          return;
        }
      }
      if (photoPollAttemptsRef.current >= 40) {
        setPhotoError('Timed out waiting for DuDu to upload the photo.');
        setPendingPhotoCmdId(null);
        clearInterval(timer);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [deviceData?.id, pendingPhotoCmdId, fetchCameraPhotos]);

  const handleFaceClick = async (faceId: string) => {
    if (!deviceData?.id || !deviceData?.online) return;
    setFaceSending(faceId);
    setFaceFeedback(null);
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceData.id,
          type: 'face',
          arg: `${faceId}|${faceDuration}`
        })
      });
      if (res.ok) {
        setFaceFeedback(`Sent ${faceId} face to DuDu!`);
        setTimeout(() => setFaceFeedback(null), 3000);
      }
    } catch {} finally {
      setFaceSending(null);
    }
  };

  const handleTakePhoto = async () => {
    if (!deviceData?.id || !deviceData?.online || pendingPhotoCmdId) return;
    setTakingPhoto(true);
    setPhotoError(null);
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceData.id,
          type: 'photo',
          arg: ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.command?.id) {
          setPendingPhotoCmdId(data.command.id);
        }
      } else {
        setPhotoError('Could not queue photo command.');
      }
    } catch {
      setPhotoError('Network error while requesting photo.');
    } finally {
      setTakingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!deviceData?.id) return;
    setDeletingPhotoId(photoId);
    try {
      const res = await fetch(
        `/api/devices/${deviceData.id}/photos?photo_id=${encodeURIComponent(photoId)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setCameraPhotos((prev) => prev.filter((p) => p.id !== photoId));
      }
    } catch {} finally {
      setDeletingPhotoId(null);
    }
  };

  const handleDownloadPhoto = async (photo: CameraPhotoItem) => {
    if (!photo.signed_url) return;
    try {
      const res = await fetch(photo.signed_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dudu-photo-${photo.id.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(photo.signed_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAssignChild = async (newChildId: string) => {
    if (!deviceData?.id) return;
    setAssigning(true);
    try {
      const res = await fetch('/api/devices/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceData.id,
          child_id: newChildId
        })
      });
      if (res.ok) {
        await fetchDevice();
        onRefresh?.();
      }
    } catch {}
    finally {
      setAssigning(false);
    }
  };

  const handleSaySubmit = async () => {
    if (!sayText.trim() || sayText.length > 120) return;
    try {
      await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceData?.id || '33333333-3333-3333-3333-333333333333',
          type: 'say',
          arg: sayText
        })
      });
      setSayStatus('success');
      setTimeout(() => {
        setSayStatus(null);
        setShowSayModal(false);
        setSayText('');
      }, 2500);
    } catch {}
  };

  const handleUnpairSubmit = async () => {
    try {
      await fetch('/api/unpair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceData?.id || '33333333-3333-3333-3333-333333333333'
        })
      });
      setIsUnpaired(true);
      setShowUnpairModal(false);
      await fetchDevice();
    } catch {}
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Connected Devices</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Manage DuDu desk robots paired to your family
          </p>
        </div>
        <button
          onClick={() => setShowPairModal(true)}
          className="btn btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Pair a robot
        </button>
      </div>

      {isUnpaired ? (
        <div className="card p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#ECE7DE] text-[#6B7280] flex items-center justify-center mx-auto">
            <Unlink className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#1F2328]">No devices paired</h2>
          <p className="text-xs text-[#6B7280]">
            The robot was unpaired. To link it again, enter the 6-digit code shown on the robot screen.
          </p>
          <button
            onClick={() => setShowPairModal(true)}
            className="btn btn-primary text-xs px-4"
          >
            Pair a robot
          </button>
        </div>
      ) : (
        <>
        {/* Device Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F26B1D]/15 text-[#F26B1D] flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <input
                      type="text"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      autoFocus
                      className="text-base font-bold text-[#1F2328] border-b border-[#F26B1D] bg-transparent outline-none"
                    />
                  ) : (
                    <h2 className="text-base font-bold text-[#1F2328] flex items-center gap-1.5">
                      {deviceName}
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-[#6B7280] hover:text-[#1F2328]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </h2>
                  )}
                  <span className="text-[10px] bg-[var(--badge-bg)] text-[var(--text-muted)] font-mono px-2 py-0.5 rounded">
                    {deviceData?.device_uid || 'DUDU-90932C9FC114'}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>
                    Paired to: <strong className="text-[var(--text-primary)]">{deviceData?.child_name || 'Arjun'}</strong> (Class {deviceData?.child_class || 3})
                  </span>
                  {onOpenChangeClass && (
                    <>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={onOpenChangeClass}
                        className="text-[var(--brand-orange)] font-semibold hover:underline"
                      >
                        Change class
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                deviceData?.online
                  ? 'text-[var(--success-green)] bg-[var(--success-green)]/10'
                  : 'text-[var(--text-muted)] bg-[var(--badge-bg)]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  deviceData?.online ? 'bg-[var(--success-green)] animate-pulse' : 'bg-[var(--text-muted)]'
                }`}
              />
              {deviceData?.online ? 'Online' : 'Offline'}
            </div>
          </div>

          {/* This robot is used by selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border-card)]">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              This robot is used by:
            </span>
            <select
              disabled={assigning}
              value={deviceData?.child_id || ''}
              onChange={(e) => handleAssignChild(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-orange)]"
            >
              {(children.length > 0
                ? children
                : [{ id: '22222222-2222-2222-2222-222222222222', name: 'Arjun', cbse_class: 3, avatar: '👦' }]
              ).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.avatar || '👦'} {c.name} (Class {c.cbse_class})
                </option>
              ))}
            </select>
          </div>

          {/* Telemetry info */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-[var(--border-card)] text-xs">
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Local IP</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">{deviceData?.ip || '—'}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Wi-Fi RSSI</span>
              <span className="font-medium text-[var(--text-primary)] flex items-center gap-1">
                <Wifi className="w-3 h-3 text-[var(--success-green)]" />{' '}
                {deviceData?.rssi !== null && deviceData?.rssi !== undefined ? `${deviceData.rssi} dBm` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Firmware</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                v{deviceData?.firmware || '1.0'} (ESP32-S3)
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setShowSayModal(true)}
              className="btn btn-secondary text-xs flex-1 gap-2 py-2.5"
            >
              <Volume2 className="w-4 h-4 text-[#F26B1D]" /> Say something
            </button>
            <button
              onClick={() => setShowUnpairModal(true)}
              className="btn btn-secondary text-xs text-[#D8262B] hover:bg-[#D8262B]/5 border-[#ECE7DE] gap-1.5 px-4"
            >
              <Unlink className="w-4 h-4" /> Unpair
            </button>
          </div>
        </div>

        {/* Camera & Face Card */}
        <div
          className={`card p-5 space-y-5 transition-opacity ${
            !deviceData?.online ? 'opacity-60' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-[var(--brand-orange)]" />
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Camera &amp; Face</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Set DuDu&rsquo;s mood face or ask DuDu to take a photo
                </p>
              </div>
            </div>
            {!deviceData?.online && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--badge-bg)] text-[var(--text-muted)]">
                DuDu is offline
              </span>
            )}
          </div>

          {/* Mood Face Buttons */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--text-primary)]">Mood face</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-muted)]">How long:</span>
                <select
                  disabled={!deviceData?.online}
                  value={faceDuration}
                  onChange={(e) => setFaceDuration(e.target.value as '10' | '60' | '0')}
                  className="bg-[var(--input-bg)] border border-[var(--border-card)] rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed"
                >
                  <option value="10">10 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="0">Keep it</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {FACE_OPTIONS.map((f) => {
                const isActive = (deviceData?.face || 'idle') === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={!deviceData?.online || faceSending === f.id}
                    onClick={() => handleFaceClick(f.id)}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all disabled:cursor-not-allowed ${
                      isActive
                        ? 'bg-[var(--brand-orange)]/15 border-[var(--brand-orange)] text-[var(--brand-orange)] shadow-sm'
                        : 'bg-[var(--input-bg)] border-[var(--border-card)] text-[var(--text-primary)] hover:border-[var(--brand-orange)]/50'
                    }`}
                  >
                    <span>{f.emoji}</span>
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
            {faceFeedback && (
              <div className="text-xs text-[var(--success-green)] font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {faceFeedback}
              </div>
            )}
          </div>

          {/* Take Photo Section */}
          <div className="pt-4 border-t border-[var(--border-card)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <button
                  type="button"
                  disabled={!deviceData?.online || takingPhoto || pendingPhotoCmdId !== null}
                  onClick={handleTakePhoto}
                  className="btn btn-primary text-xs px-4 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pendingPhotoCmdId !== null || takingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Waiting for DuDu…
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Take photo
                    </>
                  )}
                </button>
                <p className="text-[11px] text-[var(--text-muted)]">
                  DuDu will announce the photo and count 3-2-1 first.
                </p>
              </div>
            </div>

            {photoError && (
              <div className="text-xs text-[var(--error-red)] bg-[var(--error-red)]/10 px-3 py-2 rounded-xl font-medium">
                {photoError}
              </div>
            )}

            {cameraPhotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {cameraPhotos.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-[var(--border-card)] bg-[var(--input-bg)] overflow-hidden flex flex-col"
                  >
                    {p.signed_url ? (
                      <img
                        src={p.signed_url}
                        alt="DuDu camera"
                        className="w-full h-28 object-cover bg-black/10"
                      />
                    ) : (
                      <div className="w-full h-28 flex items-center justify-center bg-black/5 text-[11px] text-[var(--text-muted)]">
                        Photo saved
                      </div>
                    )}
                    <div className="p-2 space-y-1.5">
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {new Date(p.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={!p.signed_url}
                          onClick={() => handleDownloadPhoto(p)}
                          className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] hover:border-[var(--brand-orange)] disabled:opacity-40"
                        >
                          <Download className="w-3 h-3" /> Download
                        </button>
                        <button
                          type="button"
                          disabled={deletingPhotoId === p.id}
                          onClick={() => handleDeletePhoto(p.id)}
                          aria-label="Delete photo"
                          className="flex items-center justify-center p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--error-red)] hover:bg-[var(--error-red)]/10 disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* Say Something Modal */}
      {showSayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[#F26B1D]" />
              <h3 className="text-base font-bold text-[#1F2328]">Speak on DuDu</h3>
            </div>
            <p className="text-xs text-[#6B7280]">
              The robot will speak this text to Arjun using its voice synthesizer. Maximum 120 characters.
            </p>
            <div>
              <textarea
                rows={3}
                maxLength={120}
                placeholder="e.g. Great job on your homework, Arjun! Time for dinner."
                value={sayText}
                onChange={(e) => setSayText(e.target.value)}
                className="w-full bg-[#F6F3EE] border border-[#ECE7DE] rounded-xl p-3 text-xs text-[#1F2328]"
              />
              <div className="flex justify-between text-[11px] text-[#6B7280] mt-1">
                <span>Natural voice synthesis</span>
                <span>{sayText.length}/120</span>
              </div>
            </div>

            {sayStatus === 'success' ? (
              <div className="text-xs text-[#17A34A] font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Command queued for DuDu!
              </div>
            ) : (
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSayModal(false)}
                  className="btn btn-secondary text-xs px-4"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaySubmit}
                  disabled={!sayText.trim()}
                  className="btn btn-primary text-xs px-4 disabled:opacity-50"
                >
                  Send to Robot
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unpair Modal */}
      {showUnpairModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-[#D8262B]">Unpair this robot?</h3>
            <p className="text-xs text-[#6B7280]">
              This sends an unpair command to the ESP32-S3 firmware and disconnects it from Arjun’s profile. The robot will reset to show a pairing code.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowUnpairModal(false)}
                className="btn btn-secondary text-xs px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleUnpairSubmit}
                className="btn bg-[#D8262B] text-white text-xs px-4 hover:bg-[#b01e23]"
              >
                Unpair Now
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pair Robot Modal */}
      <PairRobotModal
        isOpen={showPairModal}
        childrenList={children}
        onClose={() => setShowPairModal(false)}
        onSuccess={async () => {
          setIsUnpaired(false);
          await fetchDevice();
        }}
      />
    </div>
  );
}
