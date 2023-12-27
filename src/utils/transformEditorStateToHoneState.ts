import { RawDraftContentState } from "draft-js";
import { Article, Facet, ArticleFacetLink, HoneState } from "../types/types";
import { FACET_TITLE_SYMBOL } from "./constants";

let article: Article = {} as Article;
const articles: Record<string, Article> = {};
let currentFacet: Facet | null = null;
const facets: Record<string, Facet> = {};
const articleFacetLinks: ArticleFacetLink[] = [];

// Assemble article, facet, and articleFacetLink to be the honeState
// facet id is consisted of article id and block id
// so, preserve block id in db and convert it back to editorState when loading
// to leverage the persist nature of block id of draft-js while editing
// and the article as the editor merge other facet in is the article id to consist the facet id
// that is, editor is the source of truth of the facet id
// and destruct the facet id to article id and block id when loading to use block id back in editor
export const transformEditorStateToHoneState = (
  articleId: string,
  articleDate: string,
  rawContentState: RawDraftContentState
): HoneState => {
  article = { articleId, date: articleDate };
  rawContentState.blocks.forEach((block, index, array) => {
    const blockId = block.key;
    const isLastBlock = index === array.length - 1;

    if (index === 0) {
      article.title = block.text;
      articles[article.articleId] = article;
    } else if (block.text.startsWith(FACET_TITLE_SYMBOL)) {
      if (currentFacet) {
        // Close the last facet while encountering a new facet title
        facets[currentFacet.facetId!] = currentFacet;
        const existingLinkIndex = articleFacetLinks.findIndex(
          (link) => link.articleId === articleId && link.facetId === currentFacet!.facetId
        );
        // push only if the link does not exist
        if (existingLinkIndex === -1) {
          console.log("index in Links", index);
          articleFacetLinks.push({
            articleId,
            facetId: currentFacet.facetId!,
            orderIndex: index,
          });
        }

        currentFacet = null; // reset current facet
      } else {
        currentFacet = {} as Facet;
        currentFacet.facetId = `${articleId}-${blockId}`; // extract block id from facet id when loading
        currentFacet.title = block.text;
      }
    } else {
      if (currentFacet) {
        currentFacet.content = (currentFacet.content ? currentFacet.content + "\n" : "") + block.text;
      } else {
        article.nonFacet = (article.nonFacet ? article.nonFacet + "\n" : "") + block.text;
      }
    }
    if (isLastBlock) {
      console.log("isLastBlock", isLastBlock);
      console.log("currentFacet", currentFacet);
      if (currentFacet) {
        // Close the last facet while encountering a new facet title
        facets[currentFacet.facetId!] = currentFacet;
        const existingLinkIndex = articleFacetLinks.findIndex(
          (link) => link.articleId === articleId && link.facetId === currentFacet!.facetId
        );
        // push only if the link does not exist
        if (existingLinkIndex === -1) {
          console.log("index in Links", index);
          articleFacetLinks.push({
            articleId,
            facetId: currentFacet.facetId!,
            orderIndex: index,
          });
        }

        currentFacet = null; // reset current facet
      } else {
        article.nonFacet = (article.nonFacet ? article.nonFacet + "\n" : "") + block.text;
      }
    }
  });

  return {
    articles,
    facets,
    articleFacetLinks,
  };
};
