/**
 * navigation bar is on the top of the page, it contains 4 parts:
 * 1. FACETs
 * 2. Articles
 * 3. Hone (as the flash title of the page)
 * 4. create article
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

const NavigationBar = () => {
  const navigate = useNavigate();

  const createArticle = () => {
    const newArticleId = uuidv4();
    navigate(`/article/${newArticleId}`);
  };

  return (
    <div>
      <div className="nav-bar">
        <div className="nav-FACETs">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'active-facets' : '')}>
            $ FACETs &gt;
          </NavLink>
        </div>
        <div className="nav-Articles">
          <NavLink to="/Articles" className={({ isActive }) => (isActive ? 'active-articles' : '')}>
            &lt; Articles
          </NavLink>
        </div>
        <div className="nav-Hone">
          <span className="nav-Hone-word">Hone</span>
          <span className="nav-Hone-bar1">▮</span>
          <span className="nav-Hone-bar2">▮</span>
          <span className="nav-Hone-bar3">▮</span>
          <span className="nav-Hone-bar4">▮</span>
        </div>
        <div className="nav-create-article">
          <button className="btn-create-article" onClick={createArticle}>
            create article
          </button>
        </div>
      </div>
    </div>
  );
};
export default NavigationBar;
