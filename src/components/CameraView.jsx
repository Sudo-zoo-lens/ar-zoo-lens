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
        try {
          streamRef.current.getTracks().forEach((track) => track.stop());
        } catch (e) {
          console.warn("Stream cleanup error:", e);
        }
        streamRef.current = null;
      }
      return;
    }

    const startCamera = async () => {
      try {
        // HTTPS 환경 확인 (안드로이드 크롬에서도 작동하도록)
        const isSecure =
          window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.endsWith(".vercel.app") ||
          window.location.hostname.endsWith(".netlify.app");

        if (!isSecure) {
          setError("카메라 접근을 위해 HTTPS 연결이 필요합니다.");
          setHasCamera(false);
          return;
        }

        // mediaDevices API 사용 가능 여부 확인
        if (!navigator.mediaDevices) {
          setError("이 브라우저는 카메라 접근을 지원하지 않습니다.");
          setHasCamera(false);
          return;
        }

        if (!navigator.mediaDevices.getUserMedia) {
          // 구형 브라우저 지원 (getUserMedia가 navigator에 직접 있는 경우)
          const getUserMedia =
            navigator.mediaDevices.getUserMedia ||
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;

          if (!getUserMedia) {
            setError("이 브라우저는 카메라 접근을 지원하지 않습니다.");
            setHasCamera(false);
            return;
          }
        }

        // 모바일 기기 감지
        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          );
        const isLowEndDevice =
          navigator.hardwareConcurrency <= 4 ||
          (navigator.deviceMemory && navigator.deviceMemory <= 4);

        // 카메라 최적화: 모바일/저사양 기기에서 더 낮은 해상도 사용
        const constraints = {
          video: {
            facingMode: "environment",
            width:
              isMobile || isLowEndDevice
                ? { ideal: 320, max: 480 } // 모바일: 더 낮은 해상도
                : { ideal: 480, max: 640 }, // 데스크톱: 기존 해상도
            height:
              isMobile || isLowEndDevice
                ? { ideal: 240, max: 360 } // 모바일: 더 낮은 해상도
                : { ideal: 360, max: 480 }, // 데스크톱: 기존 해상도
            frameRate:
              isMobile || isLowEndDevice
                ? { ideal: 10, max: 15 } // 모바일: 더 낮은 프레임레이트
                : { ideal: 15, max: 20 }, // 데스크톱: 기존 프레임레이트
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          try {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setHasCamera(true);
            setError(null);
          } catch (streamError) {
            console.error("Stream assignment error:", streamError);
            // 스트림 할당 실패 시 정리
            stream.getTracks().forEach((track) => track.stop());
            throw streamError;
          }
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
            errorMessage =
              "카메라 설정을 만족할 수 없습니다. 기본 설정으로 시도해주세요.";
          }
        } else if (err.message) {
          errorMessage = err.message;
        }

        // 에러가 발생해도 페이지가 크래시되지 않도록 처리
        setError(errorMessage);
        setHasCamera(false);
      }
    };

    // 에러가 발생해도 크래시되지 않도록 처리
    startCamera().catch((e) => {
      console.error("Failed to start camera:", e);
      setError("카메라를 시작할 수 없습니다.");
      setHasCamera(false);
    });

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

      {/* 카메라가 없어도 children은 렌더링 (GLB 모델 등) */}
      {showAR && hasCamera && (
        <AROverlay
          userPosition={userPosition}
          onAreaSelect={onAreaSelect}
          congestionUpdate={congestionUpdate}
          categoryFilter={categoryFilter}
        />
      )}

      {/* 카메라가 없어도 3D 모델은 표시 가능 */}
      {!showAR && <div className="ar-overlay">{children}</div>}

      {children && <div className="camera-controls">{children}</div>}
    </div>
  );
}

export default CameraView;
