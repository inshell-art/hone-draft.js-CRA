import { RawDraftContentState } from "draft-js";
import { Article, Facet, ArticleFacetLink, HoneState } from "../types/types";
import { FACET_TITLE_SYMBOL } from "./constants";
import { is } from "immutable";

/* facet id is consisted of article id and block id
so, preserve block id in db and convert it back to editorState when loading
to leverage the persist nature of block id of draft-js while editing
and the article as the editor merge other facet in is the article id to consist the facet id
that is, editor is the source of truth of the facet id
and destruct the facet id to article id and block id when loading to use block id back in editor */

let article: Article = {} as Article;
const articles: Record<string, Article> = {};
let currentFacet: Facet | null = null;
const facets: Record<string, Facet> = {};
const articleFacetLinks: ArticleFacetLink[] = [];

// Helper functions to append facet and link
function appendFacetAndLink(
  currentFacet: Facet | null,
  articleId: string,
  index: number,
  facets: Record<string, Facet>,
  articleFacetLinks: ArticleFacetLink[]
) {
  if (currentFacet) {
    if (currentFacet && currentFacet.facetId) {
      facets[currentFacet.facetId] = currentFacet;

      // push only if the link does not exist
      const existingLinkIndex = articleFacetLinks.findIndex(
        (link) => link.articleId === articleId && link.facetId === currentFacet.facetId
      );

      if (existingLinkIndex === -1) {
        articleFacetLinks.push({
          articleId,
          facetId: currentFacet.facetId,
          orderIndex: index,
        });
      }
    }
    console.log("facets1:", facets);
    // Return updated state and reset current facet
    return { facets, articleFacetLinks, currentFacet: null };
  }
}
// Helper function to append text
function appendText(currentText: string | undefined, newText: string) {
  return currentText ? currentText + "\n" + newText : newText;
}

// Assemble article, facet, and articleFacetLink to be the honeState
export const transformEditorStateToHoneState = (
  articleId: string,
  articleDate: string,
  rawContentState: RawDraftContentState
): HoneState => {
  article = { articleId, date: articleDate };
  let isFacetInitialized = false;
  rawContentState.blocks.forEach((block, index, array) => {
    const isFirstBlock = index === 0;
    const isFacetTitle = block.text.startsWith(FACET_TITLE_SYMBOL);
    const isLastBlock = index === array.length - 1;
    const blockId = block.key;

    console.log("index:", index);
    if (isFirstBlock) {
      article.title = block.text;
      articles[article.articleId] = article;
      console.log("article title:", article.title);
    } else if (isLastBlock) {
      console.log("last block's isFacetInitialized:", isFacetInitialized);
      if (isFacetInitialized) {
        if (isFacetTitle) {
          appendFacetAndLink(currentFacet, articleId, index, facets, articleFacetLinks);
          isFacetInitialized = false;
          console.log("last block as facet:", block.text);
          console.log("facets2:", facets);
        } else {
          currentFacet && (currentFacet.content = appendText(currentFacet?.content, block.text));
          appendFacetAndLink(currentFacet, articleId, index, facets, articleFacetLinks);
        }
      } else {
        article.nonFacet = appendText(article.nonFacet, block.text);
        console.log("last block as non-facet:", block.text);
      }
    } else if (isFacetTitle) {
      if (isFacetInitialized) {
        appendFacetAndLink(currentFacet, articleId, index, facets, articleFacetLinks);
        isFacetInitialized = false;
        console.log("append facet and link:", currentFacet);
      }
      // initialize a new facet
      currentFacet = {} as Facet;
      isFacetInitialized = true;
      currentFacet.facetId = `${articleId}-${blockId}`;
      currentFacet.title = block.text;
      console.log("initialize a new facet:", block.text);
    } else {
      if (isFacetInitialized) {
        currentFacet && (currentFacet.content = appendText(currentFacet?.content, block.text));
        console.log("append facet content:", block.text);
      } else {
        article.nonFacet = appendText(article.nonFacet, block.text);
        console.log("append non-facet content:", block.text);
      }
    }
  });

  return {
    articles,
    facets,
    articleFacetLinks,
  };
};
