import { RawDraftContentState } from "draft-js";
import { Article, Facet, ArticleFacetLink, HoneState } from "../types/types";
import { v4 as uuidv4 } from "uuid";
import { FACET_TITLE_SYMBOL } from "./constants";

let article: Article = {} as Article;
const articles: Record<string, Article> = {};
let currentFacet: Facet | null = null;
const facets: Record<string, Facet> | null = null;
const articleFacetLinks: ArticleFacetLink[] = [];
let isFacetTitleDone = false;

// Assemble article, facet, and articleFacetLink to be the honeState
export const transformEditorStateToHoneState = (
  articleId: string,
  articleDate: string,
  rawContentState: RawDraftContentState
): HoneState => {
  article = { articleId, date: articleDate };
  rawContentState.blocks.forEach((block, index) => {
    if (index === 0) {
      article = { ...article, title: block.text };
      articles[article.articleId] = article;
      console.log("article", article);
    } else if (block.text.startsWith(FACET_TITLE_SYMBOL)) {
      if (isFacetTitleDone && currentFacet && currentFacet.facetId) {
        // Close the last facet while encountering a new facet title

        facets[currentFacet.facetId] = currentFacet;
        articleFacetLinks.push({
          articleId,
          facetId: currentFacet.facetId,
          orderIndex: index,
        });
        isFacetTitleDone = false;
        currentFacet = null;
      }
      if (!currentFacet) {
        currentFacet = { facetId: uuidv4(), title: block.text };
        console.log("currentFacet-initial", currentFacet);
      } else {
        currentFacet = { ...currentFacet, title: block.text };
        console.log("currentFacet-update", currentFacet);
      }
    } else {
      if (currentFacet) {
        isFacetTitleDone = true;
        currentFacet = { ...currentFacet, content: (currentFacet.content ? currentFacet.content + "\n" : "") + block.text };
      } else {
        article = { ...article, nonFacet: (article.nonFacet ? article.nonFacet + "\n" : "") + block.text };
      }
    }
  });

  return {
    articles,
    facets,
    articleFacetLinks,
  };
};
