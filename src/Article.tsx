import React, { useState, useRef, useEffect } from 'react';
import { Editor, EditorState, ContentBlock, convertToRaw, convertFromRaw, Modifier, ContentState, genKey, getDefaultKeyBinding } from 'draft-js';
import 'draft-js/dist/Draft.css';

const MyEditor: React.FC = () => {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string | null>(null);

  const editorRef = useRef<Editor>(null);

  const getCurrentDate = (): string => {
    const today = new Date();
    return `${today.getFullYear()} ${today.toLocaleString('default', { month: 'short' })} ${today.getDate()}`;
  };

  useEffect(() => {
    let initialTitle = '';
    let initialEditorState = EditorState.createEmpty();
    let initialDate = '';
    const savedContent = localStorage.getItem('editorContent');

    if (savedContent) {
      try {
        const savedData = JSON.parse(savedContent);

        if (savedData.content) {
          const contentState = convertFromRaw(savedData.content);
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

    setTitle(initialTitle);
    setEditorState(initialEditorState);
    setDate(initialDate);

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 100); // introducing a small delay before setting focus
  }, []);


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
    const rawContent = convertToRaw(newState.getCurrentContent());
    const currentDate = getCurrentDate();  // Get the current date
    setDate(currentDate);  // Update the date state

    const dataToSave = {
      content: rawContent,
      title: title,
      date: currentDate
    };

    localStorage.setItem('editorContent', JSON.stringify(dataToSave));
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
    let styles = '';

    if (text.startsWith('$')) {
      styles += 'bold-line ';
    }

    return styles.trim();
  };

  if (!editorState) {
    return null; // Stop here if editorState is not yet set.
  }

  return (
    <div>
      <div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter your title here"
        />
      </div>
      <div>{date}</div>
      <div
        style={{ border: '1px solid black', minHeight: '400px', padding: '10px' }}
        onClick={() => editorRef.current?.focus()}
      >
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

