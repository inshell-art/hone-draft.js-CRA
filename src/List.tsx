import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Article } from './types';



function List() {
    const [articles, setArticles] = useState<Article[]>([]);
    const navigate = useNavigate();

    const fetchAllArticles = () => {
        const fetchedArticles: Article[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const article = JSON.parse(localStorage.getItem(key)!);
                fetchedArticles.push(article);
            }
        }
        return fetchedArticles;
    };

    const createNewArticle = () => {
        const id = new Date().getTime().toString();
        const newArticle: Article = {
            id,
            date: id,
            articleContent: {
                title: '',
                facets: [],
                nonFacet: ''
            }  // Initial content structure (can be modified)
        };
        localStorage.setItem(id, JSON.stringify(newArticle));
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
            <ul>
                {articles.map((article) => (
                    <li key={article.id}>
                        <a href={`/article/${article.id}`} target="_blank" rel="noopener noreferrer">
                            - {article.date}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default List;
