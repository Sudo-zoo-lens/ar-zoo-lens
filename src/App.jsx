import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import ARScene from "./components/ARScene";
import MapView from "./components/MapView";
import NavigationUI from "./components/NavigationUI";
import CompactDirectionOverlay from "./components/CompactDirectionOverlay";
import CameraView from "./components/CameraView";
import {
  findOptimalPath,
  currentLocation,
  updateCongestionLevels,
} from "./data/mockData";
import "./App.css";

function App() {
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [currentPath, setCurrentPath] = useState(null);
  const [firstPersonMode, setFirstPersonMode] = useState(false);
  const [userPosition, setUserPosition] = useState(currentLocation);
  const [congestionUpdate, setCongestionUpdate] = useState(0); // 혼잡도 업데이트 트리거

  // Ref를 사용해서 최신 상태 추적
  const firstPersonModeRef = useRef(firstPersonMode);
  const userPositionRef = useRef(userPosition);
  const lastMoveTime = useRef(0);

  // 혼잡도 실시간 업데이트 (2초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      updateCongestionLevels();
      setCongestionUpdate((prev) => prev + 1); // 강제 리렌더링
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    firstPersonModeRef.current = firstPersonMode;
  }, [firstPersonMode]);

  useEffect(() => {
    userPositionRef.current = userPosition;
  }, [userPosition]);

  // 목적지 선택 핸들러 (useCallback으로 메모이제이션)
  const handleDestinationChange = useCallback((areaId) => {
    setSelectedDestination(areaId);

    if (areaId) {
      // 현재 위치(정문)에서 선택한 목적지까지의 경로 계산
      const path = findOptimalPath("main-gate", areaId);
      setCurrentPath(path);
    } else {
      setCurrentPath(null);
    }
  }, []);

  // 구역 선택 핸들러 (3D 씬에서)
  const handleAreaSelect = useCallback(
    (area) => {
      if (area.id === "main-gate") return;
      handleDestinationChange(area.id);
    },
    [handleDestinationChange]
  );

  // 키보드로 위치 이동 (throttle 적용)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // input, textarea 등에서는 동작하지 않도록
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      // 영어 + 한글 키 매핑 (한글: ㅈ=w, ㄴ=s, ㅁ=a, ㄷ=d)
      const validKeys = [
        "w",
        "s",
        "a",
        "d",
        "ㅈ",
        "ㄴ",
        "ㅁ",
        "ㄷ",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
      ];

      if (validKeys.includes(key)) {
        event.preventDefault();
        event.stopPropagation();

        // Throttle: 50ms에 한 번만 업데이트
        const now = Date.now();
        if (now - lastMoveTime.current < 50) {
          return;
        }
        lastMoveTime.current = now;

        const moveDistance = 0.00001; // 약 1미터

        switch (key) {
          case "w":
          case "ㅈ":
          case "arrowup":
            setUserPosition((prev) => ({
              ...prev,
              latitude: prev.latitude + moveDistance,
            }));
            break;
          case "s":
          case "ㄴ":
          case "arrowdown":
            setUserPosition((prev) => ({
              ...prev,
              latitude: prev.latitude - moveDistance,
            }));
            break;
          case "a":
          case "ㅁ":
          case "arrowleft":
            setUserPosition((prev) => ({
              ...prev,
              longitude: prev.longitude - moveDistance,
            }));
            break;
          case "d":
          case "ㄷ":
          case "arrowright":
            setUserPosition((prev) => ({
              ...prev,
              longitude: prev.longitude + moveDistance,
            }));
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  // 모바일 컨트롤 핸들러
  const handleMove = useCallback((direction) => {
    const moveDistance = 0.00001; // 약 1미터

    setUserPosition((prev) => {
      switch (direction) {
        case "up":
          return { ...prev, latitude: prev.latitude + moveDistance };
        case "down":
          return { ...prev, latitude: prev.latitude - moveDistance };
        case "left":
          return { ...prev, longitude: prev.longitude - moveDistance };
        case "right":
          return { ...prev, longitude: prev.longitude + moveDistance };
        default:
          return prev;
      }
    });
  }, []);

  return (
    <div className="app">
      {/* 카메라 뷰 (네비게이션 모드일 때) */}
      {firstPersonMode && (
        <>
          <CameraView
            isActive={firstPersonMode}
            showAR={!currentPath}
            userPosition={userPosition}
            onAreaSelect={handleAreaSelect}
            congestionUpdate={congestionUpdate}
          >
            {/* 카메라 위에 표시될 컴팩트 방향 안내 (경로가 있을 때) */}
            {currentPath && (
              <CompactDirectionOverlay
                currentPath={currentPath}
                userPosition={[0, 0, 0]}
              />
            )}
          </CameraView>

          {/* 카메라 HUD - 포켓몬고 같은 구성 */}
          <div className="camera-top-bar">
            <button
              className="top-back-btn"
              onClick={() => setFirstPersonMode(false)}
            >
              🗺️
            </button>
            <div className="camera-status">AR 탐색</div>
            <div style={{ width: 44 }} />
          </div>

          {/* 중앙 조준선 */}
          <div className="reticle" />

          {/* 하단 캡처 버튼 (연출용) */}
          <button className="camera-capture-btn" onClick={() => {}}></button>
        </>
      )}

      {/* 네비게이션 UI (카메라 모드가 아닐 때만) */}
      {!firstPersonMode && (
        <NavigationUI
          selectedDestination={selectedDestination}
          onDestinationChange={handleDestinationChange}
          currentPath={currentPath}
          firstPersonMode={firstPersonMode}
          onModeChange={setFirstPersonMode}
          congestionUpdate={congestionUpdate}
        />
      )}

      {/* 지도 뷰 (카메라 모드가 아닐 때만 보임) */}
      {!firstPersonMode && (
        <MapView
          selectedDestination={selectedDestination}
          onAreaSelect={handleAreaSelect}
          currentPath={currentPath}
          userPosition={userPosition}
          onDestinationChange={handleDestinationChange}
          congestionUpdate={congestionUpdate}
        />
      )}

      {/* 지도 모드 하단 중앙 카메라 진입 버튼 */}
      {!firstPersonMode && (
        <button
          className="enter-camera-btn"
          onClick={() => setFirstPersonMode(true)}
        >
          📷 카메라
        </button>
      )}
    </div>
  );
}

export default App;
