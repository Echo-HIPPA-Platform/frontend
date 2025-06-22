import React, { useEffect, useRef, useState } from 'react';
import Video, { Room } from 'twilio-video';

interface VideoCallModalProps {
  appointmentId: number;
  onClose: () => void;
  userToken: string;
}

const API_URL = '/api/v1/video/token-simple';

const VideoCallModal: React.FC<VideoCallModalProps> = ({ appointmentId, onClose, userToken }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let activeRoom: Room | null = null;

    const fetchTokenAndJoin = async () => {
      try {
        const roomName = `appointment-${appointmentId}`;
        const payload = { room_name: roomName, identity: `user-${appointmentId}` };

        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Include auth header only if backend requires authentication for this endpoint
            'Authorization': `Bearer ${userToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Failed to get access token');
        }

        const data = await res.json();

        // Extract the access token correctly
        const accessToken = data.access_token || data.token || data.accessToken;

        if (!accessToken || !accessToken.startsWith('ey')) {
          throw new Error('Invalid access token received from server.');
        }

        // Join the Twilio room using the access token
        activeRoom = await Video.connect(accessToken, {
          name: roomName,
          audio: true,
          video: { width: 640 },
        });

        setRoom(activeRoom);
        setMeetingLink(`${window.location.origin}/dashboard/appointments/${appointmentId}?join=1`);

        // Attach local video tracks to localVideoRef
        activeRoom.localParticipant.videoTracks.forEach(publication => {
          const track = publication.track;
          if (track && localVideoRef.current) {
            localVideoRef.current.appendChild(track.attach());
          }
        });

        // Function to handle remote participant's tracks
        const handleParticipant = (participant: any) => {
          participant.tracks.forEach((publication: any) => {
            if (publication.isSubscribed) {
              const track = publication.track;
              if (track.kind === 'video' && remoteVideoRef.current) {
                remoteVideoRef.current.appendChild(track.attach());
              }
            }
          });

          participant.on('trackSubscribed', (track: any) => {
            if (track.kind === 'video' && remoteVideoRef.current) {
              remoteVideoRef.current.appendChild(track.attach());
            }
          });

          participant.on('trackUnsubscribed', (track: any) => {
            if (typeof track.detach === 'function') {
              track.detach().forEach((el: any) => el.remove());
            }
          });
        };

        // Attach already connected participants
        activeRoom.participants.forEach(handleParticipant);
        // Listen for new participants
        activeRoom.on('participantConnected', handleParticipant);

      } catch (err: any) {
        console.error('Video call connection error:', err);
        setError(err.message || 'Failed to join video call.');
      }
    };

    fetchTokenAndJoin();

    return () => {
      if (activeRoom) {
        activeRoom.disconnect();
      }
    };
  }, [appointmentId, userToken]);

  const handleCopyLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink);
      alert('Meeting link copied!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-100 bg-opacity-90 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl border w-full max-w-2xl">
        <div className="flex justify-between items-center px-8 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-3xl">
          <h2 className="text-white text-2xl font-bold">Virtual Session</h2>
          <button onClick={onClose} className="text-white text-3xl font-bold">&times;</button>
        </div>
        <div className="px-8 py-8">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className="flex gap-8 mb-8">
            <div className="flex-1 text-center">
              <div ref={localVideoRef} className="w-full h-56 rounded-xl border bg-emerald-50" />
              <div className="text-sm mt-2 text-emerald-700">You</div>
            </div>
            <div className="flex-1 text-center">
              <div ref={remoteVideoRef} className="w-full h-56 rounded-xl border bg-cyan-50" />
              <div className="text-sm mt-2 text-cyan-700">Patient</div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input value={meetingLink} readOnly className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <button onClick={handleCopyLink} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
