import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllArticles } from '../services/indexedDBService';
import { Article } from '../types/types';

const Articles = () => {
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
          <div key={article.articleId} className="articles-item">
            <Link to={`/article/${article.articleId}`}>{article.title ? article.title : 'Untitled article'} </Link>
            <div className="articles-date">{article.updateAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Articles;
