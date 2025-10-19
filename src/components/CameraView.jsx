import { useEffect, useRef, useState } from "react";
import "./CameraView.css";

function CameraView({ isActive, children }) {
  const videoRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      // 카메라 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    // 카메라 시작
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // 후면 카메라 (환경 카메라)
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
      // 클린업
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="camera-view">
      {/* 카메라 비디오 스트림 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-video"
      />

      {/* 에러 메시지 */}
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

      {/* AR 오버레이 (화살표 등) */}
      {hasCamera && <div className="ar-overlay">{children}</div>}
    </div>
  );
}

export default CameraView;
