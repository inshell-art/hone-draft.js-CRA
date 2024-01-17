import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { ContentState } from "draft-js";
import { FacetMap, Facet } from "../types/types";
import { ARTICLE_TITLE, FACET_TITLE, FACET_TITLE_SYMBOL, NOT_FACET_SYMBOL } from "./constants";

export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  // and time
  const time = now.getTime();

  return `${year}-${month}-${date}-${time}`;
};

export const constructFacetMap = (contentState: ContentState, articleId: string): FacetMap => {
  const facetMap: FacetMap = {};
  const blocks = contentState.getBlocksAsArray();
  let currentFacet: Facet | null = null;

  blocks.forEach((block) => {
    const isFacetTitle = block.getText().startsWith(FACET_TITLE_SYMBOL);
    const isNotFacet = block.getText().startsWith(NOT_FACET_SYMBOL);
    const isLastBlock = block.getKey() === blocks[blocks.length - 1].getKey();

    if (isNotFacet) {
      return;
    } else {
      if (isFacetTitle) {
        if (currentFacet) {
          facetMap[currentFacet.facetId].contentsId?.push(block.getKey());
          currentFacet = null;
        }

        const titleId = block.getKey();
        const facetId = `${articleId}-${titleId}`;
        currentFacet = { articleId, titleId, facetId, title: block.getText(), contentsId: [] };
        facetMap[facetId] = currentFacet;
      } else {
        if (isLastBlock) {
          if (currentFacet) {
            currentFacet.contentsId?.push(block.getKey());
            facetMap[currentFacet.facetId] = currentFacet;
            currentFacet = null;
          }
        } else {
          if (currentFacet) {
            currentFacet.contentsId?.push(block.getKey());
          }
        }
      }
    }
  });

  return facetMap;
};
