import { useEffect, useState } from "react";
import axios from "axios";
import FeaturedPost from "../components/FeaturedPost";

export default function MainContent() {
  const [featuredData, setFeaturedData] = useState({});

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/posts/featured")
      .then((res) => setFeaturedData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <h2
        style={{
          backgroundColor: "white",
          padding: "0.5rem 2rem",
          borderRadius: "15px",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
          marginBottom: "1rem",
          marginTop: "0"
        }}
      >
        Recent Post
      </h2>

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
