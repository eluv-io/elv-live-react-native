export const JQ =  obj => JSON.stringify(obj, null, 2);

export const isEmpty = obj => {
  const result = obj === null || obj === undefined || obj === '' 
    || (Object.keys(obj).length === 0 && obj.constructor === Object);
  return result;
};

export const CreateID = num => {
  var id = crypto.randomBytes(num / 2).toString('hex');
  return id;
};

export const RandomInt = max => {
  return Math.floor(Math.random() * Math.floor(max));
}
