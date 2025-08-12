import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      return alert("비밀번호는 최소 8자 이상이어야 합니다.");
    }
    if (password !== passwordConfirm) {
      return alert("비밀번호가 일치하지 않습니다.");
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return alert("올바른 이메일 형식을 입력하세요.");
    }

    try {
      const res = await axios.post("http://localhost:5000/api/register", {
        username,
        password,
        email,
      });
      alert("회원가입 성공!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "회원가입 실패");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>회원가입</h2>
        <form onSubmit={handleRegister} style={styles.form}>
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.loginBtn}>
            회원가입
          </button>
        </form>
        <div style={styles.footer}>
          <span style={styles.footerText}>이미 계정이 있으신가요?</span>
          <button
            style={styles.registerBtn}
            onClick={() => navigate("/login")}
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(to bottom, #a8cdedff, #fed6e3)",
    padding: "20px",
  },
  card: {
    background: "#fff",
    padding: "40px 30px",
    borderRadius: "20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    width: "100%",
    maxWidth: "380px",
    textAlign: "center",
  },
  title: {
    marginBottom: "25px",
    fontSize: "26px",
    fontWeight: "bold",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
    outline: "none",
    transition: "border 0.2s ease",
  },
  loginBtn: {
    padding: "12px",
    background: "linear-gradient(90deg, #6a82fb, #fc5c7d)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "5px",
  },
  footer: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  footerText: {
    fontSize: "14px",
    color: "#555",
  },
  registerBtn: {
    padding: "10px 14px",
    background: "#f78ca0",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    width: "100%",
    maxWidth: "200px",
  },
};

export default Register;
