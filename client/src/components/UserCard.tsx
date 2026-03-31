import { User } from '@shared/index';
import styles from './UserCard.module.scss';

interface UserCardProps {
  user: User;
  onGreet?: (user: User) => void;
}

export const UserCard = ({ user, onGreet }: UserCardProps) => {
  return (
    <div className={styles.card}>
      <h3>{user.name}</h3>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <button onClick={() => onGreet?.(user)}>Say hello</button>
    </div>
  );
};
