import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllArticles } from "../services/indexedDBService";
import { Article } from "../types/types";

const Articles = () => {
  const navigate = useNavigate();

  const createNewArticle = () => {
    const newArticleId = uuidv4();
    navigate(`/article/${newArticleId}`); // Transaction to save will be handled in Article.tsx to avoid empty articles creation
  };

  // fetch all articles
  const [articles, setArticles] = useState<Article[]>([]);
  useEffect(() => {
    fetchAllArticles().then((articles) => {
      setArticles(articles);
    });
  }, []);

  return (
    <div>
      <div>
        {articles.map((article) => (
          <div className="articles-item">
            <Link to={`/article/${article.articleId}`}>{article.title}</Link>
            <div className="articles-date">{article.updateAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Articles;
