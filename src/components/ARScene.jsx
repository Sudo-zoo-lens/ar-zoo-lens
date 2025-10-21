import { useState, useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Text } from "@react-three/drei";
import ZooArea from "./ZooArea";
import PathGuide from "./PathGuide";
import FirstPersonCamera from "./FirstPersonCamera";
import { zooAreas, gpsToPosition } from "../data/mockData";

function ARScene({
  selectedDestination,
  onAreaSelect,
  currentPath,
  firstPersonMode = false,
  userPosition: userGPSPosition,
}) {
  const [areas, setAreas] = useState(zooAreas);
  const isPresenting = false; // AR 기능은 나중에 추가
  const { invalidate } = useThree();

  // GPS 좌표를 3D 좌표로 변환 (메모이제이션)
  const userPosition = useMemo(() => {
    if (!userGPSPosition) return [0, 0, 0];
    return gpsToPosition(userGPSPosition.latitude, userGPSPosition.longitude);
  }, [userGPSPosition?.latitude, userGPSPosition?.longitude]);

  // 실시간 혼잡도 업데이트 시뮬레이션 (10초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setAreas((prevAreas) =>
        prevAreas.map((area) => ({
          ...area,
          congestionLevel: Math.max(
            0,
            Math.min(1, area.congestionLevel + (Math.random() - 0.5) * 0.1)
          ),
          visitors: Math.max(
            0,
            Math.min(
              area.capacity,
              area.visitors + Math.floor((Math.random() - 0.5) * 5)
            )
          ),
        }))
      );
      invalidate(); // 변경 시 재렌더링 트리거
    }, 10000);

    return () => clearInterval(interval);
  }, [invalidate]);

  // 위치가 변경되면 재렌더링 트리거
  useEffect(() => {
    invalidate();
  }, [userPosition, invalidate]);

  return (
    <>
      {/* 1인칭 카메라 모드 */}
      <FirstPersonCamera
        userPosition={userPosition}
        isActive={firstPersonMode}
      />

      {/* 조명 설정 */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      <hemisphereLight intensity={0.5} groundColor="#444444" />

      {/* 환경 설정 (AR이 아닐 때) */}
      {!isPresenting && (
        <>
          <Environment preset="park" />
          {/* OrbitControls는 1인칭 모드가 아닐 때만 활성화 */}
          {!firstPersonMode && (
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={20}
              maxDistance={100}
              target={[0, 0, 0]}
              makeDefault
              onChange={invalidate}
            />
          )}
        </>
      )}

      {/* 바닥 */}
      {!isPresenting && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.1, 0]}
          receiveShadow
        >
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#90C890" />
        </mesh>
      )}

      {/* 그리드 (참고용) */}
      {!isPresenting && (
        <gridHelper
          args={[200, 100, "#888888", "#cccccc"]}
          position={[0, 0, 0]}
        />
      )}

      {/* 타이틀 */}
      <Text
        position={[15, 8, 0]}
        fontSize={1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.1}
        outlineColor="#000000"
        rotation={[0, -Math.PI / 2, 0]}
      >
        🗺️ AR Zoo Lens
      </Text>

      {/* 동물원 구역들 */}
      {areas.map((area) => (
        <ZooArea
          key={area.id}
          area={area}
          onClick={onAreaSelect}
          isSelected={selectedDestination === area.id}
        />
      ))}

      {/* 경로 안내 */}
      {currentPath && <PathGuide path={currentPath} />}

      {/* 현재 위치 표시 */}
      <group position={userPosition}>
        <mesh position={[0, 3, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color="#0066ff"
            emissive="#0066ff"
            emissiveIntensity={1}
          />
        </mesh>
        <Text
          position={[0, 4, 0]}
          fontSize={0.4}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          📍 현재 위치
        </Text>
      </group>
    </>
  );
}

export default ARScene;
