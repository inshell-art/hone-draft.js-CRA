import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Editor, EditorState, ContentBlock, RichUtils, SelectionState, Modifier, ContentState, genKey, CharacterMetadata, getDefaultKeyBinding, DraftHandleValue } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { useParams } from 'react-router-dom';
import { Article, ArticleContent, Facet, ArticleRecord, ArticleContentRecord, FacetRecord } from './types';
import './App.css';
import { Record, List } from 'immutable';

const ARTICLE_TITLE = 'article-title'; // Four custom block types
const FACET_TITLE = 'facet-title';
const FACET_CONTENT = 'facet-content';
const NON_FACET = 'non-facet';
const FACET_TITLE_SYMBOL = '$';

const CHECK_STYLE = 'CHECK_STYLE';
enum CheckStep {
  ToInsertMostFacetTitle = 'toInsertMostFacetTitle',
  ToInsertFacetContent = 'toInsertFacetContent'
}
const CHECK_COMMAND = ':check';

const mostSimilarFacetTitle = 'Most similar facet title';
const similarity: number = 0.74;
const mostSimilarFacetTitleToInsert = ` ${mostSimilarFacetTitle} - ${similarity}`;
const facetContentToInsert = 'Facet content 1\n Face content 2\n Facet content 3\n';

let prevCharacterCount: number | null = null;  // Previous character count for saving detection


// getArticleContentType, manage the mapping of block id to block type by state.
const getArticleContentType = (state: EditorState): { [blockId: string]: string } => {
  const contentState = state.getCurrentContent();
  const blockArray = contentState.getBlocksAsArray();

  let currentFacet: Facet | null = null;
  const types: { [blockId: string]: string } = {};

  blockArray.forEach((block, index) => {
    const text = block.getText();
    const blockId = block.getKey();

    if (index === 0) {
      types[blockId] = ARTICLE_TITLE;
    } else if (text.startsWith(FACET_TITLE_SYMBOL)) {
      types[blockId] = FACET_TITLE;
      currentFacet = FacetRecord({ title: text, content: '' });
    } else if (currentFacet && !text.startsWith(FACET_TITLE_SYMBOL)) {
      types[blockId] = FACET_CONTENT;
    } else {
      types[blockId] = NON_FACET;
    }
  });

  return types;
};

const editorStateToArticleContent = (editorState: EditorState): ArticleContent => {
  // Get the custom block types using getArticleContentType
  const customBlockTypes = getArticleContentType(editorState);
  const contentState = editorState.getCurrentContent();
  const blockArray = contentState.getBlocksAsArray();

  let title = '';
  let facets = List<Facet>(); // Using Immutable List<Facet> instead of array
  let currentFacet: Facet | null = null; // Using Facet from Immutable.js
  let nonFacet = '';
  let currentFacetContentLines: string[] = [];
  let nonFacetLines: string[] = [];

  blockArray.forEach((block, index) => {
    const text = block.getText();
    const blockId = block.getKey();
    const type = customBlockTypes[blockId]; // Use the custom type from the mapping

    if (type === ARTICLE_TITLE) {
      title = text;
    } else if (type === FACET_TITLE) {
      if (currentFacet) {
        currentFacet = currentFacet.set('content', currentFacetContentLines.join('\n')); // Using Immutable.js set
        facets = facets.push(currentFacet); // Using Immutable.js push
        currentFacetContentLines = [];
      }
      currentFacet = FacetRecord({ title: text, content: '' });
    } else if (type === FACET_CONTENT) {
      currentFacetContentLines.push(text);
    } else if (type === NON_FACET) {
      nonFacetLines.push(text);
    }
  });

  if (currentFacet !== null) {
    currentFacet = (currentFacet as Facet).set('content', currentFacetContentLines.join('\n')); // Using Immutable.js set
    facets = facets.push(currentFacet); // Using Immutable.js push
  }

  nonFacet = nonFacetLines.join('\n');

  // Create an Immutable Record for ArticleContent
  const articleContent = ArticleContentRecord({
    title,
    nonFacet,
    facets
  });

  return articleContent; // Return Immutable Record
};

