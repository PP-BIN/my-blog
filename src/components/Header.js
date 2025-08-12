import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext"; // 경로 맞게 수정

function Header() {
  const navigate = useNavigate();
  const { user, setUser, setToken } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    navigate("/login");
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        background: "rgba(255, 255, 255, 0.3)", // 반투명
        backdropFilter: "blur(10px)", // 유리효과
        WebkitBackdropFilter: "blur(10px)", // 사파리 호환
        borderBottom: "1px solid rgba(255, 255, 255, 0.4)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* 로고 */}
      <div
        style={{
          fontSize: "1.8rem",
          fontWeight: "bold",
          cursor: "pointer",
          color: "#003344",
          letterSpacing: "1px",
        }}
        onClick={() => navigate("/")}
      >
        BINARY
      </div>

      {/* 유저 인사 + 로그아웃 */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "1rem", color: "#003344" }}>
            {user.username || user.id || "사용자"}님 안녕하세요!
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 14px",
              background: "rgba(255, 99, 99, 0.4)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#fff",
              transition: "all 0.3s ease",
              backdropFilter: "blur(5px)",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "rgba(255, 99, 99, 0.6)";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "rgba(255, 99, 99, 0.4)";
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
