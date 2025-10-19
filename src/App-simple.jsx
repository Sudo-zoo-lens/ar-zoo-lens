// 간단한 테스트 버전
function AppSimple() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>🦁 AR Zoo Lens</h1>
      <p style={{ fontSize: "24px" }}>프로젝트가 로드되었습니다!</p>
      <p style={{ fontSize: "18px", marginTop: "20px" }}>
        이 화면이 보이면 React는 정상 작동 중입니다.
      </p>
    </div>
  );
}

export default AppSimple;
