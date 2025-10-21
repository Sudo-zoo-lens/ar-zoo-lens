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

  const congestionColor = getCongestionColor(area.congestionLevel);
  const congestionLabel = getCongestionLabel(area.congestionLevel);
  const categoryColor = area.color || congestionColor; // 카테고리 색상 우선 사용

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
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial
          color={categoryColor}
          transparent
          opacity={hovered || isSelected ? 0.9 : 0.6}
          emissive={categoryColor}
          emissiveIntensity={hovered || isSelected ? 0.5 : 0.2}
        />
      </mesh>

      {/* 혼잡도 표시 기둥 */}
      <mesh position={[0, area.congestionLevel * 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.25, area.congestionLevel * 3, 16]} />
        <meshStandardMaterial
          color={congestionColor}
          transparent
          opacity={0.7}
          emissive={congestionColor}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* 상단 아이콘/이모지 */}
      <Text
        position={[0, area.congestionLevel * 1.5 + 0.8, 0]}
        fontSize={0.8}
        anchorX="center"
        anchorY="middle"
      >
        {area.emoji}
      </Text>

      {/* 구역 이름 */}
      <Text
        position={[0, 0.1, 0]}
        fontSize={0.3}
        color={categoryColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {area.name}
      </Text>

      {/* 혼잡도 정보 */}
      <Text
        position={[0, -0.3, 0]}
        fontSize={0.2}
        color={congestionColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {congestionLabel} ({area.visitors}/{area.capacity})
      </Text>

      {/* 호버 시 상세 정보 */}
      {(hovered || isSelected) && (
        <Html
          position={[0, area.congestionLevel * 1.5 + 1.8, 0]}
          center
          distanceFactor={10}
        >
          <div
            style={{
              background: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "10px 15px",
              borderRadius: "8px",
              fontSize: "14px",
              whiteSpace: "nowrap",
              border: `2px solid ${categoryColor}`,
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
              혼잡도:{" "}
              <span style={{ color: congestionColor }}>{congestionLabel}</span>
            </div>
          </div>
        </Html>
      )}

      {/* 선택 표시 링 */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1.6, 1.9, 32]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      )}
    </group>
  );
}

export default ZooArea;
