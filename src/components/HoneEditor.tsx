import React, { useEffect, useState } from "react";
import { ContentBlock, Editor, EditorState } from "draft-js";
import { useDispatch, useSelector } from "react-redux";
import { updateHoneEditor } from "../slices/honeSlice";
import { useParams, useNavigate } from "react-router-dom";
import { getCurrentDate } from "../utils/utils";
import { ARTICLE_TITLE, FACET_TITLE, FACET_TITLE_SYMBOL } from "../utils/constants";
import "../App.css";

const HoneEditor = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [prevPlainText, setPrevPlainText] = useState(editorState.getCurrentContent().getPlainText());
  const { articleId } = useParams();
  const dispatch = useDispatch();

  const onChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const currentPlainText = newEditorState.getCurrentContent().getPlainText();

    if (currentPlainText !== prevPlainText) {
      const articleDate = getCurrentDate();
      if (articleId) {
        dispatch(updateHoneEditor({ articleId, articleDate, editorState: newEditorState }));
      }
      setPrevPlainText(currentPlainText);
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

    return "";
  };

  return <Editor editorState={editorState} onChange={onChange} blockStyleFn={blockStyleFn} />;
};

export default HoneEditor;
