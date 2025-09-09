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

  // 목록/상태
  const [posts, setPosts] = useState([]);      // 서버가 주는 현재 페이지 아이템
  const [total, setTotal] = useState(0);       // 서버 총 개수
  const [loading, setLoading] = useState(true);

  // 필터 UI
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState(searchParams.get("sort") === "oldest" ? "oldest" : "latest");

  // 페이지네이션
  const PER_PAGE = 9;
  const initialPage = Number(searchParams.get("page") || 1);
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);

  // URL → 내부 상태(뒤로가기/주소창 변경 대응)
  useEffect(() => {
    const sp = Number(searchParams.get("page") || 1);
    if (Number.isFinite(sp) && sp !== page) {
      setPage(sp > 0 ? sp : 1);
    }
    const q = searchParams.get("q") || "";
    if (q !== search) setSearch(q);
    const srt = searchParams.get("sort") === "oldest" ? "oldest" : "latest";
    if (srt !== sort) setSort(srt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 카테고리/서브카테고리 정규화(서버와 표현이 달라도 매칭되게)
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

  // 서버에서 페이지 단위로 가져오기
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { canonicalCategory, canonicalSubcategory } = await resolveCanonicalNames();

      // ✅ 단일 엔드포인트(`/api/posts`)로 페이지네이션/정렬/검색 처리
      const res = await api.get("/posts", {
        params: {
          category: canonicalCategory,
          subcategory: canonicalSubcategory,
          page,
          per_page: PER_PAGE,
          search: search || undefined,
          sort: sort === "latest" ? "desc_created" : "asc_created",
        },
      });

      setPosts(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error("목록 불러오기 실패:", e);
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [resolveCanonicalNames, page, search, sort]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 총 페이지
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PER_PAGE)), [total]);

  // URL 동기화 유틸
  const syncSearchParams = (nextPage, nextSearch = search, nextSort = sort) => {
    const newParams = new URLSearchParams(searchParams);
    if (!nextPage || nextPage === 1) newParams.delete("page");
    else newParams.set("page", String(nextPage));
    if (nextSearch) newParams.set("q", nextSearch);
    else newParams.delete("q");
    if (nextSort === "oldest") newParams.set("sort", "oldest");
    else newParams.delete("sort");
    setSearchParams(newParams);
  };

  // 페이지 이동
  const goPage = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    syncSearchParams(next);
  };
  const goFirst = () => goPage(1);
  const goPrev = () => goPage(page - 1);
  const goNext = () => goPage(page + 1);
  const goLast = () => goPage(totalPages);

  // 숫자 버튼(10개 윈도우)
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
            const v = e.target.value;
            setSearch(v);
            // 검색 변경 → 1페이지로
            if (page !== 1) {
              setPage(1);
              syncSearchParams(1, v, sort);
            } else {
              syncSearchParams(1, v, sort);
            }
          }}
          className={styles.searchInput}
        />
        <select
          value={sort}
          onChange={(e) => {
            const v = e.target.value;
            setSort(v);
            // 정렬 변경 → 1페이지로
            if (page !== 1) {
              setPage(1);
              syncSearchParams(1, search, v);
            } else {
              syncSearchParams(1, search, v);
            }
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
            {posts.length > 0 ? (
              posts.map((post) => (
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

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="페이지네이션">
              <button
                className={`${styles.pageBtn} ${page === 1 ? styles.disabled : ""}`}
                onClick={goFirst}
                disabled={page === 1}
                aria-label="처음 페이지"
              >
                &laquo;
              </button>
              <button
                className={`${styles.pageBtn} ${page === 1 ? styles.disabled : ""}`}
                onClick={goPrev}
                disabled={page === 1}
                aria-label="이전 페이지"
              >
                &lsaquo;
              </button>

              {/* 앞쪽 생략 */}
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

              {/* 뒤쪽 생략 */}
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
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button
                className={`${styles.pageBtn} ${page === totalPages ? styles.disabled : ""}`}
                onClick={goLast}
                disabled={page === totalPages}
                aria-label="마지막 페이지"
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
