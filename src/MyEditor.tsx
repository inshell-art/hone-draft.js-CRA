import React, { useState, useRef, useEffect } from 'react';
import { Editor, EditorState, ContentBlock, DefaultDraftBlockRenderMap, EditorBlock, Modifier, ContentState, genKey } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { OrderedMap } from 'immutable';

// A function that inserts a new block below the current block
function insertNewBlockBelowCurrentBlock(editorState: EditorState, blockText: string): EditorState {
  const currentContent = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const currentBlockKey = selection.getStartKey();
  const currentBlock = currentContent.getBlockForKey(currentBlockKey);

  // Split the block at the current cursor position
  const afterSplit = Modifier.splitBlock(currentContent, selection);

  // Create a new block with the given text
  const newBlockKey = genKey();
  const newBlock = new ContentBlock({
    key: newBlockKey,
    type: 'unstyled',
    text: blockText,
  });

  // Insert the new block below the current block
  const blockMap = afterSplit.getBlockMap();
  const blocksBefore = blockMap.toSeq().takeUntil((v) => v === currentBlock);
  const blocksAfter = blockMap.toSeq().skipUntil((v) => v === currentBlock).rest();
  const newBlockMap: OrderedMap<string, ContentBlock> = blocksBefore.concat([[currentBlockKey, currentBlock], [newBlockKey, newBlock]], blocksAfter).toOrderedMap();

  // Create a new content state with the new block
  const newContentState: ContentState = afterSplit.merge({
    blockMap: newBlockMap,
    selectionBefore: selection,
    selectionAfter: selection,
  }) as ContentState;

  // Push the new content state to the editor state
  return EditorState.push(editorState, newContentState, 'insert-fragment');
}

const MyEditor: React.FC = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [commandLineActive, setCommandLineActive] = useState(false);
  const editorRef = useRef<Editor>(null);
  const commandLineActiveRef = useRef(false); // Use a ref instead of state


  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (editorState) {
      // Force re-render by creating a new EditorState with the same content
      setEditorState(EditorState.set(editorState, { allowUndo: true }));
    }
  }, [commandLineActive]);


  const onChange = (newState: EditorState) => {
    const currentBlockKey = newState.getSelection().getStartKey();
    const currentBlockText = newState.getCurrentContent().getBlockForKey(currentBlockKey).getText();
    const cursorPosition = newState.getSelection().getStartOffset();

    console.log(`Current Block Text: ${currentBlockText}`);
    console.log(`Cursor Position: ${cursorPosition}`);

    const shouldActivateCommandMode = currentBlockText === ':check' && cursorPosition === 6;
    if (shouldActivateCommandMode !== commandLineActiveRef.current) {
      commandLineActiveRef.current = shouldActivateCommandMode;
      // Force re-render by creating a new EditorState with the same content
      setEditorState(EditorState.set(editorState, { allowUndo: true }));
    }

    if (shouldActivateCommandMode !== commandLineActive) {
      setCommandLineActive(shouldActivateCommandMode);
    }

    setEditorState(newState);
  };


  const handleReturn = () => {
    if (commandLineActive) {
      const newString = "$ This is a facet title"; // Replace with the string you want
      const contentState = editorState.getCurrentContent();
      const selection = editorState.getSelection();
      const currentBlockKey = selection.getStartKey();
      const blockSelection = selection.merge({
        anchorKey: currentBlockKey,
        focusKey: currentBlockKey,
        anchorOffset: 0,
        focusOffset: 6, // Length of ":check"
      }) as any;

      const newContentState = Modifier.replaceText(contentState, blockSelection, newString);
      const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');
      setEditorState(newEditorState);
      setCommandLineActive(false); // Exit command mode
      return 'handled';
    }
    return 'not-handled';
  };





  const blockRendererFn = (contentBlock: ContentBlock) => {
    const type = contentBlock.getType();
    const currentBlockKey = editorState.getSelection().getStartKey();
    // Disable editing for all blocks except the command line
    if (commandLineActive && contentBlock.getKey() !== currentBlockKey) {
      return {
        component: (props: { children: React.ReactNode }) => <EditorBlock {...props} />,
        editable: false,
      };
    }
    return DefaultDraftBlockRenderMap.get(type);
  };

  const blockStyleFn = (contentBlock: ContentBlock) => {
    const currentBlockKey = editorState.getSelection().getStartKey();
    const text = contentBlock.getText();
    let styles = '';

    if (text.startsWith('$')) {
      styles += 'bold-line ';
    }

    if (commandLineActiveRef.current && contentBlock.getKey() === currentBlockKey) {
      styles += 'command-block ';
    }

    if (commandLineActive && contentBlock.getKey() !== currentBlockKey) {
      styles += 'darker-block';
    }

    return styles.trim();
  };



  return (
    <div>
      <div
        className={commandLineActive ? 'command-block' : ''}
        style={{ border: '1px solid black', minHeight: '400px', padding: '10px' }}
        onClick={() => editorRef.current?.focus()}
      >
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={onChange}
          blockRendererFn={blockRendererFn}
          blockStyleFn={blockStyleFn}
          handleReturn={handleReturn}
        />
      </div>
    </div>
  );
};

export default MyEditor;

