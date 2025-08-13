import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import styles from "../css/PostList.module.css";

// URL/원본명 관대한 정규화 (프론트 매핑용)
const normalize = (s = "") =>
  String(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.\-가-힣]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

export default function PostList() {
  const { category, subcategory } = useParams();
  const navigate = useNavigate();

  const urlCat = decodeURIComponent(category || "");
  const urlSub = decodeURIComponent(subcategory || "");

  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [loading, setLoading] = useState(true);

  const resolveCanonicalNames = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/categories");
      const list = res.data || [];

      const urlCatNorm = normalize(urlCat);
      const urlSubNorm = normalize(urlSub);

      const catObj =
        list.find((c) => normalize(c.category) === urlCatNorm) ||
        list.find((c) => normalize(c.category) === normalize(urlCat.replace(/-/g, " "))) ||
        null;

      const canonicalCategory = catObj?.category || urlCat;

      const subObj =
        catObj?.subcategories?.find((s) => normalize(s) === urlSubNorm) ||
        catObj?.subcategories?.find((s) => normalize(s) === normalize(urlSub.replace(/-/g, " "))) ||
        null;

      const canonicalSubcategory = subObj || urlSub;

      return { canonicalCategory, canonicalSubcategory };
    } catch (e) {
      console.error("카테고리 목록 조회 실패(매핑 스킵):", e);
      return { canonicalCategory: urlCat, canonicalSubcategory: urlSub };
    }
  }, [urlCat, urlSub]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { canonicalCategory, canonicalSubcategory } = await resolveCanonicalNames();

      // 1) 유연 매칭 API 우선
      try {
        const byCat = await axios.get(
          `http://localhost:5000/api/posts/by-category/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}`
        );
        setPosts(byCat.data || []);
      } catch (e1) {
        // 2) 폴백: 기존 쿼리 (params 사용 → 자동 인코딩)
        const legacy = await axios.get(`http://localhost:5000/api/posts`, {
          params: {
            category: canonicalCategory,
            subcategory: canonicalSubcategory,
          },
        });
        setPosts(legacy.data || []);
      }
    } catch (e) {
      console.error("목록 불러오기 실패:", e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [resolveCanonicalNames, category, subcategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => (post.title || "").toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sort === "latest") return new Date(b.created_at) - new Date(a.created_at);
        if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
        return 0;
      });
  }, [posts, search, sort]);

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate("/")}>
        ← 뒤로가기
      </button>

      <h2 className={styles.title}>{urlSub} 게시물</h2>

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

      {loading ? (
        <p className={styles.loading}>불러오는 중...</p>
      ) : (
        <div className={styles.postGrid}>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Link
                to={`/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}/${post.id}`}
                key={post.id}
                className={styles.card}
              >
                <img src={post.thumbnail} alt={post.title} className={styles.thumbnail} />
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
      )}
    </div>
  );
}
