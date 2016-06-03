The code of the cross-platform modules is TypeScript. That makes it really convenient for their API-Reference to get generated via TypeDoc. The gruntfile.js has a special entry point for the purpose: running `grunt apiref` extracts the API-Reference and puts it under the `bin/dist/apiref` folder.

The TypeDoc compiler walks through the TypeScript definition files (`*.d.ts`) and, using the [nativescript-typedoc-theme](https://www.npmjs.com/package/nativescript-typedoc-theme) package creates styled documentation.

**RENAME THE REPO**
The easiest way to make changes on the TypeDoc theme is to clone the [nativescript-typedoc-theme](https://github.com/NativeScript/tns-core-modules-API-Ref) and run `npm link` from within its folder.
Then, from within the [NativeScript/NativeScript] repo run the command `npm link nativescript-typedoc-theme`

This will create an npm link for the theme, so that when you make changes in the theme and build it (via the `gulp default` command) you will get a fresh theme in your `node_modules` dir. When subsequently run `grunt apiref` in NativeScript, you will get a fresh api-reference, using that theme.


