import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function PathGuide({ path }) {
  const lineRef = useRef();
  const arrowsRef = useRef([]);

  // 경로 라인 생성
  const lineGeometry = useMemo(() => {
    if (!path || path.areas.length < 2) return null;

    const points = path.areas.map(
      (area) => new THREE.Vector3(area.position[0], 0.1, area.position[2])
    );

    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(50);

    return new THREE.BufferGeometry().setFromPoints(curvePoints);
  }, [path]);

  // 화살표 애니메이션
  useFrame((state) => {
    if (lineRef.current) {
      // 라인이 흐르는 효과
      lineRef.current.material.opacity =
        0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }

    // 화살표 회전 애니메이션
    arrowsRef.current.forEach((arrow, index) => {
      if (arrow) {
        arrow.position.y =
          0.15 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05;
      }
    });
  });

  if (!path || path.areas.length < 2) return null;

  // 화살표 생성 (각 구간마다)
  const arrows = [];
  for (let i = 0; i < path.areas.length - 1; i++) {
    const start = path.areas[i].position;
    const end = path.areas[i + 1].position;

    // 중간 지점
    const midX = (start[0] + end[0]) / 2;
    const midZ = (start[2] + end[2]) / 2;

    // 방향 계산
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
        {/* 화살표 모양 */}
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

        {/* 화살표 꼬리 */}
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
      {/* 경로 라인 */}
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

      {/* 화살표들 */}
      {arrows}

      {/* 시작점 마커 */}
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

      {/* 목적지 마커 */}
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
