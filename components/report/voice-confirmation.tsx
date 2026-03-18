'use client';

import { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface VoiceConfirmationProps {
  complaintId: string;
  userName: string;
  issueTitle: string;
  onConfirmed?: () => void;
  onRejected?: () => void;
}

export function VoiceConfirmation({ complaintId, userName, issueTitle, onConfirmed, onRejected }: VoiceConfirmationProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'ended' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const retellClientRef = useRef<RetellWebClient | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
      }
    };
  }, []);

  const startCall = async () => {
    setStatus('connecting');

    try {
      // 1. Get access token from our API
      const res = await fetch('/api/retell/web-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, issueTitle, complaintId }),
      });

      const data = await res.json();
      if (!data.access_token) {
        throw new Error(data.error || 'Failed to get access token');
      }

      // 2. Initialize Retell Web Client
      const client = new RetellWebClient();
      retellClientRef.current = client;

      // 3. Listen to events
      client.on('call_started', () => {
        console.log('[VoiceConfirmation] Call started');
        setStatus('active');
      });

      client.on('call_ended', () => {
        console.log('[VoiceConfirmation] Call ended');
        setStatus('ended');
      });

      client.on('error', (error) => {
        console.error('[VoiceConfirmation] Error:', error);
        setStatus('error');
      });

      // 4. Start the call
      await client.startCall({
        accessToken: data.access_token,
      });

    } catch (error) {
      console.error('[VoiceConfirmation] Failed to start call:', error);
      setStatus('error');
    }
  };

  const endCall = () => {
    if (retellClientRef.current) {
      retellClientRef.current.stopCall();
      setStatus('ended');
    }
  };

  const toggleMute = () => {
    if (retellClientRef.current) {
      if (isMuted) {
        retellClientRef.current.unmute();
      } else {
        retellClientRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <Phone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">AI Voice Confirmation</h3>
          <p className="text-xs text-muted-foreground">
            Speak with our AI to confirm your report (Hindi / English)
          </p>
        </div>
      </div>

      {/* Status Display */}
      {status === 'idle' && (
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Click below to start a voice call with our AI assistant. It will ask you to confirm your report.
          </p>
          <Button
            onClick={startCall}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
          >
            <Phone className="mr-2 h-4 w-4" />
            Start Voice Confirmation Call
          </Button>
        </div>
      )}

      {status === 'connecting' && (
        <div className="text-center py-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Connecting to AI agent...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Please allow microphone access if prompted</p>
        </div>
      )}

      {status === 'active' && (
        <div className="text-center space-y-4">
          {/* Animated pulse ring */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-emerald-500/30 animate-pulse" />
            <Mic className="w-8 h-8 text-emerald-400 relative z-10" />
          </div>
          <p className="text-sm font-medium text-emerald-400">🔴 Call Active — Speak Now</p>
          <p className="text-xs text-muted-foreground">Say &quot;English&quot; or &quot;Hindi&quot; to choose your language</p>
          
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMute}
              className={`${isMuted ? 'border-red-500 text-red-400' : 'border-white/20'}`}
            >
              {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={endCall}
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              End Call
            </Button>
          </div>
        </div>
      )}

      {status === 'ended' && (
        <div className="text-center py-4 space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <p className="text-sm font-medium text-emerald-400">Call Completed</p>
          <p className="text-xs text-muted-foreground">Your response has been recorded. The system will process your confirmation.</p>
          <Button variant="outline" size="sm" onClick={() => setStatus('idle')}>
            Call Again
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-4 space-y-2">
          <XCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-sm font-medium text-red-400">Connection Failed</p>
          <p className="text-xs text-muted-foreground">Could not connect to the AI agent. Please try again.</p>
          <Button variant="outline" size="sm" onClick={() => setStatus('idle')}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
