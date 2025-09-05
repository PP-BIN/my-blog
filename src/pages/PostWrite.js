// 파일: src/pages/PostWrite.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import styles from "../css/PostWrite.module.css";
import { useAuth } from "../AuthContext";

function useEditId() {
  const params = useParams();
  const location = useLocation();
  const q = new URLSearchParams(location.search);
  const byQuery = q.get("postId");
  const m = location.pathname.match(/postId=(\d+)/i);
  const byPathEq = m ? m[1] : null;
  return params.postId || byQuery || byPathEq || null;
}

// ▼ 추가: 브라우저에서 이미지 리사이즈/압축
async function compressImage(file, {
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85,
  outputType = "image/webp", // webp가 작게 나옴. 호환이 문제면 "image/jpeg"
} = {}) {
  // 이미지 파일이 아니면 그대로 반환
  if (!file.type.startsWith("image/")) return file;

  // 2MB 미만은 그냥 올리고 싶다면 아래 조건 해제/조절
  // if (file.size < 2 * 1024 * 1024) return file;

  const img = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    image.src = url;
  });

  let { width, height } = img;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), outputType, quality)
  );

  if (!blob) return file; // 폴백: 압축 실패 시 원본 전송
  const ext = outputType.includes("webp") ? "webp" : (outputType.includes("jpeg") ? "jpg" : "png");
  const newName = (file.name.replace(/\.[^.]+$/, "") || "image") + "." + ext;
  return new File([blob], newName, { type: outputType, lastModified: Date.now() });
}

export default function PostWrite() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const editorRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [editorReady, setEditorReady] = useState(false);

  const editId = useEditId();
  const isEdit = useMemo(() => !!editId, [editId]);

  // 수정 모드: 기존 글 로딩
  useEffect(() => {
    let ignore = false;
    (async () => {
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
    })();
    return () => { ignore = true; };
  }, [isEdit, editId, navigate]);

  // 공용 업로드 함수: 압축 -> 업로드
  const uploadImage = async (file) => {
    // 1) 클라이언트에서 리사이즈/압축
    const compressed = await compressImage(file, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.85,
      outputType: "image/webp",
    });

    // 2) 서버 전송
    const fd = new FormData();
    fd.append("file", compressed);
    const { data } = await api.post("/uploads", fd /*, { headers: { 'Content-Type': 'multipart/form-data' } }*/);
    if (!data?.url) throw new Error("서버가 URL을 반환하지 않았습니다.");
    return data.url;
  };

  // 썸네일: 선택 즉시 업로드(본문에 삽입하지 않음)
  const onThumbChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadImage(f);
      setThumbUrl(url);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "썸네일 업로드 실패");
    }
  };

  // 에디터 이미지 훅: 본문 삽입 전용(여러 번 연속 업로드 안정화)
  const editorHooks = {
    addImageBlobHook: async (blob, callback) => {
      try {
        const url = await uploadImage(blob);
        callback(url, "image");
      } catch (e) {
        alert(e?.response?.data?.message || e.message || "이미지 업로드 실패");
      }
    },
  };

  const handleSubmit = async () => {
    const editor = editorRef.current?.getInstance();
    const html = editor ? editor.getHTML() : "";

    if (!title.trim()) return alert("제목을 입력하세요.");
    if (!html.trim()) return alert("내용을 입력하세요.");

    const payload = {
      title: title.trim(),
      description: description.trim(),
      content: html,
      category: (category || "").trim(),
      subcategory: (subcategory || "").trim(),
      thumbnail: thumbUrl || "",
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
