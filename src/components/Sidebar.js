import { useNavigate } from "react-router-dom";
import styles from "../css/Sidebar.module.css";

function Sidebar() {
  const navigate = useNavigate();

  const handleClick = (path) => {
    navigate(path);
  };

  return (
    <aside className={styles.card}>
      <div className={styles.profileImage}>
        <img src="/images/profile.png" alt="profile" />
      </div>

      <p className={styles.name}>
        <strong>BIN</strong>
      </p>
      <p className={styles.description}>
        코드 공부, 여행, 음식 좋아하는 것만 기록하는 블로그입니다.
      </p>

      <hr className={styles.divider} />

      <p className={styles.categoryTitle}>
        <strong>Category</strong>
      </p>

      <ul className={styles.categoryList}>
        <li>
          <strong>Study</strong>
          <ul>
            {["react.js", "next.js", "jsp mvc"].map((item) => (
              <li
                key={item}
                className={styles.clickable}
                onClick={() => handleClick(`/study/${item}`)}
              >
                {item}
              </li>
            ))}
          </ul>
        </li>
        <li>
          <strong>Travel</strong>
          <ul>
            {["busan", "jeju", "japan"].map((item) => (
              <li
                key={item}
                className={styles.clickable}
                onClick={() => handleClick(`/travel/${item}`)}
              >
                {item}
              </li>
            ))}
          </ul>
        </li>
        <li>
          <strong>Album</strong>
          <ul>
            {["일상", "음식"].map((item) => (
              <li
                key={item}
                className={styles.clickable}
                onClick={() => handleClick(`/album/${item}`)}
              >
                {item}
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;
