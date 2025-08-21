import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/api";
import styles from "../css/PostDetail.module.css";
import "@toast-ui/editor/dist/toastui-editor-viewer.css";
import { useAuth } from "../AuthContext";
import logger from "../utils/logger";

export default function PostDetail() {
  const { category, subcategory, postId } = useParams();
  const [post, setPost] = useState({ comments: [] });
  const [commentText, setCommentText] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  // 게시글 + 댓글 불러오기
  const fetchPost = () => {
    api
      .get(`/posts/${category}/${subcategory}/${postId}`)
      .then((res) =>
        setPost({
          ...res.data,
          comments: res.data.comments || [],
        })
      )
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchPost();
  }, [category, subcategory, postId]);

  useEffect(() => {
    logger.debug("현재 사용자:", user);
  }, [user]);

  // 로딩 상태 처리
  if (!post.id) return <p>로딩 중...</p>;

  // 댓글작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return alert("댓글 내용을 입력하세요.");

    try {
      await api.post("/comments", {
        post_id: postId,
        content: commentText,
      });
      setCommentText("");
      fetchPost();
    } catch (err) {
      alert(err.response?.data?.message || "댓글 작성 실패");
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/comments/${commentId}`);
      fetchPost();
    } catch (err) {
      alert(err.response?.data?.message || "댓글 삭제 실패");
    }
  };

  // 좋아요
  const handleLike = async () => {
    try {
      await api.post(`/posts/${postId}/like`);
      setPost((prev) => ({
        ...prev,
        likes_count: (prev.likes_count || 0) + 1,
      }));
    } catch (err) {
      console.error("좋아요 실패:", err);
    }
  };

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await api.delete(`/posts/${postId}`);
      alert("게시물이 삭제되었습니다.");
      navigate(-1);
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제에 실패했습니다.");
    }
  };

  // 게시글 수정
  const handleEdit = () => {
    navigate(`/write/postId=${postId}`);
  };

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        ← 돌아가기
      </button>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{post.title}</h1>
        {user?.role === "master" && (
          <div className={styles.actionButtons}>
            <button
              className={styles.editBtn}
              onClick={() => navigate(`/edit/${post.id}`)}
            >
              수정
            </button>
            <button
              className={styles.deleteBtnMain}
              onClick={handleDeletePost}
            >
              삭제
            </button>
          </div>
        )}
</div>

      <p className={styles.date}>{new Date(post.created_at).toLocaleDateString()}</p>

      {post.thumbnail && (
        <img
          src={post.thumbnail}
          alt={post.title}
          className={styles.thumbnail}
        />
      )}

      <div
        className={`${styles.content} toastui-editor-contents`}
        dangerouslySetInnerHTML={{ __html: post.content }}
      ></div>

      <div className={styles.meta}>
        <button onClick={handleLike}>❤️ 좋아요 {post.likes_count}</button>
      </div>

      <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
        <textarea
          placeholder="댓글을 입력하세요..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          required
        />
        <button type="submit">댓글 작성</button>
      </form>

      <div className={styles.comments}>
        <h3>댓글 ({post.comments?.length || 0})</h3>
        {post.comments?.map((c) => (
          <div key={c.id} className={styles.comment}>
            <div className={styles["comment-meta"]}>
              <strong>{c.user_name}</strong> ·{" "}
              {new Date(c.created_at).toLocaleDateString()}{" "}
              {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}

              {(user?.role === "master" || (user?.role === "user" && user.username === c.user_name)) && (
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteComment(c.id)}
                  style={{ marginLeft: "10px", color: "red" }}
                >
                  삭제
                </button>
              )}
            </div>
            <div className={styles["comment-content"]}>{c.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
