import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/FeaturedPost.module.css";

function FeaturedPost({ title, posts, autoSlide = false, slideInterval = 3000 }) {
  const navigate = useNavigate();
  const postsPerPage = 3;
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const pages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => {
      const start = i * postsPerPage;
      const slice = posts.slice(start, start + postsPerPage);
      return [...slice, ...Array(postsPerPage - slice.length).fill(null)];
    });
  }, [posts, totalPages]);

  const extendedPages = useMemo(
    () => [pages[pages.length - 1], ...pages, pages[0]],
    [pages]
  );

  const [page, setPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);

  const goToPage = (nextPage) => {
    if (totalPages <= 1 || !isAnimating) return;
    setPage(nextPage);
    setIsAnimating(true);
  };

  const handleNext = () => goToPage(page + 1);
  const handlePrev = () => goToPage(page - 1);

  useEffect(() => {
    if (!autoSlide || totalPages <= 1 || isPaused) return;
    const interval = setInterval(handleNext, slideInterval);
    return () => clearInterval(interval);
  }, [autoSlide, totalPages, slideInterval, isPaused, page]);

  useEffect(() => {
    const container = containerRef.current;
    const handleTransitionEnd = () => {
      if (page === extendedPages.length - 1) {
        setIsAnimating(false);
        setPage(1);
      } else if (page === 0) {
        setIsAnimating(false);
        setPage(extendedPages.length - 2);
      }
    };

    container.addEventListener("transitionend", handleTransitionEnd);
    return () => container.removeEventListener("transitionend", handleTransitionEnd);
  }, [page, extendedPages.length]);

  useEffect(() => {
    if (!isAnimating) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setIsAnimating(true))
      );
    }
  }, [isAnimating]);

  const realPage =
    page === 0
      ? totalPages
      : page === extendedPages.length - 1
      ? 1
      : page;

  return (
    <section
      className={styles.card}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.wrapper}>
        {totalPages > 1 && !autoSlide && (
          <button onClick={handlePrev} className={styles.navButton}>
            ◀
          </button>
        )}

        <div className={styles.slider}>
          <div
            ref={containerRef}
            className={styles.sliderInner}
            style={{
              width: `${extendedPages.length * 100}%`,
              transform: `translateX(-${page * (100 / extendedPages.length)}%)`,
              transition: isAnimating ? "transform 0.5s ease-in-out" : "none",
            }}
          >
            {extendedPages.map((pagePosts, pageIndex) => (
              <div
                key={pageIndex}
                className={styles.page}
                style={{ width: `${100 / extendedPages.length}%` }}
              >
                {pagePosts.map((post, idx) =>
                  post ? (
                    <div
                      key={idx}
                      className={styles.post}
                      onClick={() =>
                        navigate(`/${post.category}/${post.subcategory}/${post.id}`)
                      }
                    >
                      <div
                        className={styles.postImage}
                        style={{
                          backgroundImage: post.thumbnail
                            ? `url(${post.thumbnail})`
                            : undefined,
                        }}
                      />
                      <p>{post.description}</p>
                    </div>
                  ) : (
                    <div key={`empty-${idx}`} className={styles.empty} />
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {totalPages > 1 && !autoSlide && (
          <button onClick={handleNext} className={styles.navButton}>
            ▶
          </button>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.dots}>
          {pages.map((_, idx) => (
            <div
              key={idx}
              className={`${styles.dot} ${
                realPage === idx + 1 ? styles.active : ""
              }`}
              onClick={() => goToPage(idx + 1)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default FeaturedPost;
