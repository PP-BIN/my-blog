import { Routes, Route } from "react-router-dom";
import HomeLayout from "./pages/HomeLayout";
import MainContent from "./pages/MainContent";
import PostList from "./pages/PostList";
import PostDetail from "./pages/PostDetail";
import PostWrite from "./pages/PostWrite"; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeLayout />}>
        <Route index element={<MainContent />} />
        <Route path=":category/:subcategory" element={<PostList />} />
        <Route path=":category/:subcategory/:postId" element={<PostDetail />} />
        <Route path="write/onlybin" element={<PostWrite />} />
      </Route>
    </Routes>
  );
}

export default App;

