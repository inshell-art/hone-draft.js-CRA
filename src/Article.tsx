import React, { useState, useRef, useEffect } from 'react';
import { Editor, EditorState, ContentBlock, convertToRaw, convertFromRaw, Modifier, ContentState, genKey, CharacterMetadata, getDefaultKeyBinding } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { useParams } from 'react-router-dom';
import { Article, Facet, ArticleContentBlock } from './types';
import './App.css';
import { List } from 'immutable';


const MyEditor: React.FC = () => {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string | null>(null);
  const [id, setId] = useState<string>(''); // ADDED: state for article ID

  const editorRef = useRef<Editor>(null);
  const { id: paramId } = useParams<{ id: string }>(); // ADDED: Get the article id from the route params

  const [isInitializing, setIsInitializing] = useState(true);

  // Function to define facets based on the editor state
  const defineFacets = (editorState: EditorState) => {
    const contentState = editorState.getCurrentContent();
    const blockArray = contentState.getBlocksAsArray();

    let facets: Facet[] = [];
    let currentFacet: Facet | null = null;

    blockArray.forEach((block) => {
      const text = block.getText();
      if (text.startsWith('$')) {
        if (currentFacet) {
          facets.push(currentFacet);
        }
        currentFacet = { title: text.substring(1).trim(), content: '' };
      } else if (currentFacet) {
        currentFacet.content += text + '\n';
      }
    });

    if (currentFacet) {
      facets.push(currentFacet);
    }

    return facets;
  };
  // Convert editor state to content blocks
  const editorStateToArticleContentBlock = (editorState: EditorState): ArticleContentBlock[] => {
    const rawContent = convertToRaw(editorState.getCurrentContent());
    const facets = defineFacets(editorState);

    let contentBlocks: ArticleContentBlock[] = [];

    // Add non-facet content and facets to contentBlocks
    rawContent.blocks.forEach((block) => {
      const text = block.text;
      if (!text.startsWith('$')) {
        contentBlocks.push(text);
      } else {
        const facet = facets.find(f => f.title === text.substring(1).trim());
        if (facet) {
          contentBlocks.push(facet);
        }
      }
    });

    return contentBlocks;
  };

  function convertArticleContentBlockToRaw(contentBlocks: ArticleContentBlock[]): ContentState {
    let blocks: ContentBlock[] = [];

    contentBlocks.forEach(block => {
      if (typeof block === "string") {
        blocks.push(new ContentBlock({
          key: genKey(),
          type: 'unstyled',
          text: block,
          characterList: List(Array(block.length).fill(CharacterMetadata.create())),
        }));
      } else {
        // This assumes block is a Facet
        const facet = block as Facet;
        blocks.push(new ContentBlock({
          key: genKey(),
          type: 'header-one', // Or some custom block type for facet titles
          text: "$ " + facet.title,
          characterList: List(Array(("$ " + facet.title).length).fill(CharacterMetadata.create())),
        }));
        blocks.push(new ContentBlock({
          key: genKey(),
          type: 'unstyled',
          text: facet.content,
          characterList: List(Array(facet.content.length).fill(CharacterMetadata.create())),
        }));
      }
    });

    return ContentState.createFromBlockArray(blocks);
  }

  const getCurrentDate = (): string => {
    const today = new Date();
    const dateStr = `${today.getFullYear()} ${today.toLocaleString('default', { month: 'short' })} ${today.getDate()}`;
    return dateStr;
  };
  // Save to localStorage when editor state or title changes
  const updateToSave = (newEditorState: EditorState | null, newTitle: string) => {
    const contentBlocks = newEditorState ? editorStateToArticleContentBlock(newEditorState) : [];
    const currentDate = getCurrentDate();  // Get the current date

    const oldData = localStorage.getItem(id);
    const oldRawContent = oldData ? JSON.parse(oldData).content : null;
    const oldTitle = oldData ? JSON.parse(oldData).title : null;

    // Convert contentBlocks to a comparable format (e.g., string)
    const newRawContentString = JSON.stringify(contentBlocks);

    // Compare new and old data
    if (newTitle !== oldTitle || newRawContentString !== JSON.stringify(oldRawContent)) {
      // Update the date and editor state if title or content has changed
      setDate(currentDate);

      const dataToSave: Article = {
        id: id,
        title: newTitle,
        content: contentBlocks,
        date: currentDate
      };

      localStorage.setItem(id, JSON.stringify(dataToSave));
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);

    if (!isInitializing) {  // Check if initialization is complete
      updateToSave(editorState, newTitle); // Call updateToSave when title changes
    }
  };

  useEffect(() => {
    let initialTitle = '';
    let initialEditorState = EditorState.createEmpty();
    let initialDate = '';

    // Determine if we are editing an existing article or creating a new one
    if (paramId) {
      // Editing existing article
      setId(paramId);

      const savedContent = localStorage.getItem(paramId);

      if (savedContent) {
        try {
          const savedData = JSON.parse(savedContent);

          if (savedData.content) {
            const contentState = convertArticleContentBlockToRaw(savedData.content);
            initialEditorState = EditorState.createWithContent(contentState);
          }

          if (savedData.title) {
            initialTitle = savedData.title;
          }

          if (savedData.date) {
            initialDate = savedData.date;
          }
        } catch (error) {
          console.error("Error loading content from local storage:", error);
        }
      }
    } else {
      // Creating a new article
      const newId = new Date().getTime().toString();
      setId(newId);
    }

    setTitle(initialTitle);
    setEditorState(initialEditorState);
    setDate(initialDate);

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 100);

    setIsInitializing(false);

  }, [paramId]);


  const onChange = (newState: EditorState) => {
    const currentBlockText = newState.getCurrentContent().getBlockForKey(newState.getSelection().getStartKey()).getText();
    // Autofill 'check' after ':'.
    if (currentBlockText.startsWith(':') && newState.getSelection().getStartOffset() === 1) {
      const contentState = newState.getCurrentContent();
      const selection = newState.getSelection();
      const newContentState = Modifier.insertText(contentState, selection, 'check');
      newState = EditorState.push(newState, newContentState, 'insert-characters');
    }
    // Save to local storage.

    if (!isInitializing) {  // Check if initialization is complete
      updateToSave(newState, title); // Call updateToSave when editor state changes
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

  // Facet title styles.
  const blockStyleFn = (contentBlock: ContentBlock) => {
    const currentBlockKey = editorState!.getSelection().getStartKey();
    const text = contentBlock.getText();
    const blockKey = contentBlock.getKey();
    const firstBlockKey = editorState!.getCurrentContent().getFirstBlock().getKey();
    let styles = '';

    if (blockKey === firstBlockKey) {
      styles += 'article-title ';
    }

    if (text.startsWith('$')) {
      styles += 'facet-title ';
    }

    return styles.trim();
  };

  const isEditorEmpty = (editorState: EditorState) => {
    const plainText = editorState.getCurrentContent().getPlainText();
    return !plainText.trim().length;
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
          ref={editorRef}
          editorState={editorState}
          onChange={onChange}
          blockStyleFn={blockStyleFn}
          handleReturn={handleReturn}
        />
      </div>

    </div>
  );
};

export default MyEditor;

