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
  const isPresenting = false;
  const { invalidate } = useThree();

  const userPosition = useMemo(() => {
    if (!userGPSPosition) return [0, 0, 0];
    return gpsToPosition(userGPSPosition.latitude, userGPSPosition.longitude);
  }, [userGPSPosition?.latitude, userGPSPosition?.longitude]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAreas((prevAreas) =>
        prevAreas.map((area) => {
          const newVisitors = Math.max(
            0,
            Math.min(
              Math.floor(area.capacity * 1.3),
              area.visitors + Math.floor((Math.random() - 0.5) * 5)
            )
          );
          return {
            ...area,
            visitors: newVisitors,
            congestionLevel: newVisitors / area.capacity,
          };
        })
      );
      invalidate();
    }, 10000);

    return () => clearInterval(interval);
  }, [invalidate]);

  useEffect(() => {
    invalidate();
  }, [userPosition, invalidate]);

  return (
    <>
      <FirstPersonCamera
        userPosition={userPosition}
        isActive={firstPersonMode}
      />

      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      <hemisphereLight intensity={0.5} groundColor="#444444" />

      {!isPresenting && (
        <>
          <Environment preset="park" />
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

      {!isPresenting && (
        <gridHelper
          args={[200, 100, "#888888", "#cccccc"]}
          position={[0, 0, 0]}
        />
      )}

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

      {areas.map((area) => (
        <ZooArea
          key={area.id}
          area={area}
          onClick={onAreaSelect}
          isSelected={selectedDestination === area.id}
        />
      ))}

      {currentPath && <PathGuide path={currentPath} />}

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
