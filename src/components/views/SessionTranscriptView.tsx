// src/components/views/SessionTranscriptView.tsx
'use client';

import React, { useState } from 'react';
import { ArrowLeft, Flag, Trash2, Camera, CameraOff, AlertCircle, Check, MessageSquare } from 'lucide-react';

interface SessionTranscriptViewProps {
  onBack: () => void;
}

export function SessionTranscriptView({ onBack }: SessionTranscriptViewProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flagTurnId, setFlagTurnId] = useState<number | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [turns, setTurns] = useState([
    {
      id: 1,
      speaker: 'robot',
      text: "Let's learn about two-digit addition with carrying. I'll ask you a few questions. Ready?",
      off_topic: false
    },
    { id: 2, speaker: 'child', text: 'yes', off_topic: false },
    {
      id: 3,
      speaker: 'robot',
      text: "Great. Let's add 47 and 38. We start with the ones. What is 7 plus 8?",
      off_topic: false
    },
    { id: 4, speaker: 'child', text: 'fifteen', off_topic: false },
    {
      id: 5,
      speaker: 'robot',
      text: 'Yes, 15! So we write 5 and carry 1 to the tens. Now, what is 4 plus 3 plus the carried 1?',
      off_topic: false
    },
    {
      id: 6,
      speaker: 'child',
      text: 'can we play cricket game',
      off_topic: true,
      note: 'Off-topic · stayed on syllabus (your setting)'
    },
    {
      id: 7,
      speaker: 'robot',
      text: 'I can only help with your school subjects right now. Shall we finish this sum first? What is 4 plus 3 plus 1?',
      off_topic: false
    },
    { id: 8, speaker: 'child', text: 'eight', off_topic: false },
    {
      id: 9,
      speaker: 'robot',
      text: 'Spot on! So 47 plus 38 gives us 85. Excellent work, Arjun!',
      off_topic: false
    }
  ]);

  const handleFlagSubmit = async () => {
    if (!flagTurnId || !flagReason) return;
    try {
      await fetch('/api/transcript/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'flag',
          turn_id: flagTurnId,
          reason: flagReason
        })
      });
      setFlagSuccess(true);
      setTimeout(() => {
        setFlagSuccess(false);
        setFlagTurnId(null);
        setFlagReason('');
      }, 2000);
    } catch {}
  };

  const handleDeleteTranscript = async () => {
    try {
      await fetch('/api/transcript/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          session_id: '44444444-4444-4444-4444-444444444441'
        })
      });
      setTurns([]);
      setShowDeleteModal(false);
    } catch {}
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#1F2328]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Today
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-xs font-semibold text-[#D8262B] hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete transcript
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1F2328]">Learn · Give and Take</h1>
        <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-1">
          <span>Today 5:05 – 5:31 pm · 26 min</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <CameraOff className="w-3.5 h-3.5" /> camera off
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <span className="text-[11px] text-[#6B7280] block">Questions</span>
          <span className="text-lg font-bold text-[#1F2328]">14</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-[11px] text-[#6B7280] block">Answered right</span>
          <span className="text-lg font-bold text-[#17A34A]">11</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-[11px] text-[#6B7280] block">Off-topic asks</span>
          <span className="text-lg font-bold text-[#B7791F]">1</span>
        </div>
      </div>

      {/* Chat Transcript */}
      <div className="card p-5 space-y-4">
        {turns.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280] text-sm">
            Transcript has been deleted. Session statistics are retained.
          </div>
        ) : (
          turns.map((turn) => {
            const isRobot = turn.speaker === 'robot';
            return (
              <div
                key={turn.id}
                className={`flex flex-col ${isRobot ? 'items-start' : 'items-end'}`}
              >
                <div className="text-[10px] text-[#6B7280] mb-1 px-1">
                  {isRobot ? 'EduBuddy' : 'Arjun'}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    isRobot
                      ? 'bg-[#F6F3EE] text-[#1F2328] rounded-tl-sm'
                      : 'bg-[#1E6FE0] text-white rounded-tr-sm'
                  }`}
                >
                  {turn.text}
                </div>

                {/* Off-topic notice */}
                {turn.off_topic && (
                  <div className="text-[11px] text-[#B7791F] font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Off-topic · stayed on syllabus (your setting)</span>
                  </div>
                )}

                {/* Flag option for robot turns */}
                {isRobot && (
                  <button
                    onClick={() => setFlagTurnId(turn.id)}
                    className="text-[10px] text-[#6B7280] hover:text-[#D8262B] mt-1 flex items-center gap-1 opacity-70 hover:opacity-100"
                  >
                    <Flag className="w-2.5 h-2.5" /> Flag this reply
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Flag Dialog */}
      {flagTurnId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-[#1F2328]">Flag Robot Response</h3>
            <p className="text-xs text-[#6B7280]">
              Tell us why this response was inaccurate or unsuitable. We review flagged responses to improve CBSE tutor accuracy.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Inaccurate explanation, too complex, off-syllabus..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="w-full bg-[#F6F3EE] border border-[#ECE7DE] rounded-xl p-3 text-xs text-[#1F2328]"
            />
            {flagSuccess ? (
              <div className="text-xs text-[#17A34A] font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Flag recorded. Thank you!
              </div>
            ) : (
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setFlagTurnId(null)}
                  className="btn btn-secondary text-xs px-4"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFlagSubmit}
                  disabled={!flagReason.trim()}
                  className="btn btn-primary text-xs px-4 disabled:opacity-50"
                >
                  Submit Flag
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-[#D8262B]">Delete Session Transcript?</h3>
            <p className="text-xs text-[#6B7280]">
              This will permanently delete the text turns of this session in compliance with the DPDP privacy policy. Session duration and aggregate marks will remain intact.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary text-xs px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTranscript}
                className="btn bg-[#D8262B] text-white text-xs px-4 hover:bg-[#b01e23]"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
