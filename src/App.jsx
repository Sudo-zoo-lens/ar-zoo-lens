import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import ARScene from "./components/ARScene";
import NavigationUI from "./components/NavigationUI";
import CompactDirectionOverlay from "./components/CompactDirectionOverlay";
import CameraView from "./components/CameraView";
import { findOptimalPath } from "./data/mockData";
import "./App.css";

function App() {
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [currentPath, setCurrentPath] = useState(null);
  const [firstPersonMode, setFirstPersonMode] = useState(false);

  // 목적지 선택 핸들러
  const handleDestinationChange = (areaId) => {
    setSelectedDestination(areaId);

    if (areaId) {
      // 현재 위치(입구)에서 선택한 목적지까지의 경로 계산
      const path = findOptimalPath("entrance", areaId);
      setCurrentPath(path);
    } else {
      setCurrentPath(null);
    }
  };

  // 구역 선택 핸들러 (3D 씬에서)
  const handleAreaSelect = (area) => {
    if (area.id === "entrance") return;
    handleDestinationChange(area.id);
  };

  return (
    <div className="app">
      {/* 카메라 뷰 (네비게이션 모드일 때) */}
      <CameraView isActive={firstPersonMode && currentPath}>
        {/* 카메라 위에 표시될 컴팩트 방향 안내 */}
        {currentPath && (
          <CompactDirectionOverlay
            currentPath={currentPath}
            userPosition={[0, 0, 0]}
          />
        )}
      </CameraView>

      {/* 네비게이션 UI (카메라 모드가 아닐 때만) */}
      {!firstPersonMode && (
        <NavigationUI
          selectedDestination={selectedDestination}
          onDestinationChange={handleDestinationChange}
          currentPath={currentPath}
        />
      )}

      {/* 뷰 모드 토글 버튼 */}
      {currentPath && (
        <button
          className="view-mode-toggle"
          onClick={() => setFirstPersonMode(!firstPersonMode)}
        >
          {firstPersonMode ? "🗺️ 지도 보기" : "📷 카메라 모드"}
        </button>
      )}

      {/* 3D Canvas (카메라 모드가 아닐 때만 보임) */}
      {!firstPersonMode && (
        <Canvas camera={{ position: [0, 8, 5], fov: 60 }} shadows>
          <ARScene
            selectedDestination={selectedDestination}
            onAreaSelect={handleAreaSelect}
            currentPath={currentPath}
            firstPersonMode={firstPersonMode}
          />
        </Canvas>
      )}
    </div>
  );
}

export default App;
