import { RawDraftContentState } from "draft-js";

export type Article = {
  articleId: string;
  updateAt?: string;
  title?: string;
  content?: RawDraftContentState;
};

export type Facet = {
  articleId: string;
  titleId: string;
  contentsId: string[];
};
