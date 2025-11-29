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

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene 설정
    const scene = new THREE.Scene();
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
    const facilityModels = [
      {
        id: "main-gate",
        path: new URL("../image/3d/main-gate.glb", import.meta.url).href,
        areaId: "main-gate",
        scale: 0.5,
      },
      {
        id: "musical-fountain",
        path: new URL("../image/3d/musical-fountain.glb", import.meta.url).href,
        areaId: "music-fountain",
        scale: 0.5,
      },
      {
        id: "ocean-museum",
        path: new URL("../image/3d/Ocean-Animal-Museum.glb", import.meta.url)
          .href,
        areaId: "sea-animals",
        scale: 0.5,
      },
      {
        id: "tropical-museum",
        path: new URL("../image/3d/Tropical-Animal-Museum.glb", import.meta.url)
          .href,
        areaId: "tropical-animals",
        scale: 0.5,
      },
      {
        id: "palgakjeong",
        path: new URL("../image/3d/palgakjeong.glb", import.meta.url).href,
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
          const model = gltf.scene.clone();
          model.scale.set(
            modelConfig.scale,
            modelConfig.scale,
            modelConfig.scale
          );
          model.visible = false; // 초기에는 숨김
          scene.add(model);
          modelsRef.current[modelConfig.id] = {
            model,
            area,
            type: "facility",
          };
        },
        undefined,
        (error) => {
          console.error(`모델 로딩 오류 (${modelConfig.id}):`, error);
        }
      );
    });

    // 동물 모델 로드 및 배치 (정문 근처)
    const animalOffsets = [
      { name: "camel", offsetLng: 0.0001, offsetLat: 0.0001 },
      { name: "dolphin", offsetLng: -0.0001, offsetLat: 0.0001 },
      { name: "green-dinosaur", offsetLng: 0.0001, offsetLat: -0.0001 },
      { name: "meerkat", offsetLng: -0.0001, offsetLat: -0.0001 },
      { name: "orange-dinosaur", offsetLng: 0.00015, offsetLat: 0 },
      { name: "sloth", offsetLng: -0.00015, offsetLat: 0 },
      { name: "nubie", offsetLng: 0, offsetLat: 0.00015 },
    ];

    animalOffsets.forEach((animal) => {
      loader.load(
        new URL(`../image/3d/${animal.name}.glb`, import.meta.url).href,
        (gltf) => {
          const model = gltf.scene.clone();
          model.scale.set(0.3, 0.3, 0.3);
          model.visible = false;
          scene.add(model);
          modelsRef.current[animal.name] = {
            model,
            area: {
              latitude: mainGate.latitude + animal.offsetLat,
              longitude: mainGate.longitude + animal.offsetLng,
            },
            type: "animal",
          };
        },
        undefined,
        (error) => {
          console.error(`동물 모델 로딩 오류 (${animal.name}):`, error);
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
      animationFrameRef.current = requestAnimationFrame(animate);

      if (!cameraRef.current || !sceneRef.current || !rendererRef.current)
        return;

      const currentPos = characterPosition || userPosition;
      if (!currentPos) return;

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
  }, []);

  // 위치가 변경될 때마다 모델 위치 업데이트
  useEffect(() => {
    // 위치 업데이트는 애니메이션 루프에서 처리됨
  }, [userPosition, characterPosition]);

  return <div ref={containerRef} className="ar-3d-models-container" />;
}

export default AR3DModels;
