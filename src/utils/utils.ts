import { EditorState, convertFromRaw, RawDraftContentState } from "draft-js";
import { fetchArticle } from "../services/indexedDBService";

export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  // and time
  const time = now.getTime();

  return `${year}-${month}-${date}-${time}`;
};

// load article from indexedDB with article id passed in
export const loadArticle = async (articleId: string) => {
  const article = await fetchArticle(articleId);
  if (article) {
    const rawContent = article.content;
    if (rawContent) {
      const editorState = convertFromRaw(rawContent);
      return EditorState.createWithContent(editorState);
    }
    return EditorState.createEmpty();
  }
};
