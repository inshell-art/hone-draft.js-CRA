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
 *
 * Users can compare and merge facets in the editor, which is the core feature of Hone:
 * it could polish (hone) the facets in multiple articles to propose the users' thoughts, that is,
 * articles are not the place to present thoughts, rather, the scenarios and context to polish thoughts as facets:
 * and facets are the essence of cognition of users.
 *
 * All operations of Hone are based on this component,
 * except for the operations of the articles list in MyHone.tsx.
 *
 * Features:
 * 1. Create and edit articles
 * 2. Create and edit facets
 * 3. Compare and merge facets
 * 4. Save/load articles
 * 5. style articles and facets
 */
// #endregion description

import { useState } from "react";
import { useParams } from "react-router-dom";
import { ContentBlock, Editor, EditorState, convertToRaw } from "draft-js";
import { getCurrentDate } from "../utils/utils";
import { ARTICLE_TITLE, FACET_TITLE, FACET_TITLE_SYMBOL } from "../utils/constants";
import { transformToHoneState } from "../utils/transformToHoneState";
import { saveHoneState } from "../services/indexedDBService";
const HoneEditor = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [prevPlainText, setPrevPlainText] = useState(editorState.getCurrentContent().getPlainText());
  const { articleId } = useParams();

  const onChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const currentPlainText = newEditorState.getCurrentContent().getPlainText();
    const rawContentState = convertToRaw(newEditorState.getCurrentContent());

    if (currentPlainText !== prevPlainText && articleId) {
      const articleDate = getCurrentDate();

      const transformedHoneState = transformToHoneState(articleId, articleDate, rawContentState);
      saveHoneState(transformedHoneState, articleId); // articleId to specify the article to save

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
    }

    return "";
  };

  return <Editor editorState={editorState} onChange={onChange} blockStyleFn={blockStyleFn} />;
};

export default HoneEditor;
