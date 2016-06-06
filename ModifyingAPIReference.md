Modifying the API-Reference
====

## Documenting the code
The code of the cross-platform modules is TypeScript. Thus, it is really
convenient to generate their API-Reference via
[TypeDoc](http://typedoc.io/). The team follows the
[TypeDoc guidelines](http://typedoc.io/guides/doccomments.html) to document the
code in the typescript declaration files (`*.d.ts`)

## Building the API-Reference
The `gruntfile.js` has a special entry point for
the purpose: use
    > `grunt apiref`
to extract the API-Reference and have it placed under the `bin/dist/apiref`
folder.

Under the hood, this command makes the TypeDoc compiler walk through the
TypeScript definition files (`*.d.ts`) and creates a set of HTML files that
comprise the documentation. The process uses the
[nativescript-typedoc-theme](https://www.npmjs.com/package/nativescript-typedoc-theme)
npm package to style the pages.

## Modifying the theme
To make changes on the TypeDoc theme itself you need to clone the
[nativescript-typedoc-theme](https://github.com/NativeScript/nativescript-typedoc-theme)
repository and run
    > `npm link`
from within its folder. Then, from within the [NativeScript/NativeScript] repo
run the command
    > `npm link nativescript-typedoc-theme`
This will create an [npm link](https://docs.npmjs.com/cli/link) for the theme,
so that when you make changes in the theme and build it via the
    > `gulp default`
command, you will get a fresh theme in your `node_modules` dir. Run
    > `grunt apiref`
in NativeScript as a next step to get a fresh API-Reference using that theme.


