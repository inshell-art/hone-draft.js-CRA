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
};

export type HoningRecord = {
  honedFacetId: string;
  honingFacetId: string;
};

// Transeint data types for facet list
export type FacetWithSimilarity = {
  facetId: string;
  facetTitle: string;
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
