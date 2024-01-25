import { RawDraftContentState } from "draft-js";

export type Article = {
  articleId: string;
  updateAt?: string;
  title?: string;
  rawContent?: RawDraftContentState;
};

export type Facet = {
  facetId: string;
  articleId: string;
  title: string;
  content?: string;
  honedByArray?: HonedBy[];
};

type HonedBy = {
  honingFacetId: string;
};

export type FacetWithSimilarity = Facet & {
  similarity: number;
};

export type HonedFacetWithHoningFacets = {
  honedFacet: Facet;
  honingFacets: FacetWithSimilarity[];
};

export type FacetsList = HonedFacetWithHoningFacets[];

export type HonePanelProps = {
  isActive: Boolean;
  topPosition: number; // only vertical
  onSelectFacet: (facetId: string) => void;
  onClose: () => void;
  currentFacetId: string;
};

export type SimilarityBarProps = {
  similarity: number;
};
