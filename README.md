# ELUVIO LIVE TVOS

Watch premier and live events on the Eluvio Live Platform for TVOS

## Development

Install packages and run metro server:

```
yarn install
cd ios && pod install
cd ..
yarn start
```

Launch AppleTV Simulator and build/load app:

```
yarn run tvos
```

## Steps to make Elv-client-js work for React Native TVOS

1. Use https://github.com/react-native-community/react-native-tvos instead of regular react-native for creating a new project
2. Currently, must use the packaged version ElvClient-min.js included in the project.
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

## Cheatcodes

Here are sequences of remote actions to activate some advanced/development functionality.

1. Clearing database - "longSelect","left","right","left","right","longSelect"
2. Toggle debug - "longSelect","up","up","up","up","longSelect"
3. Switch networks - "longSelect","down","down","down","down","longSelect"