const articleContentToEditorState = (articleContent: ArticleContent): EditorState => {
  const blocks: ContentBlock[] = [];
  const createCharacterList = (length: number): List<CharacterMetadata> => {
    return List(Array(length).fill(CharacterMetadata.create()));
  };// Helper function to create a List of CharacterMetadata

  // Add title
  blocks.push(new ContentBlock({
    key: genKey(),
    type: ARTICLE_TITLE,
    text: articleContent.get('title'),
    characterList: createCharacterList(articleContent.get('title').length),
  }));

  // Add non-facet only if there's content
  if (articleContent.get('nonFacet').trim() !== '') {
    blocks.push(new ContentBlock({
      key: genKey(),
      type: NON_FACET,
      text: articleContent.get('nonFacet'),
      characterList: createCharacterList(articleContent.get('nonFacet').length),
    }));
  }

  // Add facets
  articleContent.get('facets').forEach((facet: Facet) => {
    blocks.push(new ContentBlock({
      key: genKey(),
      type: FACET_TITLE,
      text: facet.get('title'),
      characterList: createCharacterList(facet.get('title').length),
    }));

    blocks.push(new ContentBlock({
      key: genKey(),
      type: FACET_CONTENT,
      text: facet.get('content'),
      characterList: createCharacterList(facet.get('content').length),
    }));
  });

  const contentState = ContentState.createFromBlockArray(blocks);
  return EditorState.createWithContent(contentState);
};


