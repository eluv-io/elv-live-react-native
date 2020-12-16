import React, {useState, useEffect} from 'react';
//Our state context
export const initialState = {
  fabric: null,
  site: null
};

let AppContext = React.createContext(initialState);

export default AppContext;
