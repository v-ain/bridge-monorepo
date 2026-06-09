import React, { useState, useEffect, useRef } from 'react';
import { useNavigationStore } from '@/router/useNavigationStore';
import { LocalNotesStrategy, GithubNotesStrategy } from '@/router/strategies';

export function MainWelcomeScreen() {
  const selectApp = useNavigationStore((state) => state.selectApp);
  const [isServerOnline, setIsServerOnline] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const apps = [LocalNotesStrategy, GithubNotesStrategy];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // ДИНАМИЧЕСКИЙ РАСЧЕТ: если экран меньше 768px (мобилка), 
    // уменьшаем количество точек в два раза, чтобы они не толпились
    const isMobile = width < 768;
    const numPoints = isMobile ? 20 : 45;

    const points: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];

    // Объект мыши для интерактивного ховера
    const mouse = { x: -1000, y: -1000, radius: 180 };

    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 1.5 + 1.5,
      });
    }

    // СЛУШАТЕЛИ МЫШИ ДЛЯ ХОВЕРА НА ФОНЕ
    const mouseMoveHandler = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const mouseLeaveHandler = () => {
      mouse.x = -1000; // Уводим мышь за экран, если курсор ушел
      mouse.y = -1000;
    };

    window.addEventListener('resize', () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    window.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseleave', mouseLeaveHandler);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. СТАТИЧНАЯ ИНЖЕНЕРНАЯ СЕТКА
      const gridSize = 60;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1.0;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // 2. СВЯЗИ МЕЖДУ ТОЧКАМИ
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.8;

      for (let i = 0; i < numPoints; i++) {
        for (let j = i + 1; j < numPoints; j++) {
          const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y); // Баг исправлен: теперь строго X и Y
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }

        // ИНТЕРАКТИВНЫЙ ХОВЕР: Связь между курсором мыши и точками
        const distToMouse = Math.hypot(points[i].x - mouse.x, points[i].y - mouse.y);
        if (distToMouse < mouse.radius) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; // Линии к мышке делаем чуть ярче
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; // Возвращаем дефолтный цвет

          // Легкое притяжение точек к курсору (интерактивный эффект)
          points[i].x += (mouse.x - points[i].x) * 0.02;
          points[i].y += (mouse.y - points[i].y) * 0.02;
        }
      }

      // 3. ОТРИСОВКА И ДВИЖЕНИЕ ТОЧКЕК
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseleave', mouseLeaveHandler);
    };
  }, []);
  return (
    <div style={{
      backgroundColor: '#0a0a0b',
      color: '#ededed',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* CANVAS С НЕЙРОСЕТЬЮ НА ЗАДНЕМ ПЛАНЕ */}
      <canvas ref={canvasRef} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* КОНТЕНТ (ПОВЕРХ CANVAS, Z-INDEX: 2) */}
      <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

        {/* ВЕРХНЯЯ ПАНЕЛЬ */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: '#555',
          letterSpacing: '0.5px',
          fontFamily: 'monospace'
        }}>
          <div>BRIDGE_MONOREPO // SYSTEM_HUB</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: isServerOnline ? '#4ade80' : '#f87171'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isServerOnline ? '#4ade80' : '#f87171',
                display: 'inline-block'
              }} />
              {isServerOnline ? 'API: Connected' : 'API: Offline'}
            </span>
            <span>v2.0.0-solid</span>
          </div>
        </div>

        {/* ЗАГОЛОВОК */}
        <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '500px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 600, margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
            Инженерная панель управления
          </h1>
          <p style={{ color: '#666', fontSize: '15px', margin: 0, lineHeight: '1.5' }}>
            Выберите изолированный программный модуль для запуска сессии
          </p>
        </div>

        {/* КАРТОЧКИ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '760px',
          marginBottom: '60px'
        }}>
          {apps.map((app) => {
            const isGithub = app.id === 'github';
            const [isHovered, setIsHovered] = useState(false);

            return (
              <div
                key={app.id}
                onClick={() => selectApp(app)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  backgroundColor: '#131314',
                  color: '#ededed',
                  border: '1px solid',
                  borderColor: isHovered
                    ? (isGithub ? '#ff9f1c' : '#ffffff')
                    : '#222223',
                  borderRadius: '14px',
                  padding: '32px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isHovered
                    ? (isGithub ? '0 10px 40px rgba(255,159,28,0.06)' : '0 10px 40px rgba(255,255,255,0.04)')
                    : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '21px', fontWeight: 600 }}>{app.title}</h3>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: isHovered ? (isGithub ? '#ff9f1c' : '#ffffff') : '#555',
                    transition: 'color 0.3s'
                  }}>
                    {isGithub ? '[SYS_CONSOLE]' : '[B2B_MODULE]'}
                  </span>
                </div>

                <p style={{ fontSize: '14px', color: '#888', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                  {isGithub
                    ? 'Интерактивная консоль для работы с удаленными репозиториями, парсинга блогов и низкоуровневой телеметрии.'
                    : 'Минималистичный текстовый интерфейс для управления локальными заметками и архитектурными инсайтами.'}
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {app.techStack.map((tech) => (
                    <span
                      key={tech}
                      style={{
                        backgroundColor: '#19191b',
                        color: isGithub ? '#04f06c' : '#999',
                        border: '1px solid #252527',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ЛАКОНИЧНЫЙ ФУТЕР ИЗ ДВУХ ОПЦИЙ */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#444',
          letterSpacing: '0.5px'
        }}>
          POWERED_WITH // AI_ASSISTANT_ENGINE
        </div>

      </div>
    </div>
  );
}
