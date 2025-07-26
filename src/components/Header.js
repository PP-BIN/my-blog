import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  return (
    <header
      style={{
        fontSize: "1.8rem",
        fontWeight: "bold",
        textAlign: "center",
        cursor: "pointer",
      }}
      onClick={() => navigate("/")}
    >
      BINARY
    </header>
  );
}

export default Header;
