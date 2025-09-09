import React, { useEffect, useState, useRef } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import styles from "../css/PostWrite.module.css";
import api from "../utils/api"; // ★ axios 대신 공용 인스턴스 사용
import { useNavigate, useParams } from "react-router-dom";
import logger from "../utils/logger";

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

  // 입력: 새 카테고리/서브카테고리
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");

  // 객체 URL 정리
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // 카테고리 불러오기
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories"); // ★ /api 붙이지 않음(이미 baseURL:/api)
      logger.debug("✅ API 카테고리:", res.data);
      setCategories(res.data);

      // 선택값 초기화/동기화
      if (!form.category) {
        if (res.data.length > 0) {
          const first = res.data[0];
          setForm((p) => ({
            ...p,
            category: first.category,
            subcategory: first.subcategories?.[0] || "",
          }));
          setSubcategories(first.subcategories || []);
        } else {
          setSubcategories([]);
          setForm((p) => ({ ...p, category: "", subcategory: "" }));
        }
      } else {
        const selected = res.data.find((c) => c.category === form.category);
        setSubcategories(selected?.subcategories || []);
        if (
          selected &&
          selected.subcategories.length > 0 &&
          !selected.subcategories.includes(form.subcategory)
        ) {
          setForm((p) => ({ ...p, subcategory: selected.subcategories[0] }));
        }
      }
    } catch (e) {
      console.error("❌ 카테고리 불러오기 실패", e);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 카테고리 변경
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    const selectedCat = categories.find((c) => c.category === selectedCategory);

    setForm((prev) => ({
      ...prev,
      category: selectedCategory,
      subcategory: selectedCat?.subcategories?.[0] || "",
    }));
    setSubcategories(selectedCat?.subcategories || []);
  };

  // 썸네일 업로드 (본문에는 삽입하지 않음)
  const handleThumbnailChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    const fd = new FormData();
    fd.append("file", file); // ★ 필드명은 file

    try {
      // ★ 업로드 엔드포인트: /api/uploads
      const res = await api.post("/uploads", fd /*, {
        headers: { "Content-Type": "multipart/form-data" }, // 생략 OK
      }*/);
      setForm((prev) => ({ ...prev, thumbnail: res.data.url }));
    } catch (err) {
      console.error("❌ 썸네일 업로드 실패", err);
      alert(err.response?.data?.message || "썸네일 업로드 실패");
    }
  };

  // 글 저장
  const handleSubmit = async (e) => {
    e.preventDefault();
    const contentHtml = editorRef.current.getInstance().getHTML();

    try {
      if (postId) {
        await api.put(`/posts/${postId}`, { ...form, content: contentHtml });
        alert("게시글이 수정되었습니다!");
      } else {
        await api.post("/posts", { ...form, content: contentHtml });
        alert("게시글이 작성되었습니다!");
      }
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || "저장 실패");
    }
  };

  // 수정 모드: 단일 조회
  useEffect(() => {
    if (!postId) return;
    api
      .get(`/posts/id/${postId}`) // ★ PHP 단일 조회 엔드포인트
      .then((res) => {
        const d = res.data;
        setForm({
          title: d.title,
          description: d.description || "",
          category: d.category,
          subcategory: d.subcategory,
          thumbnail: d.thumbnail,
        });
        setPreview(d.thumbnail);

        if (!categories.length) return;
        const cat = categories.find((c) => c.category === d.category);
        setSubcategories(cat ? cat.subcategories : []);

        if (editorRef.current) {
          editorRef.current.getInstance().setHTML(d.content || "");
        }
      })
      .catch((err) => console.error(err));
  }, [postId, categories]);

  // ========== 카테고리/서브카테고리 관리 ==========

  // 카테고리 추가만
  const handleAddCategoryOnly = async (name) => {
    try {
      await api.post("/categories", { name });
      await fetchCategories();
      setForm((p) => ({ ...p, category: name, subcategory: "" }));
      setSubcategories([]);
    } catch (err) {
      if (err.response?.status === 409) {
        alert("이미 존재하는 카테고리입니다.");
      } else {
        console.error(err);
        alert("카테고리 추가 실패");
      }
    }
  };

  // 서브카테고리 추가(카테고리 없으면 만들고)
  const handleAddSubcategorySmart = async (categoryName, subName) => {
    try {
      await api.post(
        `/categories/${encodeURIComponent(categoryName)}/subcategories`,
        { name: subName }
      );
      const updated = await api.get("/categories");
      setCategories(updated.data);

      const current = updated.data.find((c) => c.category === categoryName);
      setSubcategories(current?.subcategories || []);
      setForm((p) => ({ ...p, category: categoryName, subcategory: subName }));
    } catch (err) {
      if (err.response?.status === 409) {
        alert("이미 존재하는 서브카테고리입니다.");
      } else {
        console.error(err);
        alert("서브카테고리 추가 실패");
      }
    }
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return alert("카테고리명을 입력하세요.");
    await handleAddCategoryOnly(name);
    setNewCategory("");
  };

  const handleAddSubcategory = async () => {
    const catFromInput = newCategory.trim();
    const subFromInput = newSubcategory.trim();

    if (catFromInput && subFromInput) {
      await handleAddSubcategorySmart(catFromInput, subFromInput);
      setNewCategory("");
      setNewSubcategory("");
      return;
    }

    if (!subFromInput) return alert("서브카테고리명을 입력하세요.");

    const baseCategory = form.category?.trim();
    if (!baseCategory) {
      return alert("상위 카테고리를 선택하거나 새 카테고리를 입력하세요.");
    }

    await handleAddSubcategorySmart(baseCategory, subFromInput);
    setNewSubcategory("");
  };

  const handleRemoveCategory = async () => {
    if (!form.category) return alert("삭제할 카테고리를 선택하세요.");
    if (!window.confirm(`'${form.category}' 카테고리를 삭제할까요? (하위도 함께 삭제)`)) return;

    try {
      await api.delete(`/categories/${encodeURIComponent(form.category)}`);
      await fetchCategories();

      const res = await api.get("/categories");
      const list = res.data;
      setCategories(list);
      if (list.length) {
        setForm((p) => ({
          ...p,
          category: list[0].category,
          subcategory: list[0].subcategories?.[0] || "",
        }));
        setSubcategories(list[0].subcategories || []);
      } else {
        setForm((p) => ({ ...p, category: "", subcategory: "" }));
        setSubcategories([]);
      }
    } catch (err) {
      console.error(err);
      alert("카테고리 삭제 실패 (참조 데이터가 있거나 서버 오류일 수 있어요)");
    }
  };

  const handleRemoveSubcategory = async () => {
    if (!form.category || !form.subcategory)
      return alert("삭제할 서브카테고리를 선택하세요.");
    if (!window.confirm(`'${form.category} > ${form.subcategory}' 를 삭제할까요?`)) return;

    try {
      await api.delete(
        `/categories/${encodeURIComponent(form.category)}/subcategories/${encodeURIComponent(form.subcategory)}`
      );

      const updated = categories.map((c) =>
        c.category === form.category
          ? {
              ...c,
              subcategories: (c.subcategories || []).filter(
                (s) => s !== form.subcategory
              ),
            }
          : c
      );
      setCategories(updated);

      const newSubs = (subcategories || []).filter(
        (s) => s !== form.subcategory
      );
      setSubcategories(newSubs);
      setForm((p) => ({ ...p, subcategory: newSubs[0] || "" }));
    } catch (err) {
      console.error(err);
      alert("서브카테고리 삭제 실패");
    }
  };

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
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={styles.input}
        />

        {/* 썸네일 업로드 (본문에 삽입되지 않음) */}
        <div className={styles.thumbnailUpload}>
          <label className={styles.thumbnailLabel}>썸네일 업로드</label>

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

        {/* 카테고리 & 서브카테고리 선택 */}
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
            {(subcategories || []).map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* 카테고리/서브카테고리 관리 */}
        <div className={styles.categoryManage}>
          <div className={styles.row}>
            <input
              type="text"
              placeholder="새 카테고리명 (선택)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className={styles.input}
            />
            <button type="button" onClick={handleAddCategory} className={styles.secondaryBtn}>
              카테고리 추가
            </button>
            <button type="button" onClick={handleRemoveCategory} className={styles.dangerBtn}>
              선택 카테고리 삭제
            </button>
          </div>

          <div className={styles.row}>
            <input
              type="text"
              placeholder="새 서브카테고리명"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              className={styles.input}
            />
            <button type="button" onClick={handleAddSubcategory} className={styles.secondaryBtn}>
              서브카테고리 추가
            </button>
            <button type="button" onClick={handleRemoveSubcategory} className={styles.dangerBtn}>
              선택 서브카테고리 삭제
            </button>
          </div>

          <p className={styles.help}>
            💡 팁: “새 카테고리명”과 “새 서브카테고리명”을 <strong>둘 다</strong> 입력하고
            <strong> [서브카테고리 추가]</strong>를 누르면, 해당 카테고리가 없으면 자동으로 만들고
            서브카테고리까지 한 번에 추가해요.
          </p>
        </div>

        {/* 에디터 */}
        <Editor
          ref={editorRef}
          initialValue=" "
          previewStyle="vertical"
          height="400px"
          initialEditType="wysiwyg"
          useCommandShortcut={true}
        />

        <div className={styles.btns}>
          <button type="submit" className={styles.submitBtn}>
            작성 완료
          </button>
          <button type="button" className={styles.cencelBtn} onClick={() => navigate("/")}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
