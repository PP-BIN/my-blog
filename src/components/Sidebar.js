import { useNavigate } from "react-router-dom";
import styles from "../css/Sidebar.module.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { normalize } from "../utils/slugify";

function Sidebar() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]); 

  useEffect(() => {
    axios.get("http://localhost:5000/api/categories")
      .then(res => setCategories(res.data))
      .catch(err => console.error("❌ 사이드바 카테고리 로드 실패", err));
  }, []);

  const handleClick = (category, sub) => {
    const catParam = encodeURIComponent(normalize(category));
    const subParam = encodeURIComponent(normalize(sub));
    navigate(`/${catParam}/${subParam}`);
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
        {categories.map(({ category, subcategories }) => (
          <li key={category}>
            <strong>{category}</strong>
            <ul>
              {subcategories.map((sub) => (
                <li
                  key={`${category}-${sub}`}
                  className={styles.clickable}
                  onClick={() => handleClick(category, sub)}
                >
                  {sub}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
