import { useEffect, useRef, useState } from "react";
import AROverlay from "./AROverlay";
import "./CameraView.css";

function CameraView({
  isActive,
  children,
  showAR = false,
  userPosition,
  onAreaSelect,
  congestionUpdate,
  categoryFilter,
}) {
  const videoRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setHasCamera(true);
          setError(null);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError(err.message);
        setHasCamera(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="camera-view">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-video"
      />

      {error && (
        <div className="camera-error">
          <div className="error-icon">📷</div>
          <div className="error-message">
            카메라에 접근할 수 없습니다
            <br />
            <small>{error}</small>
          </div>
          <div className="error-hint">
            브라우저 설정에서 카메라 권한을 허용해주세요
          </div>
        </div>
      )}

      {hasCamera && showAR && (
        <AROverlay
          userPosition={userPosition}
          onAreaSelect={onAreaSelect}
          congestionUpdate={congestionUpdate}
          categoryFilter={categoryFilter}
        />
      )}

      {hasCamera && !showAR && <div className="ar-overlay">{children}</div>}

      {hasCamera && children && (
        <div className="camera-controls">{children}</div>
      )}
    </div>
  );
}

export default CameraView;
