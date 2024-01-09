import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  // and time
  const time = now.getTime();

  return `${year}-${month}-${date}-${time}`;
};
