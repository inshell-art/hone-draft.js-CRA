import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EditorState } from "draft-js";
import { Article, Facet, ArticleFacetLink, HoneState, UpdateHoneStatePayload } from "../types/types";
import { transformEditorStateToHoneState } from "../utils/transformEditorStateToHoneState";

const initialState: HoneState = {
  articles: {},
  facets: {},
  articleFacetLinks: [],
};

const honeSlice = createSlice({
  name: "hone",
  initialState,
  reducers: {
    updateHoneEditor: (state, action: PayloadAction<UpdateHoneStatePayload>) => {
      const { articleId, articleDate, editorState } = action.payload;
      const transformedState = transformEditorStateToHoneState(articleId, articleDate, editorState);
      // Update state with transformed state
      state.articles = { ...state.articles, ...transformedState.articles };
      state.facets = { ...state.facets, ...transformedState.facets };
      state.articleFacetLinks = { ...state.articleFacetLinks, ...transformedState.articleFacetLinks };
    },

    saveToDb: (state) => {
      // Logic to convert hone state to fit the database schema
      // This reducer might trigger an asynchronous operation or dispatch a thunk
    },
  },
});

export const { updateHoneEditor, saveToDb } = honeSlice.actions;
export default honeSlice.reducer;
