// #region description
/**
 * HoneEditor Component
 *
 * This component is the editor of Hone. It is a rich text editor based on draft.js.
 * Users can create and edit articles in this editor.
 *
 * Articles consist of article title, non-facet, and facets;
 * a facet consist of facet title and facet content;
 * facet title is the first block (defined by draft.js) of a facet, which starts with a symbol "$",
 * and facet content is the blocks after facet title.
 * blocks not in facets are non-facets.
 * block start with ~ is a not-facet.
 *
 * Users can compare and insert facets in the editor, which is the core feature of Hone:
 * it could polish (hone) the facets in multiple articles to propose the users' thoughts, that is,
 * articles are not the place to present thoughts, rather, the scenarios and context to polish thoughts as facets:
 * and facets are the essence of cognition of users.
 *
 * All operations of Hone are based on this component,
 * except article deletion and Hone publishing that are in MyHone.tsx.
 *
 * Features:
 * Create and edit articles
 * Create and edit facets
 * Create non-facets and not-facets
 * Compare and insert facets
 * Save/load articles
 * style articles and facets
 */
// #endregion description

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Editor from "@draft-js-plugins/editor";
import createLinkify from "@draft-js-plugins/linkify";
import { ContentBlock, EditorState, convertToRaw, convertFromRaw, ContentState } from "draft-js";
import { getCurrentDate } from "../utils/utils";
import { ARTICLE_TITLE, FACET_TITLE, FACET_TITLE_SYMBOL, NOT_FACET, NOT_FACET_SYMBOL } from "../utils/constants";
import { submitArticle, fetchArticle } from "../services/indexedDBService";
import { syncFacetsFromArticle } from "../services/facetService";
import { set } from "lodash";

const linkifyPlugin = createLinkify();

const assembleArticle = (articleId: string, editorState: EditorState) => {
  const updateAt = getCurrentDate();
  const title = editorState.getCurrentContent().getFirstBlock().getText();
  const rawContent = convertToRaw(editorState.getCurrentContent());
  return { articleId, updateAt, title, rawContent };
};

const initializeArticle = async (articleId: string): Promise<EditorState> => {
  const article = await fetchArticle(articleId);
  if (article?.rawContent) {
    const contentState = convertFromRaw(article.rawContent);
    return EditorState.createWithContent(contentState);
  } else {
    return EditorState.createEmpty();
  }
};

const HoneFacet = () => {
  return <div>Checking facets...</div>;
};

const HoneEditor = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [prevPlainText, setPrevPlainText] = useState(editorState.getCurrentContent().getPlainText());
  const { articleId } = useParams();
  const [isFacetChecking, setIsFacetChecking] = useState(false);

  // initialize the editor with the article
  useEffect(() => {
    if (!articleId) return;

    const editorStatePromise = initializeArticle(articleId);
    editorStatePromise.then((editorState) => {
      setEditorState(editorState);
      setPrevPlainText(editorState.getCurrentContent().getPlainText());
    });
  }, [articleId]);

  const onChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);

    // save article
    const currentPlainText = newEditorState.getCurrentContent().getPlainText();
    if (currentPlainText !== prevPlainText && articleId) {
      const article = assembleArticle(articleId, newEditorState);
      submitArticle(article);
      setPrevPlainText(currentPlainText);

      syncFacetsFromArticle(articleId); // sync facets store from article store when article is updated
    }
  };

  // Style operations in the editor of draft.js
  const blockStyleFn = (contentBlock: ContentBlock) => {
    const text = contentBlock.getText();
    const key = contentBlock.getKey();
    const firstBlockKey = editorState.getCurrentContent().getFirstBlock().getKey();

    if (key === firstBlockKey) {
      return ARTICLE_TITLE;
    } else if (text.startsWith(FACET_TITLE_SYMBOL)) {
      return FACET_TITLE;
    } else if (text.startsWith(NOT_FACET_SYMBOL)) {
      return NOT_FACET;
    }

    return "block-padding";
  };

  // when cmd + enter is pressed
  const keyBindingFn = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      return "check-facets";
    }
    return "not-handled";
  };

  const handleKeyCommand = (command: string, editorState: EditorState) => {
    if (command === "check-facets") {
      const selection = editorState.getSelection();
      const startOffset = selection.getStartOffset();

      if (startOffset === 0) {
        setIsFacetChecking(true);
      }
    }
    return "not-handled";
  };

  return (
    <div className="article">
      <div>
        {" "}
        <HoneFacet />
      </div>
      <Editor
        editorState={editorState}
        onChange={onChange}
        blockStyleFn={blockStyleFn}
        plugins={[linkifyPlugin]}
        placeholder="Please write your article here."
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={keyBindingFn}
      />
    </div>
  );
};

export default HoneEditor;
