import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import styles from "../css/PostWrite.module.css";
import { useAuth } from "../AuthContext";

// ● 유틸: 경로에서 postId 추출 (여러 라우팅 형태 대응)
function useEditId() {
  const params = useParams();            // /write/:postId 형태
  const location = useLocation();        // /write?postId=123 또는 /write/postId=123 형태
  const q = new URLSearchParams(location.search);
  const byQuery = q.get("postId");

  let byPathEq = null;
  const m = location.pathname.match(/postId=(\d+)/i);
  if (m) byPathEq = m[1];

  return params.postId || byQuery || byPathEq || null;
}

export default function PostWrite() {
  const navigate = useNavigate();
  const { user } = useAuth(); // 필요시 권한 체크 (ex. master만 작성)
  const editorRef = useRef(null);

  // 폼 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbUrl, setThumbUrl] = useState("");

  // 수정 모드 판단
  const editId = useEditId();
  const isEdit = useMemo(() => !!editId, [editId]);

  // (선택) 수정 모드일 때 기존 글 내용 불러오기
  // ※ 현재 백엔드는 id 단독 조회 엔드포인트가 없고,
  //   상세 조회가 /api/posts/:category/:subcategory/:postId 형태입니다.
  //   필요하면 글쓰기 라우트로 올 때 state로 기존 데이터 전달하거나,
  //   별도 by-id API를 추가해 주세요.
  useEffect(() => {
    // 예: location.state로 넘어왔다면 값 세팅 (없으면 스킵)
    // const state = location.state as any;
    // if (isEdit && state?.post) { ...set states... }
  }, [isEdit]);

  // 파일 업로드 (썸네일/본문 공용)
  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    // Authorization 헤더는 utils/api 인터셉터에서 자동 첨부됩니다.
    const { data } = await api.post("/uploads", fd /* , {
      headers: { "Content-Type": "multipart/form-data" }, // 지정 안 해도 axios가 boundary 포함 설정
    } */);
    // 서버 응답: { url: "https://.../uploads/YYYY/MM/xxxxx.ext" }
    return data.url;
  };

  // 썸네일 업로드
  const handleThumbChoose = (e) => {
    const f = e.target.files?.[0];
    setThumbFile(f || null);
  };

  const handleThumbUpload = async () => {
    try {
      if (!thumbFile) return alert("썸네일 파일을 선택하세요.");
      const url = await uploadFile(thumbFile);
      setThumbUrl(url);
    } catch (e) {
      console.error(e);
      alert("썸네일 업로드 실패");
    }
  };

  // 에디터 이미지 업로드 훅
  const editorHooks = {
    addImageBlobHook: async (blob, callback) => {
      try {
        const url = await uploadFile(blob);
        callback(url, "image"); // 에디터에 삽입
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
          <label className={styles.label}>썸네일</label>
          <div className={styles.thumbRow}>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbChoose}
            />
            <button type="button" onClick={handleThumbUpload}>
              업로드
            </button>
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
        <Editor
          ref={editorRef}
          initialValue=""
          previewStyle="vertical"
          height="600px"
          initialEditType="wysiwyg"
          useCommandShortcut={true}
          hooks={editorHooks}
        />
      </div>
    </div>
  );
}
