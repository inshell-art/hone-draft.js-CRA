import { RawDraftContentState } from "draft-js";

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

export type HoneState = {
  articles: Record<string, Article>;
  facets: Record<string, Facet>;
  articleFacetLinks: ArticleFacetLink[];
};

export type UpdateHoneStatePayload = {
  articleId: string;
  articleDate: string;
  rawContentState: RawDraftContentState;
};
// The payload for update hone state is mixed with the articleId and the editorState
// It might be the concisest place to handle the mixing
// Even though the type cause a bit of duplication in dispatch updateHoneState
