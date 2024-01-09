import React from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const CreateArticleButton = () => {
  const navigate = useNavigate();

  const createNewArticle = () => {
    const newArticleId = uuidv4();
    navigate(`/article/${newArticleId}`);
  };

  return <button onClick={createNewArticle}>New Article</button>;
};

export default CreateArticleButton;
