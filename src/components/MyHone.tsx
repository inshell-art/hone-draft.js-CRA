import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useSelector } from "react-redux";
import React from "react";
import { RootState } from "../store/store";

const MyHone = () => {
  const navigate = useNavigate();

  const createNewArticle = () => {
    const newArticleId = uuidv4();
    navigate(`/article/${newArticleId}`); // Transaction to save will be handled in Article.tsx to avoid empty articles creation
  };

  const articles = useSelector((state: RootState) => state.hone.articles);
  console.log("articles", articles);

  return (
    <div>
      <div className="header">
        <div className="header-title">My Hone</div>
        <button className="create-article-btn" onClick={createNewArticle}>
          New Article
        </button>
      </div>
      <div className="articles-list">
        {Object.values(articles).map((article) => (
          <div key={article.articleId}>{article.title || "Untitled Article"}</div>
        ))}
        11
      </div>{" "}
    </div>
  );
};

export default MyHone;
