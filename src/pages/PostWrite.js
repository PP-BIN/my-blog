import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import axios from "axios";
import styles from "../css/PostWrite.module.css";

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

  // ✅ Tiptap Editor 설정
  const editor = useEditor({
    extensions: [StarterKit, Image, Link],
    content: "<p>여기에 글을 작성하세요.</p>",
  });

  // ✅ 카테고리 가져오기
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/categories")
      .then((res) => {
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

  // ✅ 게시글 작성 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    const contentHtml = editor.getHTML();

    try {
      const res = await axios.post("http://localhost:5000/api/posts", {
        ...form,
        content: contentHtml,
      });

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

        {/* 썸네일 */}
        <input
          type="text"
          placeholder="썸네일 이미지 URL (선택)"
          value={form.thumbnail}
          onChange={(e) =>
            setForm({ ...form, thumbnail: e.target.value })
          }
          className={styles.input}
        />

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

        {/* ✅ Tiptap Editor */}
        <EditorContent editor={editor} className={styles.editor} />
        <button
          type="button"
          onClick={() => {
            const url = prompt("이미지 URL을 입력하세요");
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
        >
          🖼 이미지 추가
        </button>
        <button type="submit" className={styles.submitBtn}>
          작성 완료
        </button>
      </form>
    </div>
  );
}
