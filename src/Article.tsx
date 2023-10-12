import React, { useState, useRef, useEffect } from 'react';
import { Editor, EditorState, ContentBlock, RichUtils, convertFromRaw, Modifier, ContentState, genKey, CharacterMetadata, getDefaultKeyBinding } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { useParams } from 'react-router-dom';
import { Article, ArticleContent, Facet } from './types';
import './App.css';
import { List } from 'immutable';

function getBlockTypeFromText(text: string, index: number, currentFacet: Facet | null): string {
  if (index === 0) {
    return 'article-title';
  }
  if (text.startsWith('$')) {
    return 'facet-title';
  }
  if (currentFacet && !text.startsWith('$')) {
    return 'facet-content';
  }
  return 'non-facet';
}

function editorStateToArticleContent(editorState: EditorState): ArticleContent {
  const contentState = editorState.getCurrentContent();
  const blockArray = contentState.getBlocksAsArray();

  let title = '';
  let facets: Facet[] = [];
  let currentFacet: Facet | null = null;
  let nonFacet = '';

  let currentFacetContentLines: string[] = []; // Temporary array for facet content
  let nonFacetLines: string[] = []; // Temporary array for nonFacet

  let type = ''; // Define type outside the loop for scope reasons

  blockArray.forEach((block, index) => {
    const text = block.getText();
    type = getBlockTypeFromText(text, index, currentFacet); // Update type in each iteration

    if (type === 'article-title') {
      title = text;
    }
    if (type === 'facet-title') {
      if (currentFacet) {
        currentFacet.content = currentFacetContentLines.join('\n');
        facets.push(currentFacet);
        currentFacetContentLines = [];
      }
      currentFacet = { title: text.substring(1).trim(), content: '' } as Facet;
    }
    if (type === 'facet-content') {
      currentFacetContentLines.push(text);
    }
    if (type === 'non-facet') {
      nonFacetLines.push(text);
    }
  });

  // Handle the last facet after loop completion
  if (currentFacet) {
    (currentFacet as Facet).content = currentFacetContentLines.join('\n');
    facets.push(currentFacet);
  }

  nonFacet = nonFacetLines.join('\n');

  return {
    title,
    nonFacet,
    facets
  };
}

function articleContentToEditorState(articleContent: ArticleContent): EditorState {
  const blocks: ContentBlock[] = [];

  // Add title
  blocks.push(new ContentBlock({
    key: genKey(),
    type: 'article-title',
    text: articleContent.title,
    characterList: List(Array(articleContent.title.length).fill(CharacterMetadata.create())),
  }));

  // Add non-facet
  // Add non-facet only if there's content
  if (articleContent.nonFacet.trim() !== '') {
    blocks.push(new ContentBlock({
      key: genKey(),
      type: 'non-facet',
      text: articleContent.nonFacet,
      characterList: List(Array(articleContent.nonFacet.length).fill(CharacterMetadata.create())),
    }));
  }

  // Add facets
  articleContent.facets.forEach(facet => {
    blocks.push(new ContentBlock({
      key: genKey(),
      type: 'facet-title',
      text: `$ ${facet.title}`,
      characterList: List(Array(facet.title.length + 2).fill(CharacterMetadata.create())),
    }));

    blocks.push(new ContentBlock({
      key: genKey(),
      type: 'facet-content',
      text: facet.content,
      characterList: List(Array(facet.content.length).fill(CharacterMetadata.create())),
    }));
    console.log("article facet content");

  });
  const contentState = ContentState.createFromBlockArray(blocks);
  return EditorState.createWithContent(contentState);
}



