import React, { useEffect, useState, useRef } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import styles from "../css/PostWrite.module.css";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function PostWrite() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    thumbnail: "",
  });
  const [preview, setPreview] = useState("");
  const editorRef = useRef();

  // ✅ 객체 URL 정리: preview 변경 및 컴포넌트 언마운트 시 해제
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // ✅ 카테고리 & 서브카테고리 불러오기
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/categories")
      .then((res) => {
        console.log("✅ API로부터 받은 카테고리 데이터:", res.data);
        setCategories(res.data);

        if (res.data.length > 0) {
          const firstCat = res.data[0];
          setForm((prev) => ({
            ...prev,
            category: firstCat.category,
            subcategory: firstCat.subcategories[0],
          }));
          setSubcategories(firstCat.subcategories);
        }
      })
      .catch((err) => console.error("❌ 카테고리 불러오기 실패", err));
  }, []);

  // ✅ 카테고리 선택 시 서브카테고리 업데이트
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    const selectedCat = categories.find((c) => c.category === selectedCategory);

    setForm((prev) => ({
      ...prev,
      category: selectedCategory,
      subcategory: selectedCat?.subcategories[0] || "",
    }));

    setSubcategories(selectedCat?.subcategories || []);
  };

  // ✅ 썸네일 업로드
  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 기존 미리보기 URL 정리 후 새 URL 생성
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // 서버 업로드
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...prev, thumbnail: res.data.url }));
    } catch (err) {
      console.error("❌ 썸네일 업로드 실패", err);
      alert("썸네일 업로드 실패");
    }
  };

  // ✅ 글 작성 처리
   const handleSubmit = async (e) => {
  e.preventDefault();
  const contentHtml = editorRef.current.getInstance().getHTML();
  const token = localStorage.getItem("token");

  if (!token) {
    alert("로그인이 필요합니다.");
    return;
  }

  try {
    if (postId) {
      // 수정 API 호출 (토큰 포함)
      await axios.put(
        `http://localhost:5000/api/posts/${postId}`,
        {
          ...form,
          content: contentHtml,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("게시글이 수정되었습니다!");
    } else {
      // 새글 작성 API 호출 (토큰 포함)
      await axios.post(
        "http://localhost:5000/api/posts",
        {
          ...form,
          content: contentHtml,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("게시글이 작성되었습니다!");
    }
    window.location.href = "/";
  } catch (err) {
    console.error(err.response?.data || err.message);
    alert("저장 실패");
  }
};

  // 글 수정모드
  useEffect(() => {
  if (!postId) return;

  axios.get(`http://localhost:5000/api/posts/category/subcategory/${postId}`)
    .then(res => {
      const data = res.data;
      setForm({
        title: data.title,
        description: data.description || "",
        category: data.category,
        subcategory: data.subcategory,
        thumbnail: data.thumbnail,
      });
      setPreview(data.thumbnail);

      // categories가 없으면 그냥 리턴 (아래서 세팅 불가)
      if (!categories.length) return;

      const cat = categories.find(c => c.category === data.category);
      setSubcategories(cat ? cat.subcategories : []);

      if (editorRef.current) {
        editorRef.current.getInstance().setHTML(data.content);
      }
    })
    .catch(err => console.error(err));
}, [postId, categories]);


  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {postId ? "✏️ 글 수정" : "✏️ 새 글 작성"}
      </h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* 제목 */}
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={styles.input}
          required
        />

        {/* 설명 */}
        <input
          type="text"
          placeholder="간단한 설명을 입력하세요"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          className={styles.input}
        />

        {/* ✅ 썸네일 업로드 */}
        <div className={styles.thumbnailUpload}>
          <label className={styles.thumbnailLabel}>썸네일 업로드</label>

          {/* 파일 업로드 버튼 */}
          <div className={styles.thumbnailInputWrapper}>
            <label htmlFor="thumbnailUpload" className={styles.thumbnailButton}>
              썸네일 선택하기
            </label>
            <input
              id="thumbnailUpload"
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className={styles.thumbnailInput}
            />
          </div>

          {/* 썸네일 미리보기 + 삭제 버튼 */}
          {preview && (
            <div className={styles.thumbnailPreviewWrapper}>
              <img
                src={preview}
                alt="썸네일 미리보기"
                className={styles.thumbnailPreview}
              />
              <button
                type="button"
                className={styles.thumbnailDeleteBtn}
                onClick={() => {
                  setPreview("");
                  setForm((prev) => ({ ...prev, thumbnail: "" }));
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 카테고리 & 서브카테고리 */}
        <div className={styles.selects}>
          <select
            value={form.category}
            onChange={handleCategoryChange}
            className={styles.select}
          >
            {categories.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category}
              </option>
            ))}
          </select>

          <select
            value={form.subcategory}
            onChange={(e) =>
              setForm({ ...form, subcategory: e.target.value })
            }
            className={styles.select}
          >
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Toast UI Editor */}
        <Editor
          ref={editorRef}
          initialValue=" "
          previewStyle="vertical"
          height="400px"
          initialEditType="wysiwyg"
          useCommandShortcut={true}
        />
        <div className="Btns">
          {/* 작성 버튼 */}
          <button type="submit" className={styles.submitBtn}>
            작성 완료
          </button>
          <button className={styles.cencelBtn} onClick={() => navigate("/")}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
