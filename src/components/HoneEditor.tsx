import { useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ContentBlock, Editor, EditorState, convertToRaw } from "draft-js";
import { updateHoneEditor } from "../slices/honeSlice";
import { getCurrentDate } from "../utils/utils";
import { ARTICLE_TITLE, FACET_TITLE, FACET_TITLE_SYMBOL } from "../utils/constants";
import { RootState } from "../store/store";
import { useSelector } from "react-redux";

const HoneEditor = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [prevPlainText, setPrevPlainText] = useState(editorState.getCurrentContent().getPlainText());
  const { articleId } = useParams();
  const dispatch = useDispatch();
  const articles = useSelector((state: RootState) => state.hone.articles);
  console.log("All articles:", articles);

  const onChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const currentPlainText = newEditorState.getCurrentContent().getPlainText();
    const rawContentState = convertToRaw(newEditorState.getCurrentContent());

    if (currentPlainText !== prevPlainText) {
      const articleDate = getCurrentDate();
      if (articleId) {
        dispatch(updateHoneEditor({ articleId, articleDate, rawContentState }));
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
