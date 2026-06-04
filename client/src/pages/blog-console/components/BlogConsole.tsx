import React, { useState, useEffect } from 'react';
import { BlogApiResponse, } from '@bridge-monorepo/shared';
import styles from './BlogConsole.module.scss';
import { fetchBlogArticles } from './fethBlogTitle';
import { CardDescription } from './CardDescription';

type TabType = 'description' | 'json' | 'telemetry';

export const BlogConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('description');

  // Динамические списки данных
  const [casesList, setCasesList] = useState<BlogApiResponse>([]);
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [markdownHtml, setMarkdownHtml] = useState<string>('$&gt; SELECT A CASE TO BIND STREAM...');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Эффект для загрузки списка папок (Выполняется 1 раз при монтировании)
  useEffect(() => {
    const loadSidebar = async () => {
      setIsLoading(true);
      const { data, error } = await fetchBlogArticles();
      // console.log(data)
      if (error) {
        setMarkdownHtml(`$&gt; SYSTEM_ERROR: Failed to map cases directory. Error: ${error}`);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setCasesList(data);
        // setSelectedCase(data[0]); // Автоматически выбираем первый кейс в списке
      }
      setIsLoading(false);
    };

    loadSidebar();
  }, []);
  const currentCase = casesList.find((c) => c.title === selectedCase);
  //
  //     setMarkdownHtml('$&gt; STREAMING_DATA_FROM_GITHUB...');
  //       setMarkdownHtml(`$&gt; ERROR: Unable to resolve stream. Code: ${error}`);
  //

  return (
    <div className={styles.workspace}>
      {/* ХЕДЕР ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>⚡</span>
          <h1 className={styles.title}>BRIDGE_MONOREPO // SYSTEM_LOGS</h1>
        </div>
        <div className={styles.meta}>
          <span className={styles.status}>
            <span className={`${styles.indicator} ${styles.pulse}`}></span>
            <span>API: {isLoading ? 'Connecting...' : 'Connected'}</span>
          </span>
          <span className={styles.divider}></span>
          <span className={styles.badge}>v1.0.0</span>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* ЛЕВАЯ КОЛОНКА (ФОРМА СОЗДАНИЯ) ОСТАЕТСЯ КАК БЫЛА */}
        <section className={styles.leftColumn}>
          <div>
            <div className={styles.sectionHeader}>
              <div className={styles.titleWrapper}>
                <span className={styles.index}>01.</span>
                <h2 className={styles.title}>Create New Note</h2>
              </div>
            </div>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Content Payload</label>
                <textarea rows={5} className={styles.textarea} placeholder="Type localized todo or draft here..." />
              </div>
            </form>
          </div>
          <div className={styles.formFooter}>
            <span>Local Sync Enabled</span>
            <button type="submit" className={styles.submitBtn}><span>▶ Run Execute</span></button>
          </div>
        </section>

        {/* ПРАВАЯ КОЛОНКА: ДИНАМИЧЕСКИЙ СПИСОК ПАПОК С ГИТХАБА */}
        <section className={styles.rightColumn}>
          <div className={styles.sectionHeader}>
            <div className={styles.titleWrapper}>
              <span className={styles.index}>02.</span>
              <h2 className={styles.title}>Active Note Console</h2>
            </div>
            <span className={styles.counter}>Total: {casesList.length}</span>
          </div>

          <div className={styles.consoleList}>
            {isLoading ? (
              <div className={styles.consoleItem} style={{ borderStyle: 'dashed' }}>
                <span style={{ color: '#52525b' }}>$&gt; FETCHING_REPOSITORIES_INTEGRATION...</span>
              </div>
            ) : (
              casesList.map(({ title: folderName }) => (
                (<div
                  key={folderName}
                  // Если папка выбрана — подсвечиваем её бордер стилями
                  className={`${styles.consoleItem} ${selectedCase === folderName ? styles.activeItem : ''}`}
                  onClick={() => setSelectedCase(folderName)}
                  style={selectedCase === folderName ? { borderColor: '#eab308', backgroundColor: '#222' } : {}}
                >
                  <div className={styles.itemLeft}>
                    <span className={styles.terminalPrompt} style={selectedCase === folderName ? { color: '#eab308' } : {}}>$&gt;</span>
                    <p className={styles.itemText} style={selectedCase === folderName ? { color: '#fff', fontWeight: 'bold' } : {}}>
                      {folderName}
                    </p>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.time}>Fetch Active</span>
                  </div>
                </div>)
              ))
            )}
          </div>
        </section>
      </main>

      {/* НИЖНЯЯ ПАНЕЛЬ С ТАБАМИ */}
      <div className={styles.mainContent} style={{ paddingTop: 0 }}>
        <section className={styles.detailedWorkspace}>
          <div className={styles.tabBar}>
            <button className={`${styles.tab} ${activeTab === 'description' ? styles.active : ''}`} onClick={() => setActiveTab('description')}>📝 Description</button>
            <button className={`${styles.tab} ${activeTab === 'json' ? styles.active : ''}`} onClick={() => setActiveTab('json')}>💻 Raw JSON Payload</button>
            <button className={`${styles.tab} ${activeTab === 'telemetry' ? styles.active : ''}`} onClick={() => setActiveTab('telemetry')}>📈 Telemetry Metrics</button>
          </div>

          <div className={styles.viewerWindow}>
            <div className={styles.metaGrid}>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>Resource Slug</div>
                <div className={styles.metaValue} style={{ fontSize: '0.7rem' }}>{selectedCase || 'NULL'}</div>
              </div>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>Domain Context</div>
                <div className={`${styles.metaValue} ${styles.highlight}`}>
                  {/* {selectedCase ? formatCaseTitle(selectedCase) : 'NOT_SELECTED'} */}
                </div>
              </div>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>Network Engine</div>
                <div className={styles.metaValue}>GitHub CDN</div>
              </div>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>Stream Sync</div>
                <div className={styles.metaValue} style={{ color: '#10b981' }}>● Live Stream</div>
              </div>
            </div>

            {currentCase && <CardDescription {...currentCase} />}
          </div>
        </section>
      </div>
    </div>
  );
};
