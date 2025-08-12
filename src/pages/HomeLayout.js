import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import MusicPlayer from "../components/MusicPlayer";
import { Outlet } from "react-router-dom";
import styles from "../css/Home.module.css";

export default function HomeLayout() {
  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.contentWrapper}>
        <div className={styles.sidebar}>
          <Sidebar />
        </div>
        <div className={styles.mainContent}>
          <Outlet />
        </div>
        <div className={styles.musicPlayerWrapper}>
          <MusicPlayer />
        </div>
      </div>
      <Footer/>
    </div>
  );
}
