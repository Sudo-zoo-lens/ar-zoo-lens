import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  zooAreas,
  calculateDistance,
  calculateBearing,
} from "../data/mockData";
import "./AR3DModels.css";

function AR3DModels({ userPosition, characterPosition, onRendererReady }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelsRef = useRef({});
  const animationFrameRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let scene;
    try {
      // Scene 설정
      scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera 설정 (AR용 원근 카메라)
      // far plane을 150m로 제한하여 성능 향상
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        150 // 1000m -> 150m로 줄여서 성능 향상
      );
      camera.position.set(0, 1.6, 0); // 사용자 눈 높이
      cameraRef.current = camera;

      // 모바일 기기 감지
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const isLowEndDevice =
        navigator.hardwareConcurrency <= 4 ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4);

      // Renderer 설정 (성능 최적화)
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false, // 성능 향상을 위해 끄기
        powerPreference: isMobile ? "default" : "high-performance", // 모바일에서는 기본 모드
        preserveDrawingBuffer: true, // 사진 촬영을 위해 버퍼 보존
        failIfMajorPerformanceCaveat: false, // 성능이 낮아도 계속 진행
      });
      // 화면 크기 설정 (모바일에서는 더 작게 제한)
      const renderWidth =
        isMobile || isLowEndDevice
          ? Math.min(window.innerWidth, 640)
          : window.innerWidth;
      const renderHeight =
        isMobile || isLowEndDevice
          ? Math.min(window.innerHeight, 480)
          : window.innerHeight;
      renderer.setSize(renderWidth, renderHeight);
      // pixelRatio 제한하여 성능 향상 (모바일에서는 더 낮게)
      const maxPixelRatio = isMobile || isLowEndDevice ? 1 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
      renderer.shadowMap.enabled = false; // 그림자 비활성화로 성능 향상
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // WebGL 컨텍스트 손실/복구 이벤트 처리
      const canvas = renderer.domElement;
      canvas.addEventListener("webglcontextlost", (event) => {
        console.warn(
          "[AR3DModels] WebGL 컨텍스트 손실됨 - 카메라는 계속 작동합니다"
        );
        event.preventDefault(); // 컨텍스트 복구 허용

        // 애니메이션 루프 중단
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // 모든 모델 숨기기
        Object.keys(modelsRef.current).forEach((key) => {
          const modelData = modelsRef.current[key];
          if (modelData && modelData.model) {
            modelData.model.visible = false;
          }
        });
      });

      canvas.addEventListener("webglcontextrestored", () => {
        console.log("[AR3DModels] WebGL 컨텍스트 복구됨 - 렌더링 재개");
        // 컨텍스트 복구 후 애니메이션 루프 재시작
        if (animationFrameRef.current === null) {
          animate();
        }
      });

      // renderer 준비 완료 알림 (scene과 camera 정보도 함께 전달)
      if (onRendererReady) {
        onRendererReady(renderer, scene, camera);
      }
    } catch (err) {
      console.error("AR3DModels 초기화 오류:", err);
      setError("3D 모델을 초기화하는 중 오류가 발생했습니다.");
      return;
    }

    // scene이 없으면 조기 종료
    if (!scene || !sceneRef.current) {
      console.error("[AR3DModels] Scene이 초기화되지 않았습니다.");
      return;
    }

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // GLTF 로더
    const loader = new GLTFLoader();

    // 정문 위치 가져오기
    const mainGate = zooAreas.find((area) => area.id === "main-gate");
    if (!mainGate) return;

    // 시설 모델 로드 및 배치
    // public 폴더의 파일은 빌드 시 루트에 복사되므로 /image/3d/ 경로 사용
    const getModelPath = (filename) => {
      // public 폴더 기준 절대 경로 사용 (개발/배포 환경 모두 동일)
      const path = `/image/3d/${filename}`;
      return path;
    };

    // 건물은 지도에만 표시, AR 카메라에는 표시하지 않음
    // 시설 모델은 FirstPersonMapView에서만 로드

    // 동물 모델 로드 및 배치 (정문 근처)
    const animalOffsets = [
      {
        name: "camel",
        offsetLng: 0.00567590470046,
        offsetLat: -0.000311138782496,
        scale: 3.5,
      },
      {
        name: "dolphin",
        offsetLng: 0.0021115776083,
        offsetLat: 0.00001113088987,
        scale: 3.5,
      },
      {
        name: "green-dinosaur",
        offsetLng: 0.00338825234588,
        offsetLat: -0.00015644021445,
        scale: 3.5,
      },
      {
        name: "meerkat",
        offsetLng: 0.00676177629825,
        offsetLat: -0.00076464766094,
        scale: 3.5,
      },
      {
        name: "orange-dinosaur",
        offsetLng: 0.00348825234588,
        offsetLat: -0.00015644021445,
        scale: 3.5,
      },
      {
        name: "sloth",
        latitude: 37.549294535965856,
        longitude: 127.07717505068533,
        useAbsolutePosition: true,
        scale: 3.5,
      },
      { name: "nubie", offsetLng: 0, offsetLat: -0.00015, scale: 3.5 },
    ];

    animalOffsets.forEach((animal) => {
      loader.load(
        getModelPath(`${animal.name}.glb`),
        (gltf) => {
          try {
            const model = gltf.scene.clone();
            const targetScale = animal.scale || 3.5; // 기본값 3.5

            // 모델의 원본 크기 확인
            const originalBox = new THREE.Box3().setFromObject(model);
            const originalSize = originalBox.getSize(new THREE.Vector3());
            const maxOriginalSize = Math.max(
              originalSize.x,
              originalSize.y,
              originalSize.z
            );

            // 모든 자식 객체의 scale을 1로 리셋
            model.traverse((child) => {
              if (child.isMesh || child.isGroup || child.isObject3D) {
                child.scale.set(1, 1, 1);
              }
            });
            model.scale.set(1, 1, 1);

            // geometry를 직접 스케일링
            model.traverse((child) => {
              if (child.isMesh && child.geometry) {
                // geometry를 복사해서 원본을 보존
                if (!child.geometry.userData.original) {
                  child.geometry.userData.original = true;
                  // geometry의 모든 버텍스를 스케일링
                  const positions = child.geometry.attributes.position;
                  if (positions) {
                    for (let i = 0; i < positions.count; i++) {
                      positions.setX(i, positions.getX(i) * targetScale);
                      positions.setY(i, positions.getY(i) * targetScale);
                      positions.setZ(i, positions.getZ(i) * targetScale);
                    }
                    positions.needsUpdate = true;
                    child.geometry.computeBoundingBox();
                    child.geometry.computeBoundingSphere();
                  }
                }
              }
            });

            // 최종 크기 확인
            const finalBox = new THREE.Box3().setFromObject(model);
            const finalSize = finalBox.getSize(new THREE.Vector3());
            const maxFinalSize = Math.max(
              finalSize.x,
              finalSize.y,
              finalSize.z
            );

            model.visible = false;
            // 모델을 scene에 추가 (중복 추가 방지)
            if (sceneRef.current) {
              try {
                // 이미 scene에 있으면 제거 후 다시 추가
                if (sceneRef.current.children.includes(model)) {
                  sceneRef.current.remove(model);
                }
                sceneRef.current.add(model);
              } catch (e) {
                console.warn(
                  `모델 ${animal.name}를 scene에 추가하는 중 오류:`,
                  e
                );
              }
            }

            // 절대 좌표 사용 여부 확인
            const modelLatitude =
              animal.useAbsolutePosition && animal.latitude !== undefined
                ? animal.latitude
                : mainGate.latitude + (animal.offsetLat || 0);
            const modelLongitude =
              animal.useAbsolutePosition && animal.longitude !== undefined
                ? animal.longitude
                : mainGate.longitude + (animal.offsetLng || 0);

            modelsRef.current[animal.name] = {
              model,
              area: {
                latitude: modelLatitude,
                longitude: modelLongitude,
              },
              type: "animal",
              scale: targetScale, // scale 정보도 저장
              isLoaded: true, // 로드 완료 플래그
            };
          } catch (err) {
            console.error(`동물 모델 처리 오류 (${animal.name}):`, err);
          }
        },
        (progress) => {
          // 로딩 진행 상황 (선택사항)
        },
        (error) => {
          const modelPath = getModelPath(`${animal.name}.glb`);
          console.error(
            `[AR3DModels] 동물 모델 로딩 오류 (${animal.name}):`,
            error
          );
          console.error(`[AR3DModels] 시도한 경로: ${modelPath}`);
          console.error(`[AR3DModels] 에러 상세:`, {
            message: error?.message,
            stack: error?.stack,
            type: error?.type,
          });
          // 에러가 발생해도 앱이 크래시되지 않도록 계속 진행
          setError((prev) =>
            prev
              ? `${prev}\n${animal.name} 로딩 실패`
              : `${animal.name} 로딩 실패`
          );
        }
      );
    });

    // GPS 좌표를 3D 위치로 변환하는 함수
    const gpsTo3D = (lat, lng, userLat, userLng) => {
      const METERS_PER_DEGREE_LAT = 111320;
      const METERS_PER_DEGREE_LNG = 88740;

      const dx = (lng - userLng) * METERS_PER_DEGREE_LNG;
      const dz = -(lat - userLat) * METERS_PER_DEGREE_LAT;

      // AR에서는 미터 단위로 직접 사용
      return new THREE.Vector3(dx, 0, dz);
    };

    // 모바일 기기 감지
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const isLowEndDevice =
      navigator.hardwareConcurrency <= 4 ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4);

    // 거리 계산 및 모델 업데이트를 위한 throttle (성능 최적화)
    let lastUpdateTime = 0;
    // 모바일에서는 더 긴 간격으로 업데이트
    const UPDATE_INTERVAL = isMobile || isLowEndDevice ? 500 : 200; // 모바일: 500ms, 데스크톱: 200ms
    let cachedVisibleModels = [];
    let visibleModelKeys = new Set(); // 현재 표시 중인 모델 키 추적

    // 애니메이션 루프
    const animate = () => {
      try {
        animationFrameRef.current = requestAnimationFrame(animate);

        if (!cameraRef.current || !sceneRef.current || !rendererRef.current)
          return;

        const currentPos = characterPosition || userPosition;
        if (!currentPos || !currentPos.latitude || !currentPos.longitude)
          return;

        const now = Date.now();
        const shouldUpdate = now - lastUpdateTime >= UPDATE_INTERVAL;

        // 거리 계산은 throttle하여 성능 향상
        if (shouldUpdate) {
          lastUpdateTime = now;

          // 로드된 모델만 거리 계산 (성능 최적화)
          const modelsWithDistance = Object.keys(modelsRef.current)
            .map((key) => {
              const modelData = modelsRef.current[key];
              // 모델이 로드되지 않았으면 제외
              if (!modelData || !modelData.model) {
                return null;
              }

              // 모델이 scene에 없으면 추가 (안전장치)
              if (
                sceneRef.current &&
                !sceneRef.current.children.includes(modelData.model)
              ) {
                try {
                  sceneRef.current.add(modelData.model);
                } catch (e) {
                  console.warn(`모델 ${key}를 scene에 추가하는 중 오류:`, e);
                  return null;
                }
              }

              const distance = calculateDistance(
                currentPos.latitude,
                currentPos.longitude,
                modelData.area.latitude,
                modelData.area.longitude
              );

              return {
                key,
                modelData,
                distance,
              };
            })
            .filter((item) => item !== null) // null 제거
            .sort((a, b) => a.distance - b.distance); // 거리순 정렬

          // 모바일에서는 1개만, 데스크톱에서는 2개 표시
          const maxModels = isMobile || isLowEndDevice ? 1 : 2;
          // 가장 가까운 모델만 100m 이내에서 표시
          const newVisibleModels = modelsWithDistance
            .filter((item) => item.distance < 100) // 100m 이내만
            .slice(0, maxModels); // 모바일: 1개, 데스크톱: 2개

          // 새로 표시할 모델 키
          const newVisibleKeys = new Set(
            newVisibleModels.map((item) => item.key)
          );

          // 이전에 표시되던 모델 중 더 이상 표시하지 않을 모델 숨김
          visibleModelKeys.forEach((key) => {
            if (!newVisibleKeys.has(key)) {
              const modelData = modelsRef.current[key];
              if (modelData && modelData.model) {
                modelData.model.visible = false;
              }
            }
          });

          // 새로 표시할 모델만 업데이트
          newVisibleModels.forEach(({ key, modelData, distance }) => {
            // 모델이 scene에 없으면 다시 추가 (안전장치)
            if (
              sceneRef.current &&
              !sceneRef.current.children.includes(modelData.model)
            ) {
              try {
                sceneRef.current.add(modelData.model);
              } catch (e) {
                console.warn(`모델 ${key}를 scene에 다시 추가하는 중 오류:`, e);
              }
            }

            const position = gpsTo3D(
              modelData.area.latitude,
              modelData.area.longitude,
              currentPos.latitude,
              currentPos.longitude
            );

            modelData.model.position.copy(position);
            modelData.model.visible = true;

            // 카메라를 향하도록 회전 (선택사항)
            if (modelData.type === "animal") {
              modelData.model.lookAt(cameraRef.current.position);
            }
          });

          // 캐시 업데이트
          cachedVisibleModels = newVisibleModels;
          visibleModelKeys = newVisibleKeys;
        } else {
          // 업데이트 간격이 아니면 캐시된 모델만 위치 업데이트
          if (cachedVisibleModels.length > 0) {
            cachedVisibleModels.forEach(({ modelData }) => {
              if (modelData && modelData.model) {
                // 모델이 scene에 없으면 다시 추가
                if (
                  sceneRef.current &&
                  !sceneRef.current.children.includes(modelData.model)
                ) {
                  try {
                    sceneRef.current.add(modelData.model);
                  } catch (e) {
                    console.warn("모델을 scene에 다시 추가하는 중 오류:", e);
                  }
                }

                // visible 상태 확인 및 위치 업데이트
                if (modelData.model.visible) {
                  const position = gpsTo3D(
                    modelData.area.latitude,
                    modelData.area.longitude,
                    currentPos.latitude,
                    currentPos.longitude
                  );
                  modelData.model.position.copy(position);
                }
              }
            });
          }
        }

        // WebGL 컨텍스트 상태 확인
        const gl = rendererRef.current.getContext();
        if (gl && gl.isContextLost && gl.isContextLost()) {
          console.warn("[AR3DModels] WebGL 컨텍스트 손실됨, 렌더링 중단");
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          return;
        }

        // 표시할 모델이 없으면 렌더링 최소화
        if (cachedVisibleModels.length === 0) {
          // 모델이 없어도 빈 화면을 렌더링 (카메라가 계속 작동하도록)
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        } else {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      } catch (err) {
        console.error("[AR3DModels] 애니메이션 루프 오류:", err);
        // WebGL 컨텍스트 손실 감지
        if (err.message && err.message.includes("context")) {
          console.warn(
            "[AR3DModels] WebGL 컨텍스트 관련 오류, 애니메이션 중단"
          );
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          return;
        }
        // 다른 에러는 계속 실행 (카메라는 유지)
      }
    };

    animate();

    // 리사이즈 핸들러
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [userPosition, characterPosition, onRendererReady]);

  // 위치가 변경될 때마다 모델 위치 업데이트
  useEffect(() => {
    // 위치 업데이트는 애니메이션 루프에서 처리됨
  }, [userPosition, characterPosition]);

  // 에러가 있어도 컨테이너는 렌더링 (일부 모델이 실패해도 다른 모델은 표시 가능)
  return (
    <>
      {error && (
        <div
          className="ar-3d-models-error"
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(255, 0, 0, 0.8)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            fontSize: "12px",
            zIndex: 1000,
            maxWidth: "300px",
          }}
        >
          <div>일부 모델 로딩 실패</div>
          <small>{error}</small>
        </div>
      )}
      <div ref={containerRef} className="ar-3d-models-container" />
    </>
  );
}

export default AR3DModels;
