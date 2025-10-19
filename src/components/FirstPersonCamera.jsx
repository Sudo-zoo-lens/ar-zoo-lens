import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FirstPersonCamera({ userPosition = [0, 0, 0], isActive = false }) {
  const { camera } = useThree();
  const originalPosition = useRef(new THREE.Vector3());
  const originalRotation = useRef(new THREE.Euler());
  const hasStoredOriginal = useRef(false);

  useEffect(() => {
    // 최초 카메라 위치 저장
    if (!hasStoredOriginal.current) {
      originalPosition.current.copy(camera.position);
      originalRotation.current.copy(camera.rotation);
      hasStoredOriginal.current = true;
    }

    if (isActive) {
      // 1인칭 뷰 활성화 - 사용자 위치에서 약간 높이 (눈높이)
      camera.position.set(
        userPosition[0],
        userPosition[1] + 1.6, // 사람 눈높이 (약 1.6m)
        userPosition[2]
      );
    } else {
      // 원래 위치로 복원
      camera.position.copy(originalPosition.current);
      camera.rotation.copy(originalRotation.current);
    }
  }, [isActive, userPosition, camera]);

  // 부드러운 카메라 이동
  useFrame(() => {
    if (isActive) {
      const targetY = userPosition[1] + 1.6;
      camera.position.y += (targetY - camera.position.y) * 0.1;
    }
  });

  return null;
}

export default FirstPersonCamera;
