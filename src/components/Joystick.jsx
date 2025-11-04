import { useState, useRef, useEffect } from "react";
import "./Joystick.css";

function Joystick({ onMove }) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef(null);
  const knobRef = useRef(null);

  const handleStart = (clientX, clientY) => {
    setIsDragging(true);
    updatePosition(clientX, clientY);
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    updatePosition(clientX, clientY);
  };

  const handleEnd = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onMove && onMove({ x: 0, y: 0 });
  };

  const updatePosition = (clientX, clientY) => {
    if (!joystickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    // 조이스틱 범위 제한 (원형)
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2 - 20; // 여백 고려

    let x = deltaX;
    let y = deltaY;

    if (distance > maxDistance) {
      x = (deltaX / distance) * maxDistance;
      y = (deltaY / distance) * maxDistance;
    }

    setPosition({ x, y });

    // 이동 방향 계산 (정규화된 값)
    const normalizedX = x / maxDistance;
    const normalizedY = y / maxDistance;

    onMove && onMove({ x: normalizedX, y: normalizedY });
  };

  // 마우스 이벤트
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // 터치 이벤트
  const handleTouchStart = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    handleEnd();
  };

  useEffect(() => {
    const joystick = joystickRef.current;
    if (joystick) {
      joystick.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
    }
    return () => {
      if (joystick) {
        joystick.removeEventListener("touchstart", handleTouchStart);
      }
    };
  }, []);

  // 전역 이벤트 리스너 등록
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div className="joystick-container">
      <div
        ref={joystickRef}
        className="joystick-base"
        onMouseDown={handleMouseDown}
      >
        <div
          ref={knobRef}
          className="joystick-knob"
          style={{
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        />
      </div>
    </div>
  );
}

export default Joystick;
