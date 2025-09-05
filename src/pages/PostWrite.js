import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import styles from "../css/PostWrite.module.css";
import { useAuth } from "../AuthContext";

// URL/경로에서 postId 추출 (여러 라우팅 패턴 대응)
function useEditId() {
  const params = useParams();            // /write/:postId 형태
  const location = useLocation();        // /write?postId=123 또는 /write/postId=123
  const q = new URLSearchParams(location.search);
  const byQuery = q.get("postId");
  const m = location.pathname.match(/postId=(\d+)/i);
  const byPathEq = m ? m[1] : null;
  return params.postId || byQuery || byPathEq || null;
}

export default function PostWrite() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const editorRef = useRef(null);

  // 폼 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");

  // 에디터 초기값/로딩 제어
  const [initialContent, setInitialContent] = useState("");
  const [editorReady, setEditorReady] = useState(false);

  // 썸네일 파일(선택 즉시 업로드)
  const [thumbFile, setThumbFile] = useState(null);

  // 수정 모드 판정
  const editId = useEditId();
  const isEdit = useMemo(() => !!editId, [editId]);

  // 수정 모드면 기존 글 불러오기
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!isEdit) {
        setInitialContent("");
        setEditorReady(true);
        return;
      }
      try {
        const { data } = await api.get(`/posts/id/${editId}`);
        if (ignore) return;
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || "");
        setSubcategory(data.subcategory || "");
        setThumbUrl(data.thumbnail || "");
        setInitialContent(data.content || "");
        setEditorReady(true);
      } catch (e) {
        console.error(e);
        alert("글 정보를 불러오지 못했습니다.");
        navigate(-1);
      }
    }
    load();
    return () => { ignore = true; };
  }, [isEdit, editId, navigate]);

  // 공용 업로드 함수 (썸네일/본문 이미지 모두 사용)
  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/uploads", fd);
    return data.url;
  };

  // 썸네일 선택 시 자동 업로드 (본문에는 삽입하지 않음)
  const onThumbChange = async (e) => {
    const f = e.target.files?.[0];
    setThumbFile(f || null);
    if (!f) return;
    try {
      const url = await uploadFile(f);
      setThumbUrl(url); // 미리보기/저장용으로만 사용 (본문엔 삽입 X)
    } catch (err) {
      console.error(err);
      alert("썸네일 업로드 실패");
    }
  };

  // 에디터 이미지 업로드 훅 (본문 삽입 전용)
  const editorHooks = {
    addImageBlobHook: async (blob, callback) => {
      try {
        const url = await uploadFile(blob);
        callback(url, "image"); // 본문에만 삽입
      } catch (e) {
        console.error(e);
        alert("이미지 업로드 실패");
      }
    },
  };

  // 저장(작성/수정)
  const handleSubmit = async () => {
    const editor = editorRef.current?.getInstance();
    const html = editor ? editor.getHTML() : "";

    if (!title.trim()) return alert("제목을 입력하세요.");
    if (!html.trim()) return alert("내용을 입력하세요.");

    const payload = {
      title: title.trim(),
      description: description.trim(),
      content: html,                  // 본문 HTML
      category: (category || "").trim(),
      subcategory: (subcategory || "").trim(),
      thumbnail: thumbUrl || "",      // 썸네일은 본문과 독립
    };

    try {
      if (isEdit) {
        await api.put(`/posts/${editId}`, payload);
        alert("게시글이 수정되었습니다.");
      } else {
        await api.post("/posts", payload);
        alert("게시글 작성 완료");
      }
      navigate(-1);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "저장에 실패했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{isEdit ? "글 수정" : "글 작성"}</h1>
        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← 돌아가기
          </button>
          <button className={styles.saveBtn} onClick={handleSubmit}>
            {isEdit ? "수정 저장" : "작성 완료"}
          </button>
        </div>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.label}>
          제목
          <input
            className={styles.input}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            required
          />
        </label>

        <label className={styles.label}>
          설명(요약)
          <input
            className={styles.input}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="목록 카드에 보일 간단한 설명"
          />
        </label>

        <div className={styles.row2}>
          <label className={styles.label}>
            카테고리
            <input
              className={styles.input}
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="예) Study"
            />
          </label>

          <label className={styles.label}>
            서브카테고리
            <input
              className={styles.input}
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="예) react.js"
            />
          </label>
        </div>

        <div className={styles.thumbBlock}>
          <label className={styles.label}>썸네일 (본문에 삽입되지 않습니다)</label>
          <div className={styles.thumbRow}>
            <input type="file" accept="image/*" onChange={onThumbChange} />
          </div>
          {thumbUrl && (
            <img
              src={thumbUrl}
              alt="thumbnail"
              className={styles.thumbnailPreview}
            />
          )}
        </div>
      </div>

      <div className={styles.editorWrap}>
        {/* 데이터 로드 전에는 에디터를 렌더하지 않아 깜빡임/깨짐 방지 */}
        {editorReady ? (
          <Editor
            ref={editorRef}
            initialValue={initialContent}
            previewStyle="vertical"
            height="600px"
            initialEditType="wysiwyg"
            useCommandShortcut={true}
            hooks={editorHooks}
          />
        ) : (
          <div className={styles.loading}>로딩 중...</div>
        )}
      </div>
    </div>
  );
}
