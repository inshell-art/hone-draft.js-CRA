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

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Editor from "@draft-js-plugins/editor";
import createLinkify from "@draft-js-plugins/linkify";
import "@draft-js-plugins/linkify/lib/plugin.css";

import { ContentBlock, EditorState, convertToRaw, RichUtils, Modifier } from "draft-js";
import { getCurrentDate, loadArticle } from "../utils/utils";
import { ARTICLE_TITLE, FACET_TITLE, FACET_TITLE_SYMBOL, NOT_FACET, NOT_FACET_SYMBOL } from "../utils/constants";
import { saveArticle } from "../services/indexedDBService";

const linkifyPlugin = createLinkify();

const HoneEditor = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [prevPlainText, setPrevPlainText] = useState(editorState.getCurrentContent().getPlainText());
  const { articleId } = useParams();

  // load article from indexedDB with useEffect
  useEffect(() => {
    if (articleId) {
      loadArticle(articleId);
    }
  }, [articleId]);

  const onChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);

    const currentPlainText = newEditorState.getCurrentContent().getPlainText();
    if (currentPlainText !== prevPlainText && articleId) {
      const updateAt = getCurrentDate();
      saveArticle(articleId, updateAt, newEditorState);

      setPrevPlainText(currentPlainText);
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

  return (
    <div>
      <Editor editorState={editorState} onChange={onChange} blockStyleFn={blockStyleFn} plugins={[linkifyPlugin]} />
    </div>
  );
};

export default HoneEditor;
