import { RawDraftContentState } from "draft-js";

export type Article = {
  articleId: string;
  updateAt?: string;
  title?: string;
  rawContent?: RawDraftContentState;
};

export type Facet = {
  articleId: string;
  titleId: string;
  facetId: string;
  title?: string;
  contentsId?: string[];
  updateAt?: string;
  honingFacetsId?: string[];
  honedFacetsId?: string[];
};

export type HonePanelProps = {
  isActive: Boolean;
  topPosition: number; // only vertical
  onSelectFacet: (facetId: string) => void;
  onClose: () => void;
};
