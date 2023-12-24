import { convertToRaw, EditorState } from "draft-js";
import { Article, Facet, Block, ArticleFacetLink, HoneState } from "../types/types";
import { v4 as uuidv4 } from "uuid";
import { ARTICLE_TITLE, FACET_TITLE, FACET_TITLE_SYMBOL } from "./constants";

// Assemble article, facet, and articleFacetLink to be the honeState
export const transformEditorStateToHoneState = (articleId: string, articleDate: string, editorState: EditorState): HoneState => {
  const contentState = editorState.getCurrentContent();
  const rawContent = convertToRaw(contentState);

  const article: Article = { articleId, date: articleDate, title: "", nonFacet: [] };
  const articles: Record<string, Article> = { articleId: article };
  let currentFacet: Facet | null = null;
  const facets: Record<string, Facet> = {};
  const articleFacetLinks: ArticleFacetLink[] = [];

  rawContent.blocks.forEach((block, index) => {
    const honeBlock: Block = { type: null, text: block.text };

    if (index === 0) {
      article.title = block.text;
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
      }
      currentFacet = { facetId: uuidv4(), title: block.text, blocks: [] };
    } else {
      if (currentFacet) {
        currentFacet.blocks?.push(honeBlock);
        // Close the last facet while encountering the last block
        if (index === rawContent.blocks.length - 1) {
          facets[currentFacet.facetId] = currentFacet;
          articleFacetLinks.push({
            articleId,
            facetId: currentFacet.facetId,
            orderIndex: index,
          });
        }
      } else {
        article.nonFacet?.push(honeBlock);
      }
    }
  });

  return {
    articles,
    facets,
    articleFacetLinks,
  };
};
