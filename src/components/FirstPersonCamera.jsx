import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FirstPersonCamera({ userPosition = [0, 0, 0], isActive = false }) {
  const { camera } = useThree();
  const originalPosition = useRef(new THREE.Vector3());
  const originalRotation = useRef(new THREE.Euler());
  const hasStoredOriginal = useRef(false);

  useEffect(() => {
    if (!hasStoredOriginal.current) {
      originalPosition.current.copy(camera.position);
      originalRotation.current.copy(camera.rotation);
      hasStoredOriginal.current = true;
    }

    if (isActive) {
      camera.position.set(
        userPosition[0],
        userPosition[1] + 1.6,
        userPosition[2]
      );
    } else {
      camera.position.copy(originalPosition.current);
      camera.rotation.copy(originalRotation.current);
    }
  }, [isActive, userPosition, camera]);

  useFrame(() => {
    if (isActive) {
      const targetY = userPosition[1] + 1.6;
      camera.position.y += (targetY - camera.position.y) * 0.1;
    }
  });

  return null;
}

export default FirstPersonCamera;
