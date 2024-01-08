export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  // and time
  const time = now.getTime();

  return `${year}-${month}-${date}-${time}`;
};
