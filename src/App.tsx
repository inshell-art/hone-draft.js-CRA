import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import HoneEditor from "./components/HoneEditor";
import Articles from "./components/Articles";
import FACETs from "./components/FACETs";
import "./App.css";
import { ErrorBoundary } from "react-error-boundary"; // the lib has useErrorBoundary hook and HOC too, check them out when testing environment is ready
import { Link } from "react-router-dom";

const App = () => {
  return (
    <ErrorBoundary fallback={<div>Something went wrong, please refresh or come back later.</div>}>
      <Router>
        <div className="nav-bar">
          <div className="nav-bar-left">
            <NavLink to="/FACETs" className={({ isActive }) => (isActive ? "nav-link-active" : "")}>
              $ FACETs &gt;
            </NavLink>
            <NavLink to="/" className={({ isActive }) => (isActive ? "nav-active-articles" : "")}>
              &lt; Articles
            </NavLink>
          </div>
          <div className="nav-bar-right">
            <Link to="/article/new">create article</Link>
          </div>
        </div>

        <div className="main">
          <Routes>
            <Route path="/" element={<Articles />} />
            <Route path="/article/:id" element={<HoneEditor />} />
            <Route path="/FACETs" element={<FACETs />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
