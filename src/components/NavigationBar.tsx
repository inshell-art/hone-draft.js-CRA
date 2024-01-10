/**
 * navigation bar
 *
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

const NavigationBar = () => {
  const navigate = useNavigate();

  const createArticle = () => {
    const newArticleId = uuidv4();
    navigate(`/article/${newArticleId}`);
  };

  // when click "create article", execute createArticle function

  return (
    <div>
      <div className="nav-bar">
        <div className="nav-bar-left">
          <NavLink to="/FACETs" className={({ isActive }) => (isActive ? "active-facets" : "")}>
            $ FACETs &gt;
          </NavLink>
          <NavLink to="/" className={({ isActive }) => (isActive ? "active-articles" : "")}>
            &lt; Articles
          </NavLink>
        </div>
        <div className="nav-bar-right">
          <button className="create-article" onClick={createArticle}>
            create article
          </button>
        </div>
      </div>
    </div>
  );
};
export default NavigationBar;
