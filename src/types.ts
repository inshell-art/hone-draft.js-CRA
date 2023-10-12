// Define the interface for a Facet
export interface Facet {
    title: string;
    content: string;
  }
  
  // Define the interface for ArticleContent
  export interface ArticleContent {
    title: string;
    nonFacet: string;
    facets: Facet[];
  }
  
  // Define the interface for an Article
  export interface Article {
    id: string;
    date: string;
    articleContent: ArticleContent | null;
  }
  