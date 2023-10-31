import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Article, Facet, ArticleContentRecord, ArticleRecord } from './types';
import { List } from 'immutable';
import './App.css';

function ArticleList() {
    const [articles, setArticles] = useState<Article[]>([]);
    const navigate = useNavigate();

    const fetchAllArticles = () => {
        const fetchedArticles: Article[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const articleJSON = localStorage.getItem(key)!;
                const articlePlain = JSON.parse(articleJSON);
                const articleImmutable = ArticleRecord({
                    id: articlePlain.id,
                    date: articlePlain.date,
                    articleContent: ArticleContentRecord({
                        title: articlePlain.articleContent.title,
                        nonFacet: articlePlain.articleContent.nonFacet,
                        facets: List(articlePlain.articleContent.facets),  // Convert array to Immutable List
                    }),
                });
                fetchedArticles.push(articleImmutable);
            }
        }
        return fetchedArticles;
    };

    const createNewArticle = () => {
        const id = new Date().getTime().toString();
        const newArticle = ArticleRecord({
            id,
            date: id,
            articleContent: ArticleContentRecord({
                title: '',
                nonFacet: '',
                facets: List<Facet>(),
            })  // Using Immutable Record to initialize articleContent
        });  // Using Immutable Record to initialize newArticle

        localStorage.setItem(id, JSON.stringify(newArticle.toJS()));  // Convert Immutable Record to JS object for storage
        const newTab = window.open(`/article/${id}`, '_blank');
        newTab?.focus();
    };

    useEffect(() => {
        const fetchedArticles = fetchAllArticles();
        setArticles(fetchedArticles);
    }, []);

    return (
        <div>
            <button onClick={createNewArticle}>Create Article</button>
            <div>
                {articles.map((article) => (
                    <div key={article.get('id')} style={{ marginBottom: '20px' }}>
                        <a
                            href={`/article/${article.get('id')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                        >
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'blue' }}>
                                {article.getIn(['articleContent', 'title']) || 'Untitled Article'}
                            </div>
                        </a>
                        <div style={{ fontSize: '14px', color: 'grey' }}>
                            - {article.get('date')}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

export default ArticleList;
