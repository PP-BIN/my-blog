import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "../css/PostDetail.module.css";
import "@toast-ui/editor/dist/toastui-editor-viewer.css";

export default function PostDetail() {
  const { category, subcategory, postId } = useParams();
  const [post, setPost] = useState({ comments: [] }); // ✅ 초기값 안전하게
  const [newComment, setNewComment] = useState({ user_name: "", content: "" });
  const navigate = useNavigate();

  const fetchPost = () => {
    axios
      .get(`http://localhost:5000/api/posts/${category}/${subcategory}/${postId}`)
      .then((res) =>
        setPost({
          ...res.data,
          comments: res.data.comments || [], // ✅ 댓글이 없으면 빈 배열로 초기화
        })
      )
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchPost();
  }, [category, subcategory, postId]);

  if (!post.id) return <p>로딩 중...</p>;

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.content.trim()) return alert("댓글 내용을 입력하세요.");

    await axios.post("http://localhost:5000/api/comments", {
      post_id: postId,
      user_name: newComment.user_name || "익명",
      content: newComment.content,
    });

    setNewComment({ user_name: "", content: "" });
    fetchPost(); // 댓글 새로고침
  };

  const handleLike = async () => {
  try {
    // ✅ DB 업데이트 요청
    await axios.post(`http://localhost:5000/api/posts/${postId}/like`);

    // ✅ 화면 즉시 반영 (좋아요 +1)
    setPost((prev) => ({
      ...prev,
      likes_count: (prev.likes_count || 0) + 1,
    }));
  } catch (err) {
    console.error("좋아요 실패:", err);
  }
};

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        ← 돌아가기
      </button>
      <h2 className={styles.title}>{post.title}</h2>
      <p className={styles.date}>{new Date(post.created_at).toLocaleDateString()}</p>
      
      {/* ✅ 썸네일이 있을 때만 렌더링 */}
      {post.thumbnail && (
        <img
          src={post.thumbnail}
          alt={post.title}
          className={styles.thumbnail}
        />
      )}

      {/* <img src={post.thumbnail} alt={post.title} className={styles.thumbnail} /> */}
      
      {/* <div className={styles.content}>
        {post.content}
      </div> */}

       {/* ✅ Toast UI에서 작성한 HTML 렌더링 */}
      <div
        className={`${styles.content} toastui-editor-contents`}
        dangerouslySetInnerHTML={{ __html: post.content }}
      ></div>

      <div className={styles.meta}>
        <button onClick={handleLike}>❤️ 좋아요 {post.likes_count}</button>
      </div>

      <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
          <input
            type="text"
            placeholder="이름 (선택)"
            value={newComment.user_name}
            onChange={(e) => setNewComment({ ...newComment, user_name: e.target.value })}
          />
          <textarea
            placeholder="댓글을 입력하세요..."
            value={newComment.content}
            onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
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
            </div>
            <div className={styles["comment-content"]}>{c.content}</div>
          </div>
        ))}

      </div>
    </div>
  );
}
