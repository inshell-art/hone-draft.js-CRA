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
import { useParams, useLocation } from "react-router-dom";
import {
  Editor,
  ContentBlock,
  EditorState,
  convertToRaw,
  convertFromRaw,
  getDefaultKeyBinding,
  SelectionState,
  ContentState,
  Modifier,
  DraftHandleValue,
} from "draft-js";
import { getCurrentDate, similarityBar } from "../utils/utils";
import { ARTICLE_TITLE, FACET_TITLE, FACET_TITLE_SYMBOL } from "../utils/constants";
import {
  submitArticle,
  fetchArticle,
  submitFacets,
  submitHoningRecord,
  extractFacetForInsert,
} from "../services/indexedDBService";
import HonePanel from "./HonePanel";
import { Article } from "../types/types";

const assembleArticle = (articleId: string, editorState: EditorState): Article => {
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
  const [prevArticleText, setPrevArticleText] = useState(editorState.getCurrentContent().getPlainText());
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeHonePanel, setActiveHonePanel] = useState(false);
  const [honePanelTopPosition, setHonePanelTopPosition] = useState<number | null>(null);
  const [savedSelection, setSavedSelection] = useState<SelectionState | null>(null);
  const [currentFacetId, setCurrentFacetId] = useState<string | null>(null);
  const blocksRef = useRef<Record<string, HTMLDivElement | null>>({}); // for the fragment identifier
  const location = useLocation();

  // initialize the editor with the article
  useEffect(() => {
    if (!articleId) return;

    const editorStatePromise = initializeArticle(articleId);
    editorStatePromise.then((editorState) => {
      setEditorState(editorState);
      setPrevArticleText(editorState.getCurrentContent().getPlainText());
    });
  }, [articleId]);

  // get the hash, set selection, and scroll to the block
  useEffect(() => {
    const hash = location.hash;
    const blockId = hash.replace(/^#/, "").replace(`${articleId}-`, "");
    if (blockId) {
      const blockArray = editorState.getCurrentContent().getBlocksAsArray();

      const targetBlock = blockArray.find((block) => block.getKey() === blockId);
      if (targetBlock) {
        const targetBlockKey = targetBlock.getKey();

        const selectionState = SelectionState.createEmpty(targetBlockKey).merge({
          anchorKey: targetBlockKey,
          focusKey: targetBlockKey,
        });
        setEditorState(EditorState.forceSelection(editorState, selectionState));

        if (blocksRef.current[targetBlockKey]) {
          blocksRef.current[targetBlockKey]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    }
  }, [location.hash, articleId, editorState]);

  // save the article and facets if the content in is changed respectively
  const onChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);

    const currentPlainText = newEditorState.getCurrentContent().getPlainText();
    if (currentPlainText !== prevArticleText && articleId) {
      const article = assembleArticle(articleId, newEditorState);
      try {
        submitArticle(article);
      } catch (error) {
        console.error("Error while submitArticle", error);
      }

      try {
        submitFacets(articleId, newEditorState);
      } catch (error) {
        console.error("Error while submitFacets", error);
      }

      setPrevArticleText(currentPlainText);
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
    return "unstyled";
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
  // helper fn to get current facet text to calculate similarity
  const getCurrentFacetId = (anchorKey: string): string => {
    const blockMap = editorState.getCurrentContent().getBlockMap();

    let currentFacetTitleKey = "";
    let blocksBeforeAnchor = blockMap
      .takeUntil((_, k) => k === anchorKey)
      .reverse()
      .entrySeq()
      .toArray();

    for (let [key, block] of blocksBeforeAnchor) {
      if (block.getText().startsWith(FACET_TITLE_SYMBOL)) {
        currentFacetTitleKey = key;
        break;
      }
    }

    if (!currentFacetTitleKey) return "";
    const currentFacetId = `${articleId}-${currentFacetTitleKey}`;

    return currentFacetId;
  };

  // helper function to launch hone panel
  const launchHonePanel = () => {
    const currentSelection = editorState.getSelection();
    const anchorKey = currentSelection.getAnchorKey();
    const startOffset = currentSelection.getStartOffset();
    const firstBlockKey = editorState.getCurrentContent().getFirstBlock().getKey();

    const isBlockEmpty = editorState.getCurrentContent().getBlockForKey(anchorKey).getText().length === 0;
    const isStartOfBlock = startOffset === 0;
    const isNotArticleTitle = anchorKey !== firstBlockKey;
    const currentFacetId = getCurrentFacetId(anchorKey);

    if (isBlockEmpty && isStartOfBlock && isNotArticleTitle && currentFacetId) {
      console.log("launchHonePanel", currentFacetId);
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
      setCurrentFacetId(currentFacetId);
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

  const handleFacetInsert = async (facetId: string) => {
    const currentContentState = editorState.getCurrentContent();
    const currentBlockArray = currentContentState.getBlocksAsArray();

    const startKey = savedSelection?.getStartKey();
    const insertBlockIndex = currentBlockArray.findIndex((block) => block.getKey() === startKey);

    let facetBlockArray: ContentBlock[] | undefined;
    try {
      facetBlockArray = await extractFacetForInsert(facetId);
    } catch (error) {
      console.error(error);
    }
    if (!facetBlockArray) return;

    const updateBlcokArray = [
      ...currentBlockArray.slice(0, insertBlockIndex),
      ...facetBlockArray,
      ...currentBlockArray.slice(insertBlockIndex),
    ];

    const newContentState = ContentState.createFromBlockArray(updateBlcokArray);
    const newEditorState = EditorState.push(editorState, newContentState, "insert-fragment");
    const updatedEditorState = EditorState.forceSelection(newEditorState, savedSelection!);

    setEditorState(updatedEditorState);

    if (currentFacetId) {
      try {
        submitHoningRecord(currentFacetId, facetId);
      } catch (error) {
        console.error("Error of SubmitHonedBy:", error);
      }
    }

    setActiveHonePanel(false);
  };

  const handlePastedText = (text: string, _html: string | undefined, editorState: EditorState): DraftHandleValue => {
    const currentContent = editorState.getCurrentContent();
    const currentSelection = editorState.getSelection();

    // Create a new content state with the pasted plain text
    const newContentState = Modifier.replaceText(
      currentContent,
      currentSelection,
      text // text is the plain text version of the pasted content
    );

    // Update the editor state
    const newEditorState = EditorState.push(editorState, newContentState, "insert-characters");
    setEditorState(newEditorState);

    return "handled"; // Return 'handled' to indicate we've taken care of the paste
  };

  return (
    <div>
      <div ref={editorRef} className="editor">
        <Editor
          editorState={editorState}
          onChange={onChange}
          blockStyleFn={blockStyleFn}
          placeholder="Please write here."
          keyBindingFn={keyBindingFn}
          handleKeyCommand={handleKeyCommand}
          readOnly={activeHonePanel}
          spellCheck={true}
          handlePastedText={handlePastedText}
        />
      </div>
      {honePanelTopPosition && currentFacetId !== null && (
        <HonePanel
          isActive={activeHonePanel}
          topPosition={honePanelTopPosition}
          onSelectFacet={handleFacetInsert}
          onClose={closeHonePanel}
          currentFacetId={currentFacetId}
        />
      )}
    </div>
  );
};

export default HoneEditor;
