import { useEffect, useState } from "react";
import api from "../api";
import FeaturedPost from "../components/FeaturedPost";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function MainContent() {
  const { user } = useAuth();
  const [featuredData, setFeaturedData] = useState({});

  useEffect(() => {
    api
      .get("/posts/featured")
      .then((res) => setFeaturedData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between", // 좌우 끝으로 배치
        alignItems: "center", // 세로 중앙 정렬
        backgroundColor: "white",
        padding: "0.5rem 2rem",
        borderRadius: "15px",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        marginBottom: "1rem",
        marginTop: "0"
      }}
    >
      <h2 style={{ margin: 0 }}>Recent Post</h2>
  
      {user?.role === "master" && (
        <Link
          to="/write/"
          style={{
            backgroundColor: "#4a90e2",
            color: "white",
            padding: "8px 14px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "600",
            transition: "background-color 0.25s ease-in-out"
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#357ab8"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#4a90e2"}
        >
          글쓰기
        </Link>
      )}
    </div>
      {Object.keys(featuredData).map((category) => (
        <FeaturedPost
          key={category}
          title={category}
          posts={featuredData[category].map((post) => ({
            id: post.id,
            description: post.title,
            thumbnail: post.thumbnail,
            category: category,
            subcategory: post.subcategory,
          }))}
        />
      ))}
    </>
  );
}