const MyEditor: React.FC = () => {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string | null>(null);
  const [id, setId] = useState<string>(''); // ADDED: state for article ID
  const editorRef = useRef<Editor>(null);
  const { id: paramId } = useParams<{ id: string }>(); // ADDED: Get the article id from the route params
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentFacet, setCurrentFacet] = useState<Facet | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  const getCurrentDate = (): string => {
    const today = new Date();
    const dateStr = `${today.getFullYear()} ${today.toLocaleString('default', { month: 'short' })} ${today.getDate()}`;
    return dateStr;
  };

  const updateToSave = (newEditorState: EditorState | null) => {
    const articleContent = newEditorState ? editorStateToArticleContent(newEditorState) : null; // New line
    const currentDate = getCurrentDate();  // Get the current date

    const dataToSave: Article = {
      id: id,
      date: currentDate,
      articleContent: articleContent  // Updated line
    };


    localStorage.setItem(id, JSON.stringify(dataToSave));

  };

  useEffect(() => {
    let initialArticle: Article | null = null;

    if (paramId) {
      const savedContent = localStorage.getItem(paramId);

      if (savedContent) {
        try {
          const savedData: Article = JSON.parse(savedContent);
          initialArticle = savedData;
        } catch (error) {
          console.error("Error loading content from local storage:", error);
        }
      }
      setId(paramId);
    } else {
      const newId = new Date().getTime().toString();
      setId(newId);// we create a new id already 
      updateToSave(EditorState.createEmpty());

    }

    if (initialArticle && initialArticle.articleContent) {
      const initialEditorState = articleContentToEditorState(initialArticle.articleContent); // Your new function
      setTitle(initialArticle.articleContent.title);
      setDate(initialArticle.date);
      setEditorState(initialEditorState);
    } else {
      const emptyState = EditorState.createEmpty();
      setEditorState(emptyState);
      updateToSave(emptyState); // Save the initial empty state
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
    // Autofill 'check' after ':'.
    const currentBlockText = newState.getCurrentContent().getBlockForKey(newState.getSelection().getStartKey()).getText();
    const currentBlockKey = newState.getSelection().getStartKey();
    const currentBlockIndex = newState.getCurrentContent().getBlockMap().keySeq().indexOf(currentBlockKey);

    if (currentBlockText.startsWith(':') && newState.getSelection().getStartOffset() === 1) {
      const contentState = newState.getCurrentContent();
      const selection = newState.getSelection();
      const newContentState = Modifier.insertText(contentState, selection, 'check');
      newState = EditorState.push(newState, newContentState, 'insert-characters');
    }

    // Update types of blocks
    // Get the current block type
    const selection = newState.getSelection();
    const blockType = newState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();
    // Determine the new block type based on the text
    const newBlockType = getBlockTypeFromText(currentBlockText, currentBlockIndex, currentFacet);  // Pass the currentFacet state
    // If the new block type is different, toggle it
    if (newBlockType !== blockType) {
      newState = RichUtils.toggleBlockType(newState, newBlockType);
    }

    if (newBlockType === 'facet-title') {
      setCurrentFacet({ title: currentBlockText.substring(1).trim(), content: '' });
    }
    console.log(currentFacet)

    // Save to local storage.
    if (!isInitializing) { // Check if initialization is complete
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set a new timeout to save after a delay
      saveTimeoutRef.current = window.setTimeout(() => {
        updateToSave(newState);
      }, 1000); // this sets a delay of 1 second, adjust as needed
    }

    setEditorState(newState);
  };

  // The minimalistic command line.
  const handleReturn = (e: any, editorState: EditorState) => {
    const currentBlockText = editorState.getCurrentContent().getBlockForKey(editorState.getSelection().getStartKey()).getText();
    let newEditorState;

    if (currentBlockText === ":check") {
      const selection = editorState.getSelection();
      const blockSelection = selection.merge({
        anchorOffset: 0,
        focusOffset: currentBlockText.length,
      }) as any;
      newEditorState = EditorState.push(editorState, Modifier.replaceText(editorState.getCurrentContent(), blockSelection, "$ this is the facet title"), 'change-block-data');
    } else if (currentBlockText === "$ this is the facet title") {
      const multiLineText = "the facet contents are a lot, \n and they are all inserted.";

      const selection = editorState.getSelection();
      const blockSelection = selection.merge({
        anchorOffset: 0,
        focusOffset: currentBlockText.length,
      }) as any;
      newEditorState = EditorState.push(editorState, Modifier.replaceText(editorState.getCurrentContent(), blockSelection, multiLineText), 'change-block-data');
    } else {
      return 'not-handled';
    }

    setEditorState(newEditorState);
    return 'handled';
  };

  const blockStyleFn = (contentBlock: ContentBlock) => {
    const type = contentBlock.getType();
    let styles = '';

    if (type === 'article-title') {
      return 'article-title';
    }
    if (type === 'facet-title') {
      return 'facet-title';
    }

    return type.trim();
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
    return 'handled';
  };


  if (!editorState) {
    return null; // Stop here if editorState is not yet set.
  }

  return (
    <div className="article">  {/* <-- Add this wrapper div */}
      <div
        onClick={() => editorRef.current?.focus()}
      >
        {isEditorEmpty(editorState) && (
          <div className='article-title-placeholder'>
            Type title then start writing by Enter pressed.
          </div>
        )}
        <Editor
          spellCheck={true}
          ref={editorRef}
          editorState={editorState}
          onChange={onChange}
          blockStyleFn={blockStyleFn}
          handleReturn={handleReturn}
          handlePastedText={handlePastedText}  // add this line
        />
      </div>

    </div>
  );
};

export default MyEditor;

