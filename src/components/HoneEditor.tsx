// #region description
/**
 * HoneEditor Component
 *
 * This component is the editor of Hone. It is a rich text editor based on draft.js.
 * Users can create and edit articles in this editor.
 *
 * Articles are the scenarios and context to polish thoughts as facets.
 * Facets are the content starts with a symbol "$" and the line is "facet title", and the blocks after the line are "facet content".
 * Users can compare and insert facets in the editor, which is the core feature of Hone, as the operation "hone".
 *
 * Features:
 * Create and edit articles
 * Create and edit facets
 * Compare and insert facets (hone)
 * Save/load articles
 * style articles and facets
 */
// #endregion description

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
  EditorBlock,
} from 'draft-js';
import { getCurrentDate } from '../utils/utils';
import { ARTICLE_TITLE, FACET_TITLE, FACET_TITLE_SYMBOL } from '../utils/constants';
import {
  submitArticle,
  fetchArticle,
  submitFacets,
  submitHoningRecord,
  extractFacetForInsert,
} from '../services/indexedDBService';
import HonePanel from './HonePanel';
import { Article } from '../types/types';

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
  const blocksRef = useRef<Record<string, HTMLDivElement | null>>({}); // for the target block
  const location = useLocation();
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);

  // initialize the editor with the articleId
  useEffect(() => {
    if (!articleId) return;

    const editorStatePromise = initializeArticle(articleId);
    editorStatePromise.then((editorState) => {
      setEditorState(editorState);
      setPrevArticleText(editorState.getCurrentContent().getPlainText());
    });
  }, [articleId]);

  // #region Scroll to the target block when a link from facet list is clicked

  // Extract blockId from hash
  useEffect(() => {
    const hash = location.hash;
    const blockId = hash.replace(/^#/, '').replace(`${articleId}-`, '');

    if (blockId) {
      setTargetBlockId(blockId);
    }
  }, [location.hash, articleId]);

  // Scroll to the target block with a delay to wait for the block to be rendered
  useEffect(() => {
    const timer = setTimeout(() => {
      if (targetBlockId && blocksRef.current[targetBlockId]) {
        const blockElement = blocksRef.current[targetBlockId];

        if (blockElement) {
          const scrollPosition = blockElement.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [targetBlockId]);

  // Wrapper for the target block to get the ref
  const BlockRefWrapper = ({ blockKey, children }: { blockKey: string; children: ReactNode }) => {
    return <div ref={(el) => (blocksRef.current[blockKey] = el)}>{children}</div>;
  };

  // Add ref to the target block only as the custom block renderer
  const blockRendererFn = (contentBlock: ContentBlock) => {
    const blockKey = contentBlock.getKey();

    if (blockKey === targetBlockId) {
      return {
        component: (blockProps: EditorBlock) => (
          <BlockRefWrapper blockKey={blockKey}>
            <EditorBlock {...blockProps} />
          </BlockRefWrapper>
        ),
        props: {},
      };
    }

    return null;
  };
  // #endregion Scroll to the target block when a link from facet list is clicked

  // save the article and facets if the content in is changed respectively
  const onChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);

    const currentPlainText = newEditorState.getCurrentContent().getPlainText();
    if (currentPlainText !== prevArticleText && articleId) {
      const article = assembleArticle(articleId, newEditorState);
      try {
        submitArticle(article);
      } catch (error) {
        console.error('Error while submitArticle', error);
      }

      try {
        submitFacets(articleId, newEditorState);
      } catch (error) {
        console.error('Error while submitFacets', error);
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
    return 'unstyled';
  };

  // when cmd + enter is pressed
  const keyBindingFn = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      return 'activate-hone-panel';
    }

    return getDefaultKeyBinding(e); // Handle other keys normally
  };

  // Handle cmd + enter to launch hone panel
  const handleKeyCommand = (command: string) => {
    if (command === 'activate-hone-panel') {
      launchHonePanel();
      return 'handled';
    }
    return 'not-handled';
  };

  // helper fn to get current facet text to calculate similarity
  const getCurrentFacetId = (anchorKey: string): string => {
    const blockMap = editorState.getCurrentContent().getBlockMap();

    let currentFacetTitleKey = '';
    const blocksBeforeAnchor = blockMap
      .takeUntil((_, k) => k === anchorKey)
      .reverse()
      .entrySeq()
      .toArray();

    for (const [key, block] of blocksBeforeAnchor) {
      if (block.getText().startsWith(FACET_TITLE_SYMBOL)) {
        currentFacetTitleKey = key;
        break;
      }
    }

    if (!currentFacetTitleKey) return '';
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

  // helper function to handle facet insert
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

    const updateBlockArray = [
      ...currentBlockArray.slice(0, insertBlockIndex),
      ...facetBlockArray,
      ...currentBlockArray.slice(insertBlockIndex),
    ];

    const newContentState = ContentState.createFromBlockArray(updateBlockArray);
    const newEditorState = EditorState.push(editorState, newContentState, 'insert-fragment');
    if (savedSelection) {
      const updatedEditorState = EditorState.forceSelection(newEditorState, savedSelection);

      setEditorState(updatedEditorState);
    }

    if (currentFacetId) {
      try {
        submitHoningRecord(currentFacetId, facetId);
      } catch (error) {
        console.error('Error of SubmitHonedBy:', error);
      }
    }

    setActiveHonePanel(false);
  };

  // helper function to handle pasted text
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
    const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');
    setEditorState(newEditorState);

    return 'handled'; // Return 'handled' to indicate we've taken care of the paste
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
          blockRendererFn={blockRendererFn}
        />
      </div>
      {activeHonePanel && honePanelTopPosition && currentFacetId !== null && (
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
