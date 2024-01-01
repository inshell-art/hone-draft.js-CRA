export type Facet = {
  facetId?: string;
  title?: string;
  content?: string;
};

export type Article = {
  articleId: string;
  date?: string;
  title?: string;
  nonFacet?: string;
};

export type ArticleFacetLink = {
  articleId: string;
  facetId: string;
  orderIndex: number;
};
