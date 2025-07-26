import React, { useEffect, useState, useRef } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import styles from "../css/PostWrite.module.css";
import axios from "axios";

export default function PostWrite() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    thumbnail: "",
  });
  const [preview, setPreview] = useState(""); // ✅ 썸네일 미리보기
  const editorRef = useRef();

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

    // 미리보기
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

    try {
      const res = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          content: contentHtml,
        }),
      });

      if (!res.ok) throw new Error("게시글 작성 실패");
      alert("✅ 게시글이 작성되었습니다!");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("❌ 작성 실패");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>✏️ 새 글 작성</h2>

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
        <input
          type="file"
          accept="image/*"
          onChange={handleThumbnailChange}
          className={styles.input}
        />
        {preview && (
          <img
            src={preview}
            alt="썸네일 미리보기"
            style={{ width: "200px", margin: "10px 0", borderRadius: "8px" }}
          />
        )}

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

        {/* 작성 버튼 */}
        <button type="submit" className={styles.submitBtn}>
          작성 완료
        </button>
      </form>
    </div>
  );
}
