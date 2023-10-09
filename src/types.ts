// types.ts

// Define the type for content blocks, which can be either a string or a Facet object
export type ArticleContentBlock = string | Facet;

// Define the interface for a Facet
export interface Facet {
  title: string;
  content: string;
}

// Define the interface for an Article
export interface Article {
  id: string;
  title: string;
  content: ArticleContentBlock[];
  date: string;
}
