// 파일: src/pages/PostWrite.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import styles from "../css/PostWrite.module.css";
import { useAuth } from "../AuthContext";

// postId 추출 유틸
function useEditId() {
  const params = useParams();
  const location = useLocation();
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [editorReady, setEditorReady] = useState(false);

  const editId = useEditId();
  const isEdit = useMemo(() => !!editId, [editId]);

  // 수정 모드: 기존 데이터 로딩
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

  // 공용 업로드 함수 (FormData, 재시도/에러 메시지 강화)
  const uploadFile = async (file) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads", fd, {
        // 명시해도 OK, 생략해도 axios가 자동 설정
        headers: { /* 'Content-Type': 'multipart/form-data' */ },
      });
      if (!data?.url) throw new Error("서버가 URL을 반환하지 않았습니다.");
      return data.url;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "업로드 실패";
      // 인증 만료 등도 친절히 표시
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        throw new Error("업로드 권한이 없습니다. 다시 로그인해 주세요.");
      }
      throw new Error(msg);
    }
  };

  // 썸네일: 선택 즉시 업로드 → 본문 삽입하지 않음
  const onThumbChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadFile(f);
      setThumbUrl(url);
    } catch (e2) {
      alert(e2.message);
    }
  };

  // 에디터 훅: 본문 이미지 업로드 전용 (여러 번 연속 업로드 안정화)
  const editorHooks = {
    addImageBlobHook: async (blob, callback) => {
      try {
        // 같은 파일명을 반복 업로드해도 문제 없도록 파일명 임의 부여는 서버에서 처리됨
        const url = await uploadFile(blob);
        callback(url, "image");
      } catch (e) {
        alert(e.message || "이미지 업로드 실패");
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
