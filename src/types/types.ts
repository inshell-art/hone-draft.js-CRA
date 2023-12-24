import { ARTICLE_TITLE, FACET_TITLE } from "../utils/constants";
import { EditorState } from "draft-js";

export type Block = {
  type?: typeof ARTICLE_TITLE | typeof FACET_TITLE | null;
  text?: string;
};

export type Facet = {
  facetId: string;
  title?: string;
  blocks?: Block[];
};

export type Article = {
  articleId: string;
  date?: string;
  title?: string;
  nonFacet?: Block[];
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
  editorState: EditorState;
};
// The payload for update hone state is mixed with the articleId and the editorState
// It might be the concisest place to handle the mixing
// Even though the type cause a bit of duplication in dispatch updateHoneState
