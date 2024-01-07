import Dexie from "dexie";
import { Article, Facet } from "../types/types";
import isEqual from "lodash/isEqual";
import { PAGE_SIZE } from "../utils/constants";
import { EditorState, convertToRaw } from "draft-js";

// Initialize database
class HoneDatabase extends Dexie {
  articles: Dexie.Table<Article, string>;
  facets: Dexie.Table<Facet, string>;

  constructor() {
    super("HoneDatabase");
    this.version(1).stores({
      articles: "articleId, updateAt, title",
      facets: "[articleId+titleId], contentsId",
    });

    this.articles = this.table("articles");
    this.facets = this.table("facets");
  }
}

export const db = new HoneDatabase();
console.log("db", db);

// save article by editor state and article id passed in to db
export const saveArticle = async (articleId: string, updateAt: string, editorState: EditorState) => {
  const editorContent = editorState.getCurrentContent();
  const title = editorContent.getBlockMap().first().getText();
  const content = convertToRaw(editorContent);
  const article = { articleId, updateAt, title, content };

  await db.articles.put(article);
  console.log("save article", article);
};

// fetch article by article id passed in from db
export const fetchArticle = async (articleId: string) => {
  const article = await db.articles.get(articleId);
  console.log("fetch article", article);
  return article;
};