const MyEditor: React.FC = () => {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string | null>(null);
  const [id, setId] = useState<string>(''); // ADDED: state for article ID
  const editorRef = useRef<Editor>(null);
  const { id: paramId } = useParams<{ id: string }>(); // ADDED: Get the article id from the route params
  const [isInitializing, setIsInitializing] = useState(true);
  const saveTimeoutRef = useRef<number | null>(null);
  const [editorIsLocked, setEditorIsLocked] = useState(false);  // New state to track if editor should be grey
  const [checkStep, setCheckStep] = useState<CheckStep | null>(null);// Steps for check

  const getCurrentDate = (): string => {
    const today = new Date();
    const dateStr = `${today.getFullYear()} ${today.toLocaleString('default', { month: 'short' })} ${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    return dateStr;
  };

  const updateToSave = (newEditorState: EditorState | null) => {
    if (newEditorState) {
      const newCharacterCount = newEditorState.getCurrentContent().getPlainText().length;

      if (prevCharacterCount !== newCharacterCount) {
        prevCharacterCount = newCharacterCount;
        const articleContent = editorStateToArticleContent(newEditorState);
        const currentDate = getCurrentDate();

        const dataToSave = ArticleRecord({
          id,
          date: currentDate,
          articleContent,
        });

        localStorage.setItem(id, JSON.stringify(dataToSave.toJS()));
      }
    } else {
      console.error('newEditorState in updateToSave is null');
    }
  };

  // Helper function to get lineStart, lineEnd, and currentLineText
  const getLineBoundsAndText = (blockText: string, startOffset: number) => {
    const lineStart = blockText.lastIndexOf('\n', startOffset - 1) + 1;
    const lineEnd = blockText.indexOf('\n', startOffset);
    const currentLineText = blockText.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    return { lineStart, lineEnd, currentLineText };
  };

  // Helper function to force cursor to the specific position
  const forceSelection = (newState: EditorState, specificPosition: number, currentBlockKey: string) => {
    const newSelection = new SelectionState({
      anchorKey: currentBlockKey,
      anchorOffset: specificPosition,
      focusKey: currentBlockKey,
      focusOffset: specificPosition,
    });
    return EditorState.forceSelection(newState, newSelection);
  };

  // Helper function to replace text, apply inline style and move cursor to the end of the line
  const handleCheckExecution = (
    newState: EditorState,
    textToReplace: string,
    lineStart: number,
    currentBlockKey: string,
    currentLineText: string
  ): EditorState => {
    let newContentState: ContentState = Modifier.replaceText(
      newState.getCurrentContent(),
      new SelectionState({
        anchorKey: currentBlockKey,
        anchorOffset: lineStart,
        focusKey: currentBlockKey,
        focusOffset: lineStart + currentLineText.length,
      }),
      textToReplace
    );
    let updatedState: EditorState = EditorState.push(newState, newContentState, 'insert-characters');

    // Style textToReplace with CHECK_STYLE when textToReplace is CHECK_COMMAND and mostSimilarFacetTitleToInsert
    if (textToReplace === CHECK_COMMAND || textToReplace === mostSimilarFacetTitleToInsert) {
      newContentState = Modifier.applyInlineStyle(
        updatedState.getCurrentContent(),
        new SelectionState({
          anchorKey: currentBlockKey,
          anchorOffset: lineStart,
          focusKey: currentBlockKey,
          focusOffset: lineStart + textToReplace.length,
        }),
        CHECK_STYLE
      );
      updatedState = EditorState.push(updatedState, newContentState, 'change-inline-style');
    }

    // Move the cursor to the end of the line
    updatedState = forceSelection(updatedState, lineStart + textToReplace.length, currentBlockKey);

    return updatedState;
  };

  // Helper function to remove the checkedValue and the CHECK_STYLE, and move cursor to the beginning of the line
  const handleCheckQuit = (
    newState: EditorState,
    lineStart: number,
    checkedValue: string,
    currentBlockKey: string,
    styleToRemove: string
  ): EditorState => {
    // Remove the inline style
    let newContentState: ContentState = Modifier.removeInlineStyle(
      newState.getCurrentContent(),
      new SelectionState({
        anchorKey: currentBlockKey,
        anchorOffset: lineStart,
        focusKey: currentBlockKey,
        focusOffset: lineStart + checkedValue.length,
      }),
      styleToRemove
    );
    let updatedState: EditorState = EditorState.push(newState, newContentState, 'change-inline-style');

    // Remove the checkedValue
    newContentState = Modifier.removeRange(
      updatedState.getCurrentContent(),
      new SelectionState({
        anchorKey: currentBlockKey,
        anchorOffset: lineStart,
        focusKey: currentBlockKey,
        focusOffset: lineStart + checkedValue.length,
      }),
      'backward'
    );
    updatedState = EditorState.push(updatedState, newContentState, 'remove-range');

    // Move the cursor to the beginning of the line
    updatedState = forceSelection(updatedState, lineStart, currentBlockKey);

    return updatedState;
  };

  // Helper function to check if the first visible character after current cursor is in a "FACET_TITLE" block or none
  const isFirstVisibleCharInFacetTitleOrNone = (editorState: EditorState): boolean => {
    const getStartKey = editorState.getSelection().getStartKey();
    const getStartOffset = editorState.getSelection().getStartOffset();
    const contentState = editorState.getCurrentContent();
    const blockTypes = getArticleContentType(editorState);
    let startChecking = false;

    for (const [i, block] of contentState.getBlocksAsArray().entries()) {
      if (block.getKey() === getStartKey) {
        startChecking = true;
      }
      if (!startChecking) continue;

      const startOffset = block.getKey() === getStartKey ? getStartOffset : 0;
      const firstVisibleCharIndex = block.getText().slice(startOffset).search(/\S/);

      if (firstVisibleCharIndex === -1) continue;

      return blockTypes[block.getKey()] === FACET_TITLE;
    }

    return true;
  };

  useEffect(() => {
    let initialArticle: Article | null = null;

    if (paramId) {
      const savedContent = localStorage.getItem(paramId);
      if (savedContent) {
        try {
          const savedDataJS = JSON.parse(savedContent);
          const facetsList = List(savedDataJS.articleContent.facets.map(FacetRecord));
          const savedData: Article = ArticleRecord({
            id: savedDataJS.id,
            date: savedDataJS.date,
            articleContent: ArticleContentRecord({
              ...savedDataJS.articleContent,
              facets: facetsList
            })
          });
          initialArticle = ArticleRecord({
            id: savedData.get('id'),
            date: savedData.get('date'),
            articleContent: ArticleContentRecord(savedData.get('articleContent'))
          });
        } catch (error) {
          console.error("Error loading content from local storage:", error);
        }
      }
      setId(paramId);
    } else {
      const newId = new Date().getTime().toString();
      setId(newId);
    }

    if (initialArticle && initialArticle.get('articleContent')) {
      const initialEditorState = articleContentToEditorState(initialArticle.get('articleContent'));
      setTitle(initialArticle.get('articleContent').title);
      setDate(initialArticle.get('date'));
      setEditorState(initialEditorState);

      prevCharacterCount = initialEditorState.getCurrentContent().getPlainText().length;// For saving detection
    } else {
      const emptyState = EditorState.createEmpty();
      setEditorState(emptyState);
      // Only save the initial empty state if paramId was not provided
      if (!paramId) {
        updateToSave(emptyState);
      }
    }

    setIsInitializing(false);
  }, [paramId]);

  // Auto focus on editor.
  useEffect(() => {
    const timer = setTimeout(() => {
      editorRef.current?.focus();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const onChange = (newState: EditorState) => {
    let updatedState = newState;  // Initialize to newState

    const currentBlockKey = updatedState.getSelection().getStartKey();
    const currentBlockText = updatedState.getCurrentContent().getBlockForKey(currentBlockKey).getText();
    const currentSelection = updatedState.getSelection();

    // Toggle block type to ArticleContent block type
    const articleContentTypeMapping = getArticleContentType(updatedState);
    const currentBlockTypeInArticleContent = articleContentTypeMapping[currentBlockKey];
    const currentBlockType = updatedState.getCurrentContent().getBlockForKey(currentSelection.getStartKey()).getType();
    if (currentBlockTypeInArticleContent !== currentBlockType) {
      updatedState = RichUtils.toggleBlockType(updatedState, currentBlockTypeInArticleContent);
    }

    const startOffset = currentSelection.getStartOffset();
    const { lineStart, lineEnd, currentLineText } = getLineBoundsAndText(currentBlockText, startOffset);

    // Initial check command when the user types ':check' at the beginning of the line in the bottom of the facet or the article
    if (currentLineText === CHECK_COMMAND
      && currentBlockTypeInArticleContent === FACET_CONTENT
      && isFirstVisibleCharInFacetTitleOrNone(updatedState)) {
      setEditorIsLocked(true);

      updatedState = handleCheckExecution(newState, CHECK_COMMAND, lineStart, currentBlockKey, currentLineText);

      setCheckStep(CheckStep.ToInsertMostFacetTitle);

      setEditorState(updatedState);
    }

    // Save the updated state if it's not initializing
    if (!isInitializing) {  // Check if initialization is complete
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Set a new timeout to save after a delay
      saveTimeoutRef.current = window.setTimeout(() => {
        updateToSave(updatedState);
      }, 1000);  // Delay of 1 second
    }

    setEditorState(updatedState); // Final update to the EditorState
  };

  const myKeyBindingFn = useCallback((e: React.KeyboardEvent<{}>): string | null => {
    if (editorIsLocked) {
      if (e.key === 'Enter') {
        return 'execute-check';
      }
      if (e.key === 'Backspace' || e.key === 'Escape') {
        return 'quit-check';
      }
      return 'noop'; // Do nothing for other keys
    }
    return getDefaultKeyBinding(e);
  }, [editorIsLocked]);

  const handleKeyCommand = (command: string, newState: EditorState): DraftHandleValue => {
    const currentBlockKey = newState.getSelection().getStartKey();
    const currentBlockText = newState.getCurrentContent().getBlockForKey(currentBlockKey).getText();
    const currentSelection = newState.getSelection();
    const startOffset = currentSelection.getStartOffset();
    const { lineStart, lineEnd, currentLineText } = getLineBoundsAndText(currentBlockText, startOffset);

    let updatedState = newState;

    if (command === 'noop') {
      return 'handled';  // Do nothing
    }

    if (command === 'execute-check') {
      if (checkStep === CheckStep.ToInsertMostFacetTitle) {
        const updatedState = handleCheckExecution(newState, mostSimilarFacetTitleToInsert, lineStart, currentBlockKey, currentLineText);
        setEditorState(updatedState);
        setCheckStep(CheckStep.ToInsertFacetContent);
      } else if (checkStep === CheckStep.ToInsertFacetContent) {
        const updatedState = handleCheckExecution(newState, facetContentToInsert, lineStart, currentBlockKey, currentLineText);
        setEditorState(updatedState);
        setCheckStep(null);
        setEditorIsLocked(false);
      }
      return 'handled';
    }

    if (command === 'quit-check') {
      if (checkStep === CheckStep.ToInsertMostFacetTitle) {
        updatedState = handleCheckQuit(newState, lineStart, CHECK_COMMAND, currentBlockKey, CHECK_STYLE);
      } else if (checkStep === CheckStep.ToInsertFacetContent) {
        updatedState = handleCheckQuit(newState, lineStart, mostSimilarFacetTitleToInsert, currentBlockKey, CHECK_STYLE);
      }

      setEditorState(updatedState);
      setCheckStep(null);
      setEditorIsLocked(false);

      return 'handled';
    }


    return 'not-handled';
  };


  const blockStyleFn = (contentBlock: ContentBlock) => {
    const type = contentBlock.getType();

    if (type === ARTICLE_TITLE) {
      return ARTICLE_TITLE;
    }

    if (type === FACET_TITLE) {
      return FACET_TITLE;
    }

    return type.trim(); // or any other logic you may have
  };

  const styleMap = {
    'CHECK_STYLE': {
      color: '#008F11',
      fontWeight: '400'
    },
  };

  const isEditorEmpty = (editorState: EditorState) => {
    const plainText = editorState.getCurrentContent().getPlainText();
    return !plainText.trim().length;
  };

  const handlePastedText = (text: string, _: string | undefined, editorState: EditorState): 'handled' | 'not-handled' => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const newContentState = Modifier.insertText(contentState, selection, text);
    const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');

    setEditorState(newEditorState);

    updateToSave(newEditorState);
    return 'handled';
  };

  if (!editorState) {
    return null; // Stop here if editorState is not yet set.
  }


  return (
    <div className={`article ${editorIsLocked ? 'locked' : ''}`}>  {/* <-- Add this wrapper div */}
      <div
        onClick={() => editorRef.current?.focus()}
      >
        {isEditorEmpty(editorState) && (
          <div className='article-title-placeholder'>
            Type title and start writing by Enter pressed.
          </div>
        )}
        <Editor
          spellCheck={true}
          ref={editorRef}
          editorState={editorState}
          onChange={onChange}
          blockStyleFn={blockStyleFn}
          handlePastedText={handlePastedText}  // add this line
          keyBindingFn={myKeyBindingFn}
          customStyleMap={styleMap}
          handleKeyCommand={handleKeyCommand}
        />
      </div>

    </div>
  );
};

export default MyEditor;

