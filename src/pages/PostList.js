// 파일: src/pages/PostList.jsx
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import api from "../utils/api";
import styles from "../css/PostList.module.css";
import { normalize } from "../utils/slugify";

export default function PostList() {
  const { category, subcategory } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlCat = decodeURIComponent(category || "");
  const urlSub = decodeURIComponent(subcategory || "");

  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [loading, setLoading] = useState(true);

  // ✅ 페이지네이션 상태
  const PER_PAGE = 9;
  const initialPage = Number(searchParams.get("page") || 1);
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);

  // URL → page 동기화 (주소 직접 변경/뒤로가기 대응)
  useEffect(() => {
    const sp = Number(searchParams.get("page") || 1);
    if (Number.isFinite(sp) && sp !== page) {
      setPage(sp > 0 ? sp : 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const resolveCanonicalNames = useCallback(async () => {
    try {
      const res = await api.get("/categories");
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
        const byCat = await api.get(
          `/posts/by-category/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}`
        );
        setPosts(byCat.data || []);
      } catch (e1) {
        // 2) 폴백: 기존 쿼리
        const legacy = await api.get(`/posts`, {
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

  // 필터 & 정렬
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => (post.title || "").toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sort === "latest") return new Date(b.created_at) - new Date(a.created_at);
        if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
        return 0;
      });
  }, [posts, search, sort]);

  // ✅ 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PER_PAGE));
  // page가 범위 밖이면 보정
  useEffect(() => {
    if (page > totalPages) {
      goPage(totalPages);
    } else if (page < 1) {
      goPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const currentPagePosts = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filteredPosts.slice(start, start + PER_PAGE);
  }, [filteredPosts, page]);

  // ✅ 페이지 변경 함수들 (URL ?page= 동기화)
  const goPage = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    const newParams = new URLSearchParams(searchParams);
    if (next === 1) newParams.delete("page");
    else newParams.set("page", String(next));
    setSearchParams(newParams);
  };
  const goFirst = () => goPage(1);
  const goPrev = () => goPage(page - 1);
  const goNext = () => goPage(page + 1);
  const goLast = () => goPage(totalPages);

  // ✅ 숫자 버튼(10개 단위 윈도우)
  const windowStart = Math.floor((page - 1) / 10) * 10 + 1;
  const windowEnd = Math.min(windowStart + 9, totalPages);
  const pageNumbers = [];
  for (let p = windowStart; p <= windowEnd; p++) pageNumbers.push(p);

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
          onChange={(e) => {
            setSearch(e.target.value);
            // 검색어가 바뀌면 1페이지로
            if (page !== 1) goPage(1);
          }}
          className={styles.searchInput}
        />
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            // 정렬이 바뀌면 1페이지로
            if (page !== 1) goPage(1);
          }}
          className={styles.sortSelect}
        >
          <option value="latest">최신순</option>
          <option value="oldest">오래된 순</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.loading}>불러오는 중...</p>
      ) : (
        <>
          <div className={styles.postGrid}>
            {currentPagePosts.length > 0 ? (
              currentPagePosts.map((post) => (
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

          {/* ✅ 페이지네이션 바 */}
          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="페이지네이션">
              <button
                className={`${styles.pageBtn} ${page === 1 ? styles.disabled : ""}`}
                onClick={goFirst}
                disabled={page === 1}
              >
                &laquo;
              </button>
              <button
                className={`${styles.pageBtn} ${page === 1 ? styles.disabled : ""}`}
                onClick={goPrev}
                disabled={page === 1}
              >
                &lsaquo;
              </button>

              {/* 필요 시 앞쪽 생략표시 */}
              {windowStart > 1 && (
                <>
                  <button className={styles.pageBtn} onClick={() => goPage(1)}>1</button>
                  {windowStart > 2 && <span className={styles.ellipsis}>…</span>}
                </>
              )}

              {pageNumbers.map((p) => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === page ? styles.active : ""}`}
                  onClick={() => goPage(p)}
                >
                  {p}
                </button>
              ))}

              {/* 필요 시 뒤쪽 생략표시 */}
              {windowEnd < totalPages && (
                <>
                  {windowEnd < totalPages - 1 && <span className={styles.ellipsis}>…</span>}
                  <button className={styles.pageBtn} onClick={() => goPage(totalPages)}>
                    {totalPages}
                  </button>
                </>
              )}

              <button
                className={`${styles.pageBtn} ${page === totalPages ? styles.disabled : ""}`}
                onClick={goNext}
                disabled={page === totalPages}
              >
                &rsaquo;
              </button>
              <button
                className={`${styles.pageBtn} ${page === totalPages ? styles.disabled : ""}`}
                onClick={goLast}
                disabled={page === totalPages}
              >
                &raquo;
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
