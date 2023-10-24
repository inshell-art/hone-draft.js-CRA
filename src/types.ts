import { List, Record } from 'immutable';

// Define the Facet as an Immutable Record
export const FacetRecord = Record({
  title: '',
  content: '',
});
export interface Facet extends ReturnType<typeof FacetRecord> {}

// Define the ArticleContent as an Immutable Record
export const ArticleContentRecord = Record({
  title: '',
  nonFacet: '',
  facets: List<Facet>(),
});
export interface ArticleContent extends ReturnType<typeof ArticleContentRecord> {}

// Define the Article as an Immutable Record
export const ArticleRecord = Record({
  id: '',
  date: '',
  articleContent: null as ArticleContent | null,
});
export interface Article extends ReturnType<typeof ArticleRecord> {}