# REACTNATIVE TVOS

A sample project to get ElvClientjs working under react native and tvos

## Steps to make it work

1. Use https://github.com/react-native-community/react-native-tvos instead of regular react-native for creating a new project
2. ElvClientjs must be packaged so that it recognizes react-native as a browser environment.
3. Install required dependencies.

```
yarn add @expo/browser-polyfill
yarn add react-native-get-random-values
yarn add react-native-unimodules
yarn add webassemblyjs
```

4. Before anything else, add imports to index.js

```
if (!global.WebAssembly) {
  global.WebAssembly = require('webassemblyjs');
}
import 'react-native-get-random-values';
import '@expo/browser-polyfill';
```

5. Using ElvClient should work without errors. example:

```
import {ElvClient} from '../ElvClient-min';
let client = await ElvClient.FromConfigurationUrl({
  configUrl,
});

let crypto = JSON.stringify(await client.Crypto.GeneratePrimaryConk());
console.log('crypto: ' + crypto);
```
