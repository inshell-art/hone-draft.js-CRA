
import { Record, List } from 'immutable';

// Define the Article as an Immutable Record
export const ArticleRecord = Record({
  articleId: '',        // Unique identifier for the article
  title: '',            // Title of the article
  date: '',             // Publication date of the article
  nonFacetContent: '',  // Content of the article that is not part of any facet
});
export interface Article extends ReturnType<typeof ArticleRecord> {}

// Define the Facet as an Immutable Record
export const FacetRecord = Record({
  facetId: '',          // Unique identifier for the facet
  title: '',            // Title of the facet
  content: '',          // Content of the facet
  date: ''              // Date when the facet was last updated or created
});
export interface Facet extends ReturnType<typeof FacetRecord> {}

// Define the ArticleFacetLink as an Immutable Record
export const ArticleFacetLinkRecord = Record({
  articleId: '',        // Article ID from the ArticleRecord
  facetId: '',          // Facet ID from the FacetRecord
  orderIndex: 0         // Order of the facet within the article
});
export interface ArticleFacetLink extends ReturnType<typeof ArticleFacetLinkRecord> {}
