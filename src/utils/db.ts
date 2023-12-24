import Dexie from 'dexie';
import { EditorState } from 'draft-js';
import { ARTICLE_TITLE, FACET_TITLE } from './utilities';
import { Article, Facet, ArticleFacetLink } from '../types/types'


class MyDatabase extends Dexie {
    articles: Dexie.Table<Article, string>; // `string` is the type of the primary key
    facets: Dexie.Table<Facet, string>;
    articleFacetLinks: Dexie.Table<ArticleFacetLink, [string, string]>; // Assuming a composite primary key

    constructor() {
        super("MyDatabase");
        this.version(1).stores({
            articles: 'articleId, date, title', // Define indexes as needed
            facets: 'facetId, date, title',
            articleFacetLinks: '[articleId+facetId], articleId, facetId, orderIndex' // Composite key + additional indexes
        });

        this.articles = this.table('articles');
        this.facets = this.table('facets');
        this.articleFacetLinks = this.table('articleFacetLinks');

        function editorStateConverter(editorState: EditorState) {
            const contentState = editorState.getCurrentContent();
            const blocks = contentState.getBlocksAsArray();
        
            let currentArticle = null;
            let currentFacet = null;
            let articleList = [];
            let facetList = [];
            let articleFacetLinks = [];
            let facetOrderIndex = 0;
        
            blocks.forEach(block => {
                const text = block.getText();
                const blockType = block.getType();
        
                switch (blockType) {
                    case ARTICLE_TITLE:
                        currentArticle = { title: text, nonFacetContent: '' };
                        articleList.push(currentArticle);
                        facetOrderIndex = 0; // Reset for each new article
                        break;
                    case FACET_TITLE:
                        currentFacet = { title: text, content: '' };
                        facetList.push(currentFacet);
                        if (currentArticle) {
                            articleFacetLinks.push({
                                articleId: currentArticle.articleId, // Assuming some method to generate unique IDs
                                facetId: currentFacet.facetId, // Ditto for facet IDs
                                orderIndex: facetOrderIndex++
                            });
                        }
                        break;
                    default:
                        if (currentFacet) {
                            currentFacet.content += text + '\n';
                        } else if (currentArticle) {
                            currentArticle.nonFacetContent += text + '\n';
                        }
                        break;
                }
            });
        
            return { articles: articleList, facets: facetList, links: articleFacetLinks };
        }
        
    }
}

const db = new MyDatabase();
