import { RawDraftContentState } from "draft-js";
import { Article, Facet, ArticleFacetLink, HoneState } from "../types/types";
import { v4 as uuidv4 } from "uuid";
import { FACET_TITLE_SYMBOL } from "./constants";
import { is } from "immutable";

// Assemble article, facet, and articleFacetLink to be the honeState
export const transformEditorStateToHoneState = (
  articleId: string,
  articleDate: string,
  rawContentState: RawDraftContentState
): HoneState => {
  let article: Article = { articleId, date: articleDate };
  const articles: Record<string, Article> = { articleId: article };
  let currentFacet: Facet | null = null;
  const facets: Record<string, Facet> = {};
  const articleFacetLinks: ArticleFacetLink[] = [];
  let closeLastBlock = false;
  let isFacetHasId = false;

  rawContentState.blocks.forEach((block, index) => {
    // get the block id
    const blockId = block.key;
    if (index === 0) {
      article = { ...article, title: block.text };
    } else if (block.text.startsWith(FACET_TITLE_SYMBOL)) {
      if (currentFacet) {
        // Close the previous facet and reset currentFacet
        facets[currentFacet.facetId] = currentFacet;
        articleFacetLinks.push({
          articleId,
          facetId: currentFacet.facetId,
          orderIndex: index,
        });
        currentFacet = null; // Reset currentFacet
      } else {
        if (currentFacet.facetId) {
          currentFacet.title = block.text;
        } else {
          currentFacet = { title: block.text };
          currentFacet.facetId = uuidv4();
        }
      }
    }
  });

  return {
    articles,
    facets,
    articleFacetLinks,
  };
};
