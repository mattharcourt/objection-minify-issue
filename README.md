# Synopsis #
This repo demonstrates an issue with
[objection.js](https://vincit.github.io/objection.js)
when attempting to include it in a  minified bundle using
[esbuild](https://github.com/evanw/esbuild).


Some features of
[objection.js](https://vincit.github.io/objection.js),
when used in code that is bundled and minified, will throw an exception like
the following
*[Note: some other minified identifier may appear in the place of `Fj`]*:
```
TypeError: Class constructor Fj cannot be invoked without 'new'
```


In the example in this repo, the error is thrown when attempting to use
the `joinRelated` method of the
[objection.js](https://vincit.github.io/objection.js)
`Model` class.
For representative class definitions that will trigger the error, see
[lines 7-30 of `example.js`](
https://github.com/mattharcourt/objection-minify-issue/blob/bb9c979e981f4c3c0520b2ec12b1817f4f83a674/example.js#L7-L30
).
The representative query can be found on [line 82 of `example.js`](
https://github.com/mattharcourt/objection-minify-issue/blob/bb9c979e981f4c3c0520b2ec12b1817f4f83a674/example.js#L82
).



# Demo #

<details>
<summary>How to re-create the issue</summary>

1. Clone [this repo](https://github.com/mattharcourt/objection-minify-issue)
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


# Explanation #

<details>
<summary>Explanation of the issue</summary>

The issue appears to be in [`knexUtils.js`](
https://github.com/Vincit/objection.js/blob/0d4b39a96448e57144d37c11b507a9fe3b131656/lib/utils/knexUtils.js#L39-L49
) (lines 39-39)

Notice that the checks for
`isKnexQueryBuilder`, `isKnexJoinBuilder`, and `isKnexRaw`
look for a specific constructor using a literal string value.
This comparison is bound to fail when the identifiers being compared against
have been minified.
</details>


# Solutions #

<details>
<summary>Potential solutions/work-arounds</summary>

1. The first solution is to avoid minifying the code, with the obvious downside
being a larger bundle size.
Of course the impact will vary depending on the project, but for this example
(where the majority of the code is
[objection.js](https://vincit.github.io/objection.js)
and
[knex](https://github.com/knex/knex)
) the unminified bundle is twice the size of the minified bundle.

2. The second solution is to *partially* minify the code by utilizing the more
granular `--minify-whitespace` and `--minify-syntax` options of
[esbuild](https://github.com/evanw/esbuild)
instead of the more general `--minify` option (i.e. avoiding identifier
minification which can be seperately controlled via the `--minify-identifiers`
option).
This will avoid the issue while still providing some reduction in the size of
the bundle (though less reduction than with full minification).

3. The third possible solution is to modify the code in
[objection.js](https://vincit.github.io/objection.js)
so that a string literal is not used to complete the checks within
`isKnexQueryBuilder`, `isKnexJoinBuilder`, and `isKnexRaw`
found in
[`knexUtils.js`](
https://github.com/Vincit/objection.js/blob/0d4b39a96448e57144d37c11b507a9fe3b131656/lib/utils/knexUtils.js#L39-L49
)
Here are three potential modifications that could be made:

    1.  The obvious solution is to utilize `instanceof` to see if the variable
    is an instance of the appropriate class.
    However, this is not possible because the classes of interest are internal
    to [knex](https://github.com/knex/knex) and are not publicly exported.
    So, the first potential modification is to modify
    [knex](https://github.com/knex/knex)
    so that the 
    [`Builder`](https://github.com/knex/knex/blob/master/lib/query/querybuilder.js),
    [`JoinClause`](https://github.com/knex/knex/blob/master/lib/query/joinclause.js)
    and
    [`Raw`](https://github.com/knex/knex/blob/master/lib/raw.js)
    classes are exported publicly, so that the appropriate identifier is used
    even when minified.
    Then the
    [objection.js](https://vincit.github.io/objection.js)
    [`knexUtils.js`](
    https://github.com/Vincit/objection.js/blob/0d4b39a96448e57144d37c11b507a9fe3b131656/lib/utils/knexUtils.js#L39-L49
    ) checks could be modified similar to:
        ```javascript
        import { JoinClause } from 'knex'
        function isKnexJoinBuilder(value) {
            return value instanceof JoinClause;
        }
        ```
        Note that this requires changes within both
        [knex](https://github.com/knex/knex)
        and
        [objection.js](https://vincit.github.io/objection.js)

    2. The next possibility restricts changes to within the
    [objection.js](https://vincit.github.io/objection.js)
    file
    [`knexUtils.js`](
    https://github.com/Vincit/objection.js/blob/0d4b39a96448e57144d37c11b507a9fe3b131656/lib/utils/knexUtils.js#L39-L49
    )
    where the
    `isKnexQueryBuilder`, `isKnexJoinBuilder`, and `isKnexRaw`
    functions could utilize unique properties of each
    [knex](https://github.com/knex/knex)
    class to identify instances of each.
    While it may not be required, you could also still ensure that each has
    **a** constructor (just not a specific constructor), e.g.

        ``` javascript
        function hasConstructor(value) {
            return isObject(value) && isFunction(value.constructor);
        }
        ```

        And then check for the existence of fields unique to each class, e.g.

        ``` javascript
        function isKnexQueryBuilder(value) {
            return (
                hasConstructor(value) &&
                isFunction(value.select) &&
                isFunction(value.column) &&
                value.select === value.column &&
                'client' in value
            );
        }
        ```
        See [knex/lib/query/querybuilder.js:L1452-L1453](
        https://github.com/knex/knex/blob/c3655ef5af5dbf0b251574b4bf3547d19d6facf8/lib/query/querybuilder.js#L1452-L1453
        )


        ``` javascript
        function isKnexJoinBuilder(value) {
            return hasConstructor(value) && value.grouping === 'join' && 'joinType' in value;
        }
        ```
        See [knex/lib/query/joinclause.js:L237-L239](
        https://github.com/knex/knex/blob/c3655ef5af5dbf0b251574b4bf3547d19d6facf8/lib/query/joinclause.js#L237-L239
        )


        ``` javascript
        function isKnexRaw(value) {
            return hasConstructor(value) && value.isRawInstance && 'client' in value;
        }
        ```
        See [knex/lib/raw.js:L131-L132](
        https://github.com/knex/knex/blob/c3655ef5af5dbf0b251574b4bf3547d19d6facf8/lib/raw.js#L131-L132
        )
        \
        \
        Note that these changes rely on the internals of
        [knex](https://github.com/knex/knex)
        (i.e. not part of the public API), and therefore could be subject to change.


    3. Another possibility makes changes to
    [knex](https://github.com/knex/knex)
    as well as
    [objection.js](https://vincit.github.io/objection.js)
    such that each instance of these classes has a property which identifies
    it's type.
    For example, the
    [`Raw`](https://github.com/knex/knex/blob/master/lib/raw.js)
    [knex](https://github.com/knex/knex)
    class already has a flag (`isRawInstance`) that is used internally within
    [knex](https://github.com/knex/knex)
    and could be relied on to identify instances of each class (see above).
    Similarly, an `isBuilderInstance` flag could be added to [`Builder`](
    https://github.com/knex/knex/blob/c3655ef5af5dbf0b251574b4bf3547d19d6facf8/lib/query/querybuilder.js#L53
    )
    and an `isJoinClauseInstance` flag could be added to [`JoinClause`](
    https://github.com/knex/knex/blob/c3655ef5af5dbf0b251574b4bf3547d19d6facf8/lib/query/joinclause.js#L39
    ).
    Then the appropriate modifications (similar to those above) could be made
    within [objection.js](https://vincit.github.io/objection.js).
    This change would essentially be a request to make these flags part of the
    official public API of [knex](https://github.com/knex/knex), rather than
    exporting the internal classes.

</details>
