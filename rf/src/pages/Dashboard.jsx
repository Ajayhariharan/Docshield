import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Folder, Inbox, History, Home } from "lucide-react";
import FileUpload from "../components/FileUpload";
import DocumentList from "../components/DocumentList";
import SharedWithMe from "../components/SharedWithMe";
import AllShareHistories from "../components/AllShareHistories";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

const themeColors = {
  upload: "#d21919", // Dark Red
  documents: "#1976d2", // Dark Blue
  inbox: "#388e3c", // Dark Green
  history: "#7b1fa2", // Dark Purple
  welcome: "#156e80", // Fixed: remove invalid "ff"
};

const navTabs = [
  { key: "welcome", label: "Home", icon: <Home size={18} /> },
  { key: "upload", label: "Upload", icon: <Upload size={18} /> },
  { key: "documents", label: "My Docs", icon: <Folder size={18} /> },
  { key: "inbox", label: "Inbox", icon: <Inbox size={18} /> },
  { key: "history", label: "History", icon: <History size={18} /> },
];

export default function Dashboard() {
  const { logout, user } = useContext(AuthContext);
  const [refreshDocs, setRefreshDocs] = useState(false);

  // Load active tab from localStorage (prevents reset on refresh)
  const [activeTab, setActiveTab] = useState(
    localStorage.getItem("activeTab") || "welcome"
  );

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleInfoClick = () => {
    alert(
      "This is your secure DocShield dashboard where you can upload, manage, and share documents."
    );
  };

  const reload = () => setRefreshDocs((prev) => !prev);

  const activeColor = themeColors[activeTab] || "#666";

  const pageVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -30, transition: { duration: 0.3 } },
  };

  const renderContent = () => {
    switch (activeTab) {
      case "welcome":
        return (
          <motion.div
            key="welcome"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            style={{
              color: "#f5f5f5",
              textAlign: "center",
              margin: "120px auto",
              fontWeight: 700,
              maxWidth: 600,
              background: "rgba(0,0,0,0.09)",
              borderRadius: 20,
              padding: "40px",
              boxShadow: "0 0 32px rgba(0,0,0,0.3)",
            }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "16px" }}>
              Hi,&nbsp;
              <span style={styles.greeting}>{user?.username || "User"}</span>!
            </h2>

            <h2 style={{ color: "#fff", fontSize: "2rem", marginBottom: 12 }}>
              Welcome to <span style={{ color: "#c93fff" }}>DocShield</span>
            </h2>

            <p
              style={{
                color: "#ddd",
                fontSize: "1.25rem",
                marginTop: "18px",
                marginBottom: "0",
                fontWeight: 400,
                textShadow: "0 2px 6px #000a",
              }}
            >
              Manage your secure documents with ease.
              <br />
              Start Secure ur Docs!
            </p>
          </motion.div>
        );

      case "upload":
        return (
          <motion.div key="upload" {...pageVariants}>
            <FileUpload onUploadSuccess={reload} />
          </motion.div>
        );

      case "documents":
        return (
          <motion.div key="documents" {...pageVariants}>
            <h2
              style={{
                ...styles.sectionTitle,
                borderBottom: `2px solid ${activeColor}`,
              }}
            >
              My Documents
            </h2>
            <DocumentList refreshTrigger={refreshDocs} />
          </motion.div>
        );

      case "inbox":
        return (
          <motion.div key="inbox" {...pageVariants}>
            <h2
              style={{
                ...styles.sectionTitle,
                borderBottom: `2px solid ${activeColor}`,
              }}
            >
              Documents Shared With Me
            </h2>
            <SharedWithMe />
          </motion.div>
        );

      case "history":
        return (
          <motion.div key="history" {...pageVariants}>
            <h2
              style={{
                ...styles.sectionTitle,
                borderBottom: `2px solid ${activeColor}`,
              }}
            >
              History of Documents
            </h2>
            <AllShareHistories />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        ...styles.dashboardContainer,
        background: `linear-gradient(to top, ${activeColor}cc, #121212)`,
      }}
    >
      {/* Header */}
      <div style={{ ...styles.header, borderColor: activeColor }}>
        <span style={styles.headerTitle}>DocShield</span>

        <nav style={styles.headerNav}>
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="nav-btn"
                style={{
                  ...styles.navButton,
                  background: isActive ? themeColors[tab.key] : "transparent",
                  borderRadius: 20,
                  color: isActive ? "#fff" : "#ccc",
                  fontWeight: isActive ? 700 : 400,
                  padding: "6px 16px",
                  border: isActive
                    ? `1px solid ${themeColors[tab.key]}`
                    : "1px solid transparent",
                  boxShadow: isActive
                    ? `0 0 8px ${themeColors[tab.key]}80`
                    : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {tab.icon}
                  {tab.label}
                </div>
              </button>
            );
          })}
        </nav>

        <div style={styles.headerRight}>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
          <button style={styles.infoBtn} onClick={handleInfoClick}>
            i
          </button>
        </div>
      </div>

      <main style={styles.content}>
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
    </div>
  );
}

const styles = {
  dashboardContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
    position: "relative",
    color: "#eee",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  greeting: {
    background:
      "linear-gradient(270deg, #ff6b6b, #d400ff, #6bffb0, #4facfe, #ff6b6b)",
    backgroundSize: "800% 800%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animation: "gradientFlow 12s ease infinite",
  },
  header: {
    position: "fixed",
    top: "10px",
    left: "10px",
    right: "10px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    borderRadius: "40px",
    zIndex: 20,
    background: "rgba(30, 30, 30, 0.6)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "2px solid rgba(255, 255, 255, 0.1)",
    transition: "border-color 0.3s ease",
  },
  headerTitle: {
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
    background:
      "linear-gradient(270deg, #ff6b6b, #f8e71c, #6bffb0, #4facfe, #ff6b6b)",
    backgroundSize: "800% 800%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animation: "gradientFlow 12s ease infinite",
  },
  headerNav: {
    display: "flex",
    gap: 16,
    flex: 1,
    justifyContent: "center",
  },
  navButton: {
    background: "transparent",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    color: "#ccc",
    userSelect: "none",
    transition: "transform 0.2s ease",
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: "20px",
  },
  headerRight: {
    display: "flex",
    gap: 12,
  },
  logoutBtn: {
    backgroundColor: "#ff0000",
    border: "none",
    padding: "8px 14px",
    borderRadius: 20,
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background-color 0.3s",
  },
  infoBtn: {
    backgroundColor: "#0080ff",
    border: "none",
    width: 36,
    height: 36,
    borderRadius: "50%",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  },
  content: {
    paddingTop: 100,
    paddingLeft: 24,
    paddingRight: 24,
    flex: 1,
    overflowY: "auto",
    background: "transparent",
  },
};

/* Global CSS Injection */
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(
  `
  .nav-btn:hover {
    transform: scale(1.1);
  }
`,
  styleSheet.cssRules.length
);

styleSheet.insertRule(
  `
  @keyframes gradientFlow {
    0% { background-position: 0% 50% }
    50% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
  }
`,
  styleSheet.cssRules.length
);
