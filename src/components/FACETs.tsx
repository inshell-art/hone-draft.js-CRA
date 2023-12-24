import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facet, Article } from '../types/types';
import { fetchAllArticles } from '../utils/utilities';
/*
function FACETs() {
    const [facets, setFacets] = useState<Facet[]>([]);

    useEffect(() => {
        const allArticles = fetchAllArticles(); // Assume this function fetches all articles
        let allFacets: Facet[] = [];

        allArticles.forEach((article: Article) => {
            const articleFacets = article.getIn(['articleContent', 'facets']);
            if (articleFacets) {
                articleFacets.forEach((facet: Facet) => {
                    const facetRecord = FacetRecord(facet);
                    const updatedFacetRecord = facetRecord
                        .set('articleId', article.get('id'))
                        .set('articleTitle', article.getIn(['articleContent', 'title'])); // Store the article title
                    allFacets.push(updatedFacetRecord);
                });
            }
        });
        setFacets(allFacets);
    }, []);

    return (
        <div className="facet-container">
            <div className="facet-title">$ FACETs</div>
            {facets.map((facet, index) => (
                <div key={index} className="facet-item">
                    <div className="facet-subtitle">
                        {facet.get('title')}
                    </div>
                    <div className="facet-link">
                        <Link to={`/article/${facet.get('articleId')}`}>
                            {facet.get('articleTitle') || 'Untitled Article'}
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default FACETs;
*/