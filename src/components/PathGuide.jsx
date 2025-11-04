import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function PathGuide({ path }) {
  const lineRef = useRef();
  const arrowsRef = useRef([]);

  const lineGeometry = useMemo(() => {
    if (!path || path.areas.length < 2) return null;

    const points = path.areas.map(
      (area) => new THREE.Vector3(area.position[0], 0.1, area.position[2])
    );

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [path]);

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.material.opacity =
        0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }

    arrowsRef.current.forEach((arrow, index) => {
      if (arrow) {
        arrow.position.y =
          0.15 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05;
      }
    });
  });

  if (!path || path.areas.length < 2) return null;

  const arrows = [];
  for (let i = 0; i < path.areas.length - 1; i++) {
    const start = path.areas[i].position;
    const end = path.areas[i + 1].position;

    const midX = (start[0] + end[0]) / 2;
    const midZ = (start[2] + end[2]) / 2;

    const direction = new THREE.Vector3(
      end[0] - start[0],
      0,
      end[2] - start[2]
    ).normalize();

    const angle = Math.atan2(direction.x, direction.z);

    arrows.push(
      <group
        key={i}
        position={[midX, 0.15, midZ]}
        rotation={[0, angle, 0]}
        ref={(el) => (arrowsRef.current[i] = el)}
      >
        <mesh position={[0, 0, 0]}>
          <coneGeometry args={[0.1, 0.25, 8]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>

        <mesh position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.2, 8]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.3}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {lineGeometry && (
        <line ref={lineRef} geometry={lineGeometry}>
          <lineBasicMaterial
            color="#00ffff"
            linewidth={3}
            transparent
            opacity={0.7}
          />
        </line>
      )}

      {arrows}

      {/* 시작점 (초록색) */}
      <mesh
        position={[path.areas[0].position[0], 0.15, path.areas[0].position[2]]}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* 중간 웨이포인트 마커 (하늘색) */}
      {path.areas.slice(1, -1).map((area, index) => (
        <mesh
          key={`waypoint-${index}`}
          position={[area.position[0], 0.12, area.position[2]]}
        >
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.4}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* 최종 목적지 (빨간색) */}
      <mesh
        position={[
          path.areas[path.areas.length - 1].position[0],
          0.25,
          path.areas[path.areas.length - 1].position[2],
        ]}
      >
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

export default PathGuide;
