import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const MyHone = () => {
  const navigate = useNavigate();

  const createNewArticle = () => {
    const newArticleId = uuidv4();
    navigate(`/article/${newArticleId}`); // Transaction to save will be handled in Article.tsx to avoid empty articles creation
  };
  return (
    <div>
      <div className="header">
        <div className="header-title">My Hone</div>
        <button className="create-article-btn" onClick={createNewArticle}>
          New Article
        </button>
      </div>
      {/* Rest of your component */}
    </div>
  );
};

export default MyHone;
