export const JQ = (obj) => {
  return JSON.stringify(obj, null, 2);
};

export const isEmpty = (obj) => {
  let result = obj == null || obj === undefined || obj == '';
  return result;
};
