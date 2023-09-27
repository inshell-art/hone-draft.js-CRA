import React, { useState, useRef, useEffect } from 'react';
import { Editor, EditorState, ContentBlock, DefaultDraftBlockRenderMap, EditorBlock, Modifier, ContentState, genKey, getDefaultKeyBinding } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { OrderedMap } from 'immutable';

const MyEditor: React.FC = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [commandLineActive, setCommandLineActive] = useState(false);
  const editorRef = useRef<Editor>(null);
  const [step, setStep] = useState(0);


  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  useEffect(() => {
    console.log('commandLineActive changed:', commandLineActive);
  }, [commandLineActive]);


  const onChange = (newState: EditorState) => {
    const currentBlockKey = newState.getSelection().getStartKey();
    const currentBlockText = newState.getCurrentContent().getBlockForKey(currentBlockKey).getText();
    const cursorPosition = newState.getSelection().getStartOffset();

    const isCommandMode = currentBlockText === ':check' && cursorPosition === 6;

    console.log('isCommandMode', isCommandMode);

    if (isCommandMode !== commandLineActive) {
      setCommandLineActive(isCommandMode);
    }

    console.log('commandLineActive', commandLineActive);

    setEditorState(newState);
  };



  const handleReturn = () => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const currentBlockKey = selection.getStartKey();
    const currentBlockText = contentState.getBlockForKey(currentBlockKey).getText();
    const blockSelection = selection.merge({
      anchorKey: currentBlockKey,
      focusKey: currentBlockKey,
      anchorOffset: 0,
      focusOffset: currentBlockText.length, // Length of the current block text
    }) as any;

    let newString = "";
    let newStep = step;

    if (commandLineActive && step === 0) {
      newString = "$ This is a facet title";
      newStep = 1;
    } else if (step === 1 && currentBlockText === "$ This is a facet title") {
      newString = "the facet content inserted";
      newStep = 0; // Reset to initial state
    } else {
      return 'not-handled';
    }

    const newContentState = Modifier.replaceText(contentState, blockSelection, newString);
    const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');

    // Update the editor state and exit command mode
    setEditorState(newEditorState);
    setCommandLineActive(false);
    setStep(newStep);

    return 'handled';
  };

  const keyBindingFn = (e: React.KeyboardEvent) => {
    if (e.keyCode === 27) { // 27 is the key code for the Esc key
      return 'delete-line';
    }
    return getDefaultKeyBinding(e);
  };

  const handleKeyCommand = (command: string, editorState: EditorState) => {
    if (command === 'delete-line') {
      const contentState = editorState.getCurrentContent();
      const selection = editorState.getSelection();
      const currentBlockKey = selection.getStartKey();
      const currentBlockText = contentState.getBlockForKey(currentBlockKey).getText();

      if (currentBlockText === "$ This is a facet title") {
        const blockSelection = selection.merge({
          anchorKey: currentBlockKey,
          focusKey: currentBlockKey,
          anchorOffset: 0,
          focusOffset: currentBlockText.length, // Length of the current block text
        }) as any;

        const newContentState = Modifier.replaceText(contentState, blockSelection, "");
        const newEditorState = EditorState.push(editorState, newContentState, 'delete-character');

        setEditorState(newEditorState);
        setCommandLineActive(false);  // Reset the commandLineActive state
        return 'handled';
      }
    }
    return 'not-handled';
  };


  const blockStyleFn = (contentBlock: ContentBlock) => {
    const currentBlockKey = editorState.getSelection().getStartKey();
    const text = contentBlock.getText();
    let styles = '';

    if (text.startsWith('$')) {
      styles += 'bold-line ';
    }

    return styles.trim();
  };

  return (
    <div>
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
          keyBindingFn={keyBindingFn}
          handleKeyCommand={handleKeyCommand}

        />
      </div>
    </div>
  );
};

export default MyEditor;

