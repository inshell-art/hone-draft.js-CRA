import { ARTICLE_TITLE, FACET_TITLE_SYMBOL, FACET_TITLE } from "./constants";
import { EditorState, Modifier, ContentState, convertToRaw } from "draft-js";
import { Article, Facet, Block, ArticleFacetLink } from "../types/types";
import { HoneState } from "../types/types";

export const updateCustomBlockTypes = (editorState: EditorState) => {
  const selectionState = editorState.getSelection();
  const contentState = editorState.getCurrentContent();
  const currentBlockKey = selectionState.getStartKey();
  const currentBlock = contentState.getBlockForKey(currentBlockKey);
  const currentBlockType = currentBlock.getType();
  const text = currentBlock.getText();

  let newBlockType = currentBlockType;
  // The first block is always the article title
  // and the block starts with the FACET_TITLE_SYMBOL is a facet title
  if (currentBlockKey === contentState.getBlockMap().first().getKey()) {
    newBlockType = ARTICLE_TITLE;
  } else if (text.startsWith(FACET_TITLE_SYMBOL)) {
    newBlockType = FACET_TITLE;
  } else {
    newBlockType = "unstyled"; // Ensure alignment with draft-js
  }

  if (newBlockType !== currentBlockType) {
    const newContentState = Modifier.setBlockType(contentState, selectionState, newBlockType);
    const newEditorState = EditorState.push(editorState, newContentState, "change-block-type");

    return newEditorState;
  } else {
    return editorState;
  }
};

export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  // and time
  const time = now.getTime();

  return `${year}-${month}-${date}-${time}`;
};
