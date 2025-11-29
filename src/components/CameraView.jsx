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
  videoRef: externalVideoRef,
}) {
  const internalVideoRef = useRef(null);
  const videoRef = externalVideoRef || internalVideoRef;
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
        // HTTPS 환경 확인
        if (
          window.location.protocol !== "https:" &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1"
        ) {
          throw new Error("카메라 접근을 위해 HTTPS 연결이 필요합니다.");
        }

        // mediaDevices API 사용 가능 여부 확인
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("이 브라우저는 카메라 접근을 지원하지 않습니다.");
        }

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

        // 사용자 친화적인 에러 메시지
        let errorMessage = "카메라에 접근할 수 없습니다.";

        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          errorMessage =
            "카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.";
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          errorMessage =
            "카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.";
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          errorMessage =
            "카메라에 접근할 수 없습니다. 다른 앱에서 카메라를 사용 중일 수 있습니다.";
        } else if (
          err.name === "OverconstrainedError" ||
          err.name === "ConstraintNotSatisfiedError"
        ) {
          errorMessage =
            "카메라 설정을 만족할 수 없습니다. 다른 카메라 설정을 시도합니다.";
          // Fallback: 더 낮은 해상도로 재시도
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: "environment",
              },
              audio: false,
            });
            if (videoRef.current) {
              videoRef.current.srcObject = fallbackStream;
              streamRef.current = fallbackStream;
              setHasCamera(true);
              setError(null);
              return;
            }
          } catch (fallbackErr) {
            console.error("Fallback camera error:", fallbackErr);
            errorMessage = err.message || "카메라에 접근할 수 없습니다.";
          }
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
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
