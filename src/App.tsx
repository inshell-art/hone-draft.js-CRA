import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import HoneEditor from "./components/HoneEditor";
import Articles from "./components/Articles";
import FACETs from "./components/FACETs";
import "./App.css";
import { ErrorBoundary } from "react-error-boundary"; // the lib has useErrorBoundary hook and HOC too, check them out when testing environment is ready
import { Link } from "react-router-dom";
import Lists from "./components/NavigationBar";
import NavigationBar from "./components/NavigationBar";

const App = () => {
  return (
    <ErrorBoundary fallback={<div>Something went wrong, please refresh or come back later.</div>}>
      <div className="entire">
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <NavigationBar />
                  <Articles />
                </>
              }
            />
            <Route
              path="/FACETs"
              element={
                <>
                  <NavigationBar />
                  <FACETs />
                </>
              }
            />
            <Route path="/article/:articleId" element={<HoneEditor />} />
          </Routes>
        </Router>
      </div>
    </ErrorBoundary>
  );
};

export default App;
