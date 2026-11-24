// src/components/views/DevicesView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, MessageSquare, Unlink, Check, Volume2, Edit2, Plus, Loader2 } from 'lucide-react';
import { PairRobotModal } from '../modals/PairRobotModal';

export function DevicesView() {
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

  const fetchDevice = async () => {
    try {
      const res = await fetch('/api/device/status');
      if (res.ok) {
        const data = await res.json();
        setDeviceData(data);
        setIsUnpaired(!data.paired);
        if (data.name) setDeviceName(data.name);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevice();
  }, []);

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
        /* Device Card */
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
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  Paired to: <strong className="text-[var(--text-primary)]">{deviceData?.child_name || 'Arjun'}</strong> (Class {deviceData?.child_class || 3})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#17A34A] font-semibold bg-[#17A34A]/10 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#17A34A] animate-pulse" />
              Online
            </div>
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
        onClose={() => setShowPairModal(false)}
        onSuccess={async () => {
          setIsUnpaired(false);
          await fetchDevice();
        }}
      />
    </div>
  );
}
