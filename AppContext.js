import React, {useState, useEffect} from 'react';
//Our state context
export const initialState = {
  fabric: null,
  platform: null,
  site: null,
  visible: false
};

let AppContext = React.createContext(initialState);

export default AppContext;
