import { RawDraftContentState } from "draft-js";
import { Article, Facet, ArticleFacetLink, HoneState } from "../types/types";
import { FACET_TITLE_SYMBOL } from "./constants";

/* facet id is consisted of article id and block id
so, preserve block id in db and convert it back to editorState when loading
to leverage the persist nature of block id of draft-js while editing
and the article as the editor merge other facet in is the article id to consist the facet id
that is, editor is the source of truth of the facet id
and destruct the facet id to article id and block id when loading to use block id back in editor */

// Helper function to initialize facet
function initializeFacet(articleId: string, blockId: string, title: string): Facet {
  return {
    facetId: `${articleId}-${blockId}`,
    title: title,
  };
}

// Helper functions to append facet and link
function appendLink(articleId: string, facetId: string, orderIndex: number, articleFacetLinks: ArticleFacetLink[]) {
  // push only if the link does not exist
  const existingLinkIndex = articleFacetLinks.findIndex((link) => link.articleId === articleId && link.facetId === facetId);
  if (existingLinkIndex === -1) {
    articleFacetLinks = [...articleFacetLinks, { articleId, facetId, orderIndex }];

    return { articleFacetLinks };
  }
}

// Helper functions to append facet
function appendFacet(currentFacet: Facet | null, facets: Record<string, Facet>) {
  if (currentFacet && currentFacet.facetId) {
    facets = { ...facets, [currentFacet.facetId]: currentFacet };

    // return facets and reset currentFacet
    return { facets, currentFacet: null };
  }
}

// Helper function to append text
function appendText(currentText: string | undefined, newText: string) {
  return currentText ? currentText + "\n" + newText : newText;
}

// Assemble article, facet, and articleFacetLink to be the honeState
export const transformToHoneState = (
  articleId: string,
  articleDate: string,
  rawContentState: RawDraftContentState
): HoneState => {
  let article: Article = {} as Article;
  let articles: Record<string, Article> = {};
  let currentFacet: Facet | null = null;
  const facets: Record<string, Facet> = {};
  const articleFacetLinks: ArticleFacetLink[] = [];

  article = { articleId, date: articleDate };
  articles = { ...articles, [article.articleId]: article };
  let isFacetInitialized = false;
  rawContentState.blocks.forEach((block, index, array) => {
    const isFirstBlock = index === 0;
    const isFacetTitle = block.text.startsWith(FACET_TITLE_SYMBOL);
    const isLastBlock = index === array.length - 1;
    const blockId = block.key;

    if (isFirstBlock) {
      article = { ...article, title: block.text };
    } else if (isLastBlock) {
      if (isFacetInitialized) {
        if (isFacetTitle) {
          const facetTitle = block.text;
          currentFacet = initializeFacet(articleId, blockId, facetTitle);
          appendFacet(currentFacet, facets);

          const facetId = currentFacet.facetId;
          facetId && appendLink(articleId, facetId, index, articleFacetLinks);
          isFacetInitialized = false;
        } else {
          currentFacet && (currentFacet.content = appendText(currentFacet.content, block.text));
          appendFacet(currentFacet, facets);
          isFacetInitialized = false;
        }
      } else {
        article.nonFacet = appendText(article.nonFacet, block.text);
      }
    } else if (isFacetTitle) {
      // append the last facet
      if (isFacetInitialized) {
        appendFacet(currentFacet, facets);
        isFacetInitialized = false;
      }
      // initialize a new facet and append the link
      const facetTitle = block.text;
      currentFacet = initializeFacet(articleId, blockId, facetTitle);
      isFacetInitialized = true;

      const facetId = currentFacet.facetId;
      facetId && appendLink(articleId, facetId, index, articleFacetLinks);
    } else {
      if (isFacetInitialized) {
        currentFacet && (currentFacet.content = appendText(currentFacet.content, block.text));
      } else {
        article.nonFacet = appendText(article.nonFacet, block.text);
      }
    }
  });

  return {
    articles,
    facets,
    articleFacetLinks,
  };
};
