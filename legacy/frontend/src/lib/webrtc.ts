import { supabase } from './supabase';

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
  senderId: string;
  recipientId: string;
}

export interface CallParticipant {
  id: string;
  name: string;
  avatar: string | null;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class WebRTCClient {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private callId: string;
  private userId: string;
  private remoteUserId: string | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null;
  private onCallEnded: (() => void) | null = null;

  constructor(callId: string, userId: string) {
    this.callId = callId;
    this.userId = userId;
  }

  async initialize(): Promise<MediaStream> {
    // Get local media stream
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // Create peer connection
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection
    this.localStream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    // Handle incoming remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onRemoteStreamCallback?.(this.remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.remoteUserId) {
        this.sendSignal('ice-candidate', event.candidate.toJSON());
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(this.peerConnection?.connectionState || 'disconnected');

      if (this.peerConnection?.connectionState === 'disconnected' ||
          this.peerConnection?.connectionState === 'failed') {
        this.onCallEnded?.();
      }
    };

    // Subscribe to signaling channel
    this.subscribeToChannel();

    return this.localStream;
  }

  private subscribeToChannel() {
    this.channel = supabase.channel(`video-call:${this.callId}`, {
      config: {
        presence: { key: this.userId },
      },
    });

    this.channel
      .on<WebRTCSignal>(
        'broadcast',
        { event: 'signal' },
        async (payload) => {
          const signal = payload.payload;
          if (signal.recipientId !== this.userId) return;

          await this.handleSignal(signal);
        }
      )
      .on('presence', { event: 'leave' }, (payload) => {
        if (payload.key === this.remoteUserId) {
          this.onCallEnded?.();
        }
      })
      .subscribe();

    // Track presence
    this.channel.track({ userId: this.userId });
  }

  private async handleSignal(signal: WebRTCSignal) {
    if (!this.peerConnection) return;

    switch (signal.type) {
      case 'offer': {
        this.remoteUserId = signal.senderId;
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(signal.data as RTCSessionDescriptionInit)
        );
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.sendSignal('answer', answer);
        break;
      }

      case 'answer':
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(signal.data as RTCSessionDescriptionInit)
        );
        break;

      case 'ice-candidate':
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(signal.data as RTCIceCandidateInit)
        );
        break;
    }
  }

  private sendSignal(type: WebRTCSignal['type'], data: WebRTCSignal['data']) {
    if (!this.channel || !this.remoteUserId) return;

    this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        type,
        data,
        senderId: this.userId,
        recipientId: this.remoteUserId,
      },
    });
  }

  async startCall(remoteUserId: string): Promise<void> {
    if (!this.peerConnection) throw new Error('Connection not initialized');

    this.remoteUserId = remoteUserId;

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.sendSignal('offer', offer);
  }

  setOnRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  setOnConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChange = callback;
  }

  setOnCallEnded(callback: () => void) {
    this.onCallEnded = callback;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  async startScreenShare(): Promise<MediaStream | null> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      // Replace the video track
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = this.peerConnection
        ?.getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      // Handle when screen sharing ends
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      return null;
    }
  }

  async stopScreenShare() {
    // Revert to camera
    const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const videoTrack = cameraStream.getVideoTracks()[0];
    const sender = this.peerConnection
      ?.getSenders()
      .find((s) => s.track?.kind === 'video');

    if (sender && videoTrack) {
      await sender.replaceTrack(videoTrack);
    }
  }

  endCall() {
    // Stop all tracks
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.remoteStream?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    this.peerConnection?.close();
    this.peerConnection = null;

    // Unsubscribe from channel
    if (this.channel) {
      this.channel.untrack();
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
