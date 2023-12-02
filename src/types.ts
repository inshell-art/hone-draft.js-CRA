import React from 'react';

// #region interfaces for the data model
export type Article = {
  articleId: string;
  date?: string;
  title?: string;
  nonFacetContent?: string;
}

export type Facet = {
  facetId: string;
  date?: string;
  title: string;
  content?: string;
}

export type ArticleFacetLink = {
  articleId: string;
  facetId: string;
  orderIndex: number;
}

export type Storage = {
  articles: { [articleId: string]: Article };
  facets: { [facetId: string]: Facet };
  articleFacetLinks: ArticleFacetLink[];
};
// #endregion

// #region Contexts for the state model
type ArticleIdContextType = {
  articleId: string | null;
  setArticleId: React.Dispatch<React.SetStateAction<string | null>>;
};

type FacetIdContextType = {
  facetId: string | null;
  setFacetId: React.Dispatch<React.SetStateAction<string | null>>;
};

export const ArticleIdContext = React.createContext<ArticleIdContextType | null>(null);
export const FacetIdContext = React.createContext<FacetIdContextType | null>(null);
// #endregion

