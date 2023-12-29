import { configureStore } from "@reduxjs/toolkit";
import honeReducer from "../slices/honeSlice";

export const store = configureStore({
  reducer: {
    hone: honeReducer,
  },
});

console.log("store", store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
