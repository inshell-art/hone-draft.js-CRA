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

export type FacetHonedBy = {
  facetId: string;
  honedBy: HonedBy[];
};

type HonedBy = {
  id: string;
  similarity: number;
};

export type HonePanelProps = {
  isActive: Boolean;
  topPosition: number; // only vertical
  onSelectFacet: (facetId: string) => void;
  onClose: () => void;
};
