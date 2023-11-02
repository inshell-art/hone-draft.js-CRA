import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Article, Facet, ArticleContentRecord, ArticleRecord } from './types';
import { List } from 'immutable';
import { fetchAllArticles, getCurrentDate } from './utilities';

function ArticleList() {
    const [articles, setArticles] = useState<Article[]>([]);
    const navigate = useNavigate();

    const createNewArticle = () => {
        const id = new Date().getTime().toString();
        navigate(`/article/${id}`);// Transaction to save will be handled in Article.tsx to avoid empty articles creation
    };

    useEffect(() => {
        let fetchedArticles = fetchAllArticles();

        fetchedArticles = fetchedArticles.sort((a, b) => {
            const dateA = new Date(a.get('date'));
            const dateB = new Date(b.get('date'));
            return dateB.getTime() - dateA.getTime(); // Newest first
        });

        setArticles(fetchedArticles);
    }, []);


    return (
        <div>
            <div className="list-header">
                <div className="list-header-left">
                    <div className="list-header-title">My Hone</div>
                    <a href="/export" className="list-header-export">Export</a>
                </div>
                <button className="list-header-button" onClick={createNewArticle}>New Article</button>
            </div>
            <div>        <Link to="/facets">$ FACETs</Link>
            </div>
            <div className='list-article-container'>
                {articles.map((article) => (
                    <div className="list-article-item" key={article.get('id')}>
                        <div className="list-article-title">
                            <a href={`/article/${article.get('id')}`} >
                                {article.getIn(['articleContent', 'title']) || 'Untitled Article'}
                            </a>
                        </div>
                        <div className="list-article-date">
                            {article.get('date')}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

export default ArticleList;
