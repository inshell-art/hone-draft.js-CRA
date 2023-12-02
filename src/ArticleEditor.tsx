import React, { useCallback, useEffect, useState } from "react";
import { ContentBlock, Editor, EditorState, Modifier, SelectionState, ContentState } from "draft-js";
import { set } from "lodash";

const setBlockType = (editorState: EditorState, blockKey: string, newType: string): EditorState => {
  const selection = SelectionState.createEmpty(blockKey);
  const updatedContentState = Modifier.setBlockType(editorState.getCurrentContent(), selection, newType);

  return EditorState.push(editorState, updatedContentState, 'change-block-type');
};

// block type is for styling, so article title and facet title are needed to be typed only 
const setBlockTypeToArticleTitleAndFacetTitle = (editorState: EditorState) => {
  const contentState = editorState.getCurrentContent();
  const selectionState = editorState.getSelection();
  const currentBlockKey = selectionState.getStartKey();
  const currentBlock = contentState.getBlockForKey(currentBlockKey);
  const text = currentBlock.getText();

  let checkType = null;
  if (currentBlockKey === contentState.getBlockMap().first().getKey()) {
    checkType = ARTICLE_TITLE;
  } else if (text.startsWith(FACET_TITLE_SYMBOL + ' ')) {
    checkType = FACET_TITLE;
  } else {
    checkType = 'unstyled'; // Ensure the type to be default in case of the block is split from article title or facet title
  };

  let isChanged = currentBlock.getType() !== checkType;

  if (isChanged && checkType) {
    const updatedContentState = Modifier.setBlockType(contentState, SelectionState.createEmpty(currentBlockKey), checkType);
    const newEditorState = EditorState.push(editorState, updatedContentState, 'change-block-type');
    const withPreservedSelection = EditorState.forceSelection(newEditorState, selectionState);

    // When undo to the block type change, the logic above will be executed again, it will cause a new history to cover the previous one
    // There is no appropriate way to prevent this for now, and the custom history management is overkill
    // So, keep the state update as few as possible, to keep the history as long as possible
    // So, the experience is users could redo to the last facet title, it's not perfect, but it's acceptable

    return withPreservedSelection;
  }

  return editorState;
};

const ARTICLE_TITLE = 'article-title';
const FACET_TITLE = 'facet-title';
const FACET_TITLE_SYMBOL = '$';

const ArticleEditor = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  // Set the first block to be an article title
  useEffect(() => {
    const initialContentState = ContentState.createFromText('');
    const initialEditorState = EditorState.createWithContent(initialContentState);

    const firstBlockKey = initialContentState.getBlockMap().first().getKey();
    const newEditorState = setBlockType(initialEditorState, firstBlockKey, 'article-title');

    setEditorState(newEditorState);
  }, []);


  const onChange = (newEditorState: EditorState) => {

    const updatedEditorState: EditorState = setBlockTypeToArticleTitleAndFacetTitle(newEditorState);

    // Only update state if the editor state has changed
    if (updatedEditorState !== editorState) {
      setEditorState(updatedEditorState);
    }
  };

  const blockStyleFn = (contentBlock: ContentBlock) => {
    const type = contentBlock.getType();

    switch (type) {
      case ARTICLE_TITLE:
        return 'article-title';
      case FACET_TITLE:
        return 'facet-title';
      default:
        return 'unstyled';
    }
  };

  return (
    <div>
      <Editor
        editorState={editorState}
        onChange={onChange}
        blockStyleFn={blockStyleFn}
      />
    </div>
  );
}

export default ArticleEditor;
