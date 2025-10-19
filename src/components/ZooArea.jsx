import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import { getCongestionColor, getCongestionLabel } from "../data/mockData";

function ZooArea({ area, onClick, isSelected }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  // 부드러운 펄스 애니메이션
  useFrame((state) => {
    if (groupRef.current && isSelected) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      groupRef.current.scale.set(scale, 1, scale);
    } else if (groupRef.current) {
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  const color = getCongestionColor(area.congestionLevel);
  const label = getCongestionLabel(area.congestionLevel);

  return (
    <group
      ref={groupRef}
      position={area.position}
      onClick={() => onClick(area)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* 바닥 원형 마커 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={hovered || isSelected ? 0.9 : 0.6}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.5 : 0.2}
        />
      </mesh>

      {/* 혼잡도 표시 기둥 */}
      <mesh position={[0, area.congestionLevel * 2, 0]}>
        <cylinderGeometry args={[0.3, 0.5, area.congestionLevel * 4, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.7}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* 상단 아이콘/이모지 */}
      <Text
        position={[0, area.congestionLevel * 2 + 0.8, 0]}
        fontSize={0.5}
        anchorX="center"
        anchorY="middle"
      >
        {area.emoji}
      </Text>

      {/* 구역 이름 */}
      <Text
        position={[0, 0.1, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {area.name}
      </Text>

      {/* 혼잡도 정보 */}
      <Text
        position={[0, -0.2, 0]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {label} ({area.visitors}/{area.capacity})
      </Text>

      {/* 호버 시 상세 정보 */}
      {(hovered || isSelected) && (
        <Html
          position={[0, area.congestionLevel * 2 + 1.5, 0]}
          center
          distanceFactor={5}
        >
          <div
            style={{
              background: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "10px 15px",
              borderRadius: "8px",
              fontSize: "14px",
              whiteSpace: "nowrap",
              border: `2px solid ${color}`,
              pointerEvents: "none",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
              {area.emoji} {area.name}
            </div>
            <div style={{ fontSize: "12px", color: "#ccc" }}>
              {area.description}
            </div>
            <div style={{ fontSize: "12px", marginTop: "5px" }}>
              혼잡도: <span style={{ color }}>{label}</span>
            </div>
          </div>
        </Html>
      )}

      {/* 선택 표시 링 */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      )}
    </group>
  );
}

export default ZooArea;
