import styles from './BlogConsole.module.scss';

interface CardDescriptionProps {
  topic: string;
  keyInsights: string;
}

export const CardDescription = ({ topic, keyInsights, }: CardDescriptionProps) => {
  return (
    <article className={styles.noteBody}>
      <p>
        <strong>{topic}</strong>{keyInsights}
        <code>@shared/schemas</code>
      </p>

      <div className={styles.codeBlock}>
              // Terminal Output Summary:<br />
        $&gt; BRIDGE_ENGINE: UseCase executed successfully.<br />
        $&gt; MEMORY_REDUCTION: Saved 14% heap usage by string memory defragmentation.
      </div>

      <p style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>
        * Последнее изменение: Синхронизировано с базой данных { }.
      </p>
    </article>
  );
}
