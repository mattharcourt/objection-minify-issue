This repo demonstrates an issue with
[objection.js](https://vincit.github.io/objection.js)
when attempting to include it in a  minified bundle using
[esbuild](https://github.com/evanw/esbuild).


When using some features of `objection.js` the bundled, minified code will
throw an exception like:
```
TypeError: Class constructor Fj cannot be invoked without 'new'
```
*where some other minified identifier may appear in the place of `Fj`*


In the example in this repo, the error is thrown when attempting to use
the `objection.js` `Model`'s `joinRelated` method.


<details>
<summary>[To re-create the issue](#demo)</summary>

1. Clone this [repo]()
2. Install dependencies (e.g. `yarn install` or `npm install`)
3. Run the package scripts
    * `yarn minified` or `npm run minified` to bundle and run the minified
    example code and exhibit the error.
    * `yarn unminified` or `npm run unminified` to bundle and run the example
    code without minification and without error.
    * `yarn partial` or `npm run partial` to bundle and run the example code
    with whitespace and syntax minification, but without identifier
    minification (no error).

</details>

<details>
<summary>[Explanation of the issue](#issue)</summary>

The issue appears to be in `knexUtils.js`
https://github.com/Vincit/objection.js/blob/0d4b39a96448e57144d37c11b507a9fe3b131656/lib/utils/knexUtils.js#L39-L49

Notice that the checks for `isKnexQueryBuilder`, `isKnexJoinBuilder`, and
`isKnexRaw` look for a constructor using a literal string value.
This comparison is bound to fail when the identifiers being compared against
have been minified.
</details>

<details>
<summary>[Potential solutions/work-arounds](#solutions)</summary>

1. The first solution is to avoid minifying the code. The downside of course is
a larger bundle size. Of course the impact will vary depending on the project,
but for this example the unminified bundle is twice the size of the minified
bundle.
2. The second solution is to partially minify the code by utilizing the more
granular `--minify-whitespace` and `--minify-syntax` options of
[esbuild](https://github.com/evanw/esbuild) instead of the more general
`--minify` option (i.e. avoiding identifier minification which can be
seperately controlled via the `--minify-identifiers` option).
This will avoid the issue while still providing some reduction in the size of
the bundle (though less reduction than complete minification).
3. Modify the code in `knexUtils.js` to identify the builders without using
the string literals.
</details>
