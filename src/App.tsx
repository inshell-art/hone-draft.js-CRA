import "./App.css";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HoneEditor from "./components/HoneEditor";
import MyHone from "./components/MyHone";
// import FACETs from './FACETs';
import { ErrorBoundary } from "react-error-boundary"; // the lib has useErrorBoundary hook and HOC too, check them out when testing environment is ready

const App = () => {
  return (
    <ErrorBoundary fallback={<div>Something went wrong, please refresh or come back later.</div>}>
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<MyHone />} />
            <Route path="/article/:articleId" element={<HoneEditor />} />
            {/*<Route path="/FACETs" element={<FACETs />} />*/}
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
