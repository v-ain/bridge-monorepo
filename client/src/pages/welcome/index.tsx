import React from 'react';
import { useNavigationStore } from '@/router/useNavigationStore';
import { LocalNotesStrategy, GithubNotesStrategy } from '@/router/strategies';

export function MainWelcomeScreen() {
  const selectApp = useNavigationStore((state) => state.selectApp);
  const apps = [LocalNotesStrategy, GithubNotesStrategy];

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Панель управления приложениями</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>Выберите модуль для начала работы</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {apps.map((app) => (
          <div
            key={app.id}
            onClick={() => selectApp(app)}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: '#fff'
            }}
            // Быстрый ховер-эффект нативным инлайном для теста
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0070f3'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>{app.title}</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {app.techStack.map((tech) => (
                <span
                  key={tech}
                  style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: '#444' }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

