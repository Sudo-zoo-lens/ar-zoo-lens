# AR Zoo Lens 🦁📱

실시간 카메라 위에 방향 안내가 표시되는 **동물원 혼잡도 기반 AR 네비게이션 시스템**입니다.

![AR Lens Demo](https://img.shields.io/badge/AR-Enabled-brightgreen) ![Mobile](https://img.shields.io/badge/Mobile-Optimized-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 📖 프로젝트 개요

동물원 방문객들이 **실시간 카메라 화면**을 보면서 혼잡한 구역을 피하고, 원하는 동물 서식지까지 최적의 경로로 안내받을 수 있는 AR 네비게이션 앱입니다.

### 🎯 핵심 기능

- 📷 **실시간 카메라 AR** - 카메라 피드 위에 방향 화살표 표시
- 📊 **혼잡도 시각화** - 각 구역의 혼잡도를 색상으로 표시
- 🗺️ **3D 지도 뷰** - 동물원 전체를 한눈에 조감
- 🧭 **실시간 방향 안내** - 직진/좌회전/우회전 화살표
- 📱 **모바일 최적화** - 터치 인터랙션 지원
- 🎨 **컴팩트 UI** - 카메라 모드에서 화면을 가리지 않는 최소 UI

## 🚀 기술 스택

```
Frontend:  React 18 + Vite 5
3D Engine: Three.js + React Three Fiber
Camera:    WebRTC getUserMedia API
Styling:   CSS3 + Animations
Server:    HTTPS (카메라 접근 필수)
```

## 🛠️ 설치 및 실행

### 필수 요구사항

- Node.js 16+
- npm 또는 yarn
- **모바일 디바이스** (카메라 기능 테스트용)

### 1️⃣ 설치

```bash
git clone https://github.com/Sudo-zoo-lens/ar-zoo-lens.git
cd ar-zoo-lens

# 의존성 설치
npm install
```

### 2️⃣ 개발 서버 실행

```bash
npm run dev
```

서버는 **HTTPS**로 실행됩니다 (카메라 접근 필수):

```
➜  Local:   https://localhost:3000/
```

## 📱 사용 방법

### 🖥️ 데스크톱에서

1. `https://localhost:3000` 접속
2. 브라우저 보안 경고 무시 ("고급" → "계속 진행")
3. 좌측 상단에서 목적지 선택
4. 3D 지도에서 경로 확인

### 📱 모바일에서 (AR 카메라 모드)

#### 준비:

- 컴퓨터와 폰이 **같은 Wi-Fi** 연결
- **Chrome (Android)** 또는 **Safari (iOS)** 사용

## 🎨 UI 모드

### 🗺️ 지도 보기 모드

- 위에서 내려다본 3D 동물원 지도
- 터치/마우스로 회전, 줌 가능
- 전체 경로를 한눈에 확인
- 각 구역의 혼잡도를 색상으로 표시

### 📷 카메라 모드 (AR)

- 실제 카메라 피드 표시
- 화면 상단에 컴팩트한 방향 안내 바
- 최소한의 UI로 화면을 가리지 않음
- 탭하면 펼쳐서 자세한 정보 확인

## 📂 프로젝트 구조

```
ar-zoo-lens/
├── src/
│   ├── components/
│   │   ├── ARScene.jsx              # 3D 지도 씬
│   │   ├── ZooArea.jsx               # 동물원 구역 (혼잡도 시각화)
│   │   ├── PathGuide.jsx             # 3D 경로 안내선
│   │   ├── CameraView.jsx            # 카메라 피드 관리
│   │   ├── CompactDirectionOverlay.jsx  # 컴팩트 방향 안내 UI
│   │   ├── NavigationUI.jsx         # 목적지 선택 UI
│   │   └── FirstPersonCamera.jsx    # 1인칭 카메라 컨트롤러
│   ├── data/
│   │   └── mockData.js              # 목 데이터 (구역, 혼잡도, 경로)
│   ├── App.jsx                       # 메인 앱
│   ├── main.jsx
│   └── *.css                         # 스타일 파일들
├── index.html
├── vite.config.js
└── package.json
```

## 🎨 혼잡도 시각화

### 색상 코드

| 색상    | 상태      | 사용률  |
| ------- | --------- | ------- |
| 🟢 초록 | 여유      | 0-30%   |
| 🟡 노랑 | 보통      | 30-60%  |
| 🟠 주황 | 혼잡      | 60-80%  |
| 🔴 빨강 | 매우 혼잡 | 80-100% |

### 3D 표현

- **높이**: 혼잡도가 높을수록 기둥이 높음
- **발광**: 선택된 구역은 발광 효과
- **애니메이션**: 선택 시 펄스 효과

## 📱 브라우저 지원

### 데스크톱

- Chrome 79+
- Edge 79+
- Safari 14.5+

### 모바일 (카메라 기능)

- ✅ Chrome 79+ (Android)
- ✅ Safari 14.5+ (iOS)
- ❌ Firefox Mobile (WebRTC 제한)

## 🌐 배포하기

### 추천 플랫폼: Vercel (무료)

가장 쉬운 방법으로 한 번의 클릭으로 배포 가능합니다.

#### 빠른 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

또는 [vercel.com](https://vercel.com)에서 GitHub 저장소를 연결하여 배포하세요.

**배포 전 필수 체크:**

- ✅ GitHub에 코드 푸시 완료
- ✅ `npm run build`가 성공적으로 실행됨

**HTTPS가 자동으로 설정**되어 카메라 접근이 가능합니다.

## 🚧 알려진 이슈

- ⚠️ HTTP 환경에서는 카메라 접근 불가 (HTTPS 필수)
- ⚠️ 자체 서명 인증서로 인한 브라우저 경고 (무시 가능)
- ⚠️ 일부 Android 디바이스에서 카메라 방향이 잘못될 수 있음

## 📊 성능 최적화

- Three.js 렌더링 최적화 (instancing)
- 카메라 스트림 해상도 조정
- 혼잡도 업데이트 주기 조절 (현재 10초)
- CSS 애니메이션 GPU 가속 사용

## 📄 라이선스

MIT License

## 🙏 감사의 말

- **Three.js** - 3D 렌더링
- **React Three Fiber** - React + Three.js 통합
- **Vite** - 빠른 개발 환경
- **WebRTC** - 카메라 API

---
