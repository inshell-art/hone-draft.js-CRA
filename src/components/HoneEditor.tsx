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

import { Editor, ContentBlock, EditorState, convertToRaw, convertFromRaw, getDefaultKeyBinding, SelectionState } from "draft-js";
import { getCurrentDate } from "../utils/utils";
import { ARTICLE_TITLE, FACET_TITLE, FACET_TITLE_SYMBOL, NOT_FACET, NOT_FACET_SYMBOL } from "../utils/constants";
import { submitArticle, fetchArticle } from "../services/indexedDBService";
import { syncFacetsFromArticle } from "../services/facetService";
import { set } from "lodash";
import HonePanel from "./HonePanel";
import { is } from "immutable";
import e from "express";

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

const HoneEditor = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const { articleId } = useParams();
  const [prevPlainText, setPrevPlainText] = useState(editorState.getCurrentContent().getPlainText());
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeHonePanel, setActiveHonePanel] = useState(false);
  const [honePanelTopPosition, setHonePanelTopPosition] = useState(0);
  const [savedSelection, setSavedSelection] = useState<SelectionState | null>(null);

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
      return "activate-hone-panel";
    }

    return getDefaultKeyBinding(e); // Handle other keys normally
  };

  // Handle cmd + enter to launch hone panel
  const handleKeyCommand = (command: string) => {
    if (command === "activate-hone-panel") {
      launchHonePanel();
      return "handled";
    }
    return "not-handled";
  };
  // helper function to launch hone panel
  const launchHonePanel = () => {
    const currentSelection = editorState.getSelection();
    const anchorKey = currentSelection.getAnchorKey();
    const startOffset = currentSelection.getStartOffset();
    const firstBlockKey = editorState.getCurrentContent().getFirstBlock().getKey();
    const isBlockEmpty = editorState.getCurrentContent().getBlockForKey(anchorKey).getText().length === 0;
    const isStartOfBlock = startOffset === 0;
    const isArticleTitle = anchorKey === firstBlockKey;

    if (isBlockEmpty && isStartOfBlock && !isArticleTitle) {
      const editorRoot = editorRef.current;
      let topPosition = 0;

      if (editorRoot) {
        const node = editorRoot.querySelector(`[data-offset-key="${anchorKey}-0-0"]`);
        if (node) {
          const rect = node.getBoundingClientRect();
          topPosition = rect.top + window.scrollY;
        }
      }

      setSavedSelection(currentSelection);
      setHonePanelTopPosition(topPosition);
      setActiveHonePanel(true);
    }
  };

  // helper function to close hone panel
  const closeHonePanel = () => {
    if (savedSelection) {
      const newEditorState = EditorState.forceSelection(editorState, savedSelection);
      setEditorState(newEditorState);
    }

    setActiveHonePanel(false);

    setTimeout(() => {
      editorRef.current?.focus();
    }, 0);
  };

  return (
    <div>
      <div ref={editorRef} className="article">
        <Editor
          editorState={editorState}
          onChange={onChange}
          blockStyleFn={blockStyleFn}
          placeholder="Please write here."
          keyBindingFn={keyBindingFn}
          handleKeyCommand={handleKeyCommand}
          readOnly={activeHonePanel}
        />
      </div>
      <div>
        <HonePanel isActive={activeHonePanel} topPosition={honePanelTopPosition} onClose={closeHonePanel} />
      </div>
    </div>
  );
};

export default HoneEditor;
