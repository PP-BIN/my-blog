import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import styles from "../css/PostList.module.css";

export default function PostList() {
  const { category, subcategory } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");

  useEffect(() => {
    api
      .get(`/posts?category=${category}&subcategory=${subcategory}`)
      .then((res) => setPosts(res.data))
      .catch((err) => console.error(err));
  }, [category, subcategory]);

  const filteredPosts = posts
    .filter((post) => post.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "latest") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sort === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return 0;
    });

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate("/")}>
        ← 뒤로가기
      </button>

      <h2 className={styles.title}>{subcategory} 게시물</h2>

      <div className={styles.filterWrapper}>
        <input
          type="text"
          placeholder="검색어 입력..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={styles.sortSelect}
        >
          <option value="latest">최신순</option>
          <option value="oldest">오래된 순</option>
        </select>
      </div>

      <div className={styles.postGrid}>
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Link
              to={`/${category}/${subcategory}/${post.id}`}
              key={post.id}
              className={styles.card}
            >
              <img
                src={post.thumbnail}
                alt={post.title}
                className={styles.thumbnail}
              />
              <div className={styles.content}>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <p className={styles.postDesc}>{post.description}</p>
                <p className={styles.postMeta}>
                  ❤️ {post.likes_count} · 💬 {post.comments_count} ·{" "}
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className={styles.noPost}>게시물이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
