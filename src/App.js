import { Routes, Route, Navigate } from "react-router-dom";
import HomeLayout from "./pages/HomeLayout";
import MainContent from "./pages/MainContent";
import PostList from "./pages/PostList";
import PostDetail from "./pages/PostDetail";
import PostWrite from "./pages/PostWrite";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StarCursor from "./components/StarCursor";
import "./index.css";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

function App() {
   return (

   <>
    <StarCursor />
     <Routes>
         <Route path="/login" element={<Login />} />
         <Route path="/register" element={<Register />} />
 
         <Route
           path="/"
           element={
             <PrivateRoute>
               <HomeLayout />
             </PrivateRoute>
           }
         >
           <Route index element={<MainContent />} />
           <Route path=":category/:subcategory" element={<PostList />} />
           <Route path=":category/:subcategory/:postId" element={<PostDetail />} />
           <Route path="write/" element={<PostWrite />} />
           <Route path="edit/:postId" element={<PostWrite />} />
         </Route>
      </Routes>
    </>
   );
 }

export default App;
