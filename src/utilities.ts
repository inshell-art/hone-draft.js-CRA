// articleUtilities.ts
import { Article } from './types';
import { List } from 'immutable';

export const fetchAllArticles = () => {
/*    const fetchedArticles: Article[] = [];
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
    */
};

export const getCurrentDate = (): string => {
    const today = new Date();
    const dateStr = `${today.getFullYear()} ${today.toLocaleString('default', { month: 'short' })} ${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    return dateStr;
};

export const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
};
