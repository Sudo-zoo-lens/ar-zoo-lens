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
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 1.6, 0); // 사용자 눈 높이
      cameraRef.current = camera;

      // Renderer 설정
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // renderer 준비 완료 알림
      if (onRendererReady) {
        onRendererReady(renderer);
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
      console.log(`[AR3DModels] 모델 경로: ${path}`);
      return path;
    };

    const facilityModels = [
      {
        id: "main-gate",
        path: getModelPath("main-gate.glb"),
        areaId: "main-gate",
        scale: 0.5,
      },
      {
        id: "musical-fountain",
        path: getModelPath("musical-fountain.glb"),
        areaId: "music-fountain",
        scale: 0.5,
      },
      {
        id: "ocean-museum",
        path: getModelPath("Ocean-Animal-Museum.glb"),
        areaId: "sea-animals",
        scale: 0.5,
      },
      {
        id: "tropical-museum",
        path: getModelPath("Tropical-Animal-Museum.glb"),
        areaId: "tropical-animals",
        scale: 0.5,
      },
      {
        id: "palgakjeong",
        path: getModelPath("palgakjeong.glb"),
        areaId: "octagon",
        scale: 0.5,
      },
    ];

    facilityModels.forEach((modelConfig) => {
      const area = zooAreas.find((a) => a.id === modelConfig.areaId);
      if (!area) return;

      loader.load(
        modelConfig.path,
        (gltf) => {
          try {
            const model = gltf.scene.clone();
            model.scale.set(
              modelConfig.scale,
              modelConfig.scale,
              modelConfig.scale
            );
            model.visible = false; // 초기에는 숨김
            if (sceneRef.current) {
              sceneRef.current.add(model);
            }
            modelsRef.current[modelConfig.id] = {
              model,
              area,
              type: "facility",
            };
          } catch (err) {
            console.error(`모델 처리 오류 (${modelConfig.id}):`, err);
          }
        },
        (progress) => {
          // 로딩 진행 상황 (선택사항)
          if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100;
            // console.log(`${modelConfig.id} 로딩: ${percentComplete.toFixed(2)}%`);
          }
        },
        (error) => {
          console.error(
            `[AR3DModels] 모델 로딩 오류 (${modelConfig.id}):`,
            error
          );
          console.error(`[AR3DModels] 시도한 경로: ${modelConfig.path}`);
          console.error(`[AR3DModels] 에러 상세:`, {
            message: error?.message,
            stack: error?.stack,
            type: error?.type,
          });
          // 에러가 발생해도 앱이 크래시되지 않도록 계속 진행
          setError((prev) =>
            prev
              ? `${prev}\n${modelConfig.id} 로딩 실패`
              : `${modelConfig.id} 로딩 실패`
          );
        }
      );
    });

    // 동물 모델 로드 및 배치 (정문 근처)
    const animalOffsets = [
      { name: "camel", offsetLng: 0.0001, offsetLat: 0.0001, scale: 0.3 },
      { name: "dolphin", offsetLng: -0.0001, offsetLat: 0.0001, scale: 0.3 },
      {
        name: "green-dinosaur",
        offsetLng: 0.0001,
        offsetLat: -0.0001,
        scale: 0.3,
      },
      { name: "meerkat", offsetLng: -0.0001, offsetLat: -0.0001, scale: 0.005 }, // 미어켓 크기 더 줄임
      { name: "orange-dinosaur", offsetLng: 0.00015, offsetLat: 0, scale: 0.3 },
      { name: "sloth", offsetLng: -0.00015, offsetLat: 0, scale: 0.3 },
      { name: "nubie", offsetLng: 0, offsetLat: 0.00015, scale: 0.3 },
    ];

    animalOffsets.forEach((animal) => {
      loader.load(
        getModelPath(`${animal.name}.glb`),
        (gltf) => {
          try {
            const model = gltf.scene.clone();
            const targetScale = animal.scale || 0.3; // 기본값 0.3

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
            console.log(
              `[AR3DModels] ${animal.name} 모델 최종 크기:`,
              finalSize,
              `최대: ${maxFinalSize} (${(
                (maxFinalSize / maxOriginalSize) *
                100
              ).toFixed(1)}%)`
            );

            model.visible = false;
            if (sceneRef.current) {
              sceneRef.current.add(model);
            }

            modelsRef.current[animal.name] = {
              model,
              area: {
                latitude: mainGate.latitude + animal.offsetLat,
                longitude: mainGate.longitude + animal.offsetLng,
              },
              type: "animal",
              scale: targetScale, // scale 정보도 저장
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

    // 애니메이션 루프
    const animate = () => {
      try {
        animationFrameRef.current = requestAnimationFrame(animate);

        if (!cameraRef.current || !sceneRef.current || !rendererRef.current)
          return;

        const currentPos = characterPosition || userPosition;
        if (!currentPos || !currentPos.latitude || !currentPos.longitude)
          return;

        // 모든 모델 위치 업데이트
        Object.keys(modelsRef.current).forEach((key) => {
          const modelData = modelsRef.current[key];
          if (!modelData || !modelData.model) return;

          const distance = calculateDistance(
            currentPos.latitude,
            currentPos.longitude,
            modelData.area.latitude,
            modelData.area.longitude
          );

          // 100m 이내에 있는 모델만 표시
          if (distance < 100) {
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
          } else {
            modelData.model.visible = false;
          }
        });

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      } catch (err) {
        console.error("[AR3DModels] 애니메이션 루프 오류:", err);
        // 에러가 발생해도 계속 실행
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
