import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { ContentBlock } from "draft-js";
import { Facet } from "../types/types";
import { ARTICLE_TITLE, FACET_TITLE, FACET_TITLE_SYMBOL, NOT_FACET_SYMBOL } from "./constants";

export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  // and time

  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  return `${year}-${month}-${date}-${hour}-${minute}-${second}`;
};

export const convertFacetBlocksToPlainText = (facetBlocks: ContentBlock[]): string => {
  return facetBlocks.map((block) => block.getText()).join("\n"); // Using newline character to separate text from each block
};
