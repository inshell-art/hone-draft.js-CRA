import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import React from "react";
import { Link } from "react-router-dom";

const MyHone = () => {
  const navigate = useNavigate();

  const createNewArticle = () => {
    const newArticleId = uuidv4();
    navigate(`/article/${newArticleId}`); // Transaction to save will be handled in Article.tsx to avoid empty articles creation
  };

  return (
    <div>
      <div className="header">
        <div className="header-title">My Hone</div>
        <button className="create-article-btn" onClick={createNewArticle}>
          New Article
        </button>
      </div>
      <Link to="/FACETs">FACETs</Link>
    </div>
  );
};

export default MyHone;
