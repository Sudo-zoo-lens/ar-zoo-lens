import { useState, useEffect } from "react";
import { OrbitControls, Environment, Text } from "@react-three/drei";
import ZooArea from "./ZooArea";
import PathGuide from "./PathGuide";
import FirstPersonCamera from "./FirstPersonCamera";
import { zooAreas } from "../data/mockData";

function ARScene({
  selectedDestination,
  onAreaSelect,
  currentPath,
  firstPersonMode = false,
}) {
  const [areas, setAreas] = useState(zooAreas);
  const [userLocation, setUserLocation] = useState("entrance");
  const isPresenting = false; // AR 기능은 나중에 추가

  // 사용자 현재 위치 (입구)
  const userPosition = areas.find((a) => a.id === userLocation)?.position || [
    0, 0, 0,
  ];

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
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
              minDistance={5}
              maxDistance={30}
              target={[0, 0, -8]}
            />
          )}
        </>
      )}

      {/* 바닥 */}
      {!isPresenting && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.1, -8]}
          receiveShadow
        >
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#90C890" />
        </mesh>
      )}

      {/* 그리드 (참고용) */}
      {!isPresenting && (
        <gridHelper
          args={[30, 30, "#888888", "#cccccc"]}
          position={[0, 0, -8]}
        />
      )}

      {/* 타이틀 */}
      <Text
        position={[0, 3, -8]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
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
      {userLocation && (
        <group
          position={
            areas.find((a) => a.id === userLocation)?.position || [0, 0, 0]
          }
        >
          <mesh position={[0, 2, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial
              color="#0066ff"
              emissive="#0066ff"
              emissiveIntensity={1}
            />
          </mesh>
          <Text
            position={[0, 2.5, 0]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            📍 현재 위치
          </Text>
        </group>
      )}
    </>
  );
}

export default ARScene;
