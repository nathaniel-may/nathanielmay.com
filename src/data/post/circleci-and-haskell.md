---
publishDate: 2020-05-29T21:25:17Z
title: 'CircleCI and Haskell'
excerpt: "The reasons behind my choices for CircleCI + Haskell so I don't forget."
image: 'https://dev-to-uploads.s3.amazonaws.com/i/hsdxajvc39w0g13tcnn6.jpg'
category: 'Practical Engineering'
tags:
  - haskell
author: 'Nathaniel May'
---

I've tried several different approaches to using CircleCI for Haskell projects and it's taken me a while to find a solution that works well. This post documents the solution I like and why I chose it over the alternatives.

## CircleCI Language Guide - Stack

The language guide for [Haskell](https://circleci.com/docs/2.0/language-haskell/) provides a working configuration file for stack projects that uses a simple docker image instead of a CircleCI Orb. At the time of writing the docker image is actively being maintained. If you're already happy with using stack with your project this is a fine way to go. The biggest downside I saw to using this approach is that the `Spin Up Environment` stage where CircleCI downloads the docker image takes about two minutes. Compare this with the standard Haskell docker images which take about 30 seconds, and the cached JVM environments CircleCI officially supports which take about three seconds.

# Haskell-works Orb - Cabal

If your project doesn't use stack there's a [CircleCI orb](https://circleci.com/orbs/registry/orb/haskell-works/haskell-build) for cabal projects that at the time of writing is being actively maintained. This orb tries to do as much magic for you behind the scenes as possible and documents the many orb-specific configurations. This orb lets users choose where they want their cache to be maintained: either in CircleCI, or an AWS bucket. This orb works, but I found it more difficult to use than just using cabal commands in a config file myself. The `Spin Up Environment` phase only takes about 30 seconds which I found perfectly acceptable.

# Custom Config

After trying both of the above solutions I decided to stick with using my own configuration file. I found it a little difficult to get cabal to do exactly what I want so I'm going to document what commands ended up working for me.

This walkthrough goes through all the files in a small example [GitHub project](https://github.com/nathaniel-may/circleci-cabal). Use this to see all the code snippets in context.

## The `.cabal` File

The first step in setting up your Haskell project to work with any CI is to make sure the test stanzas in your `.cabal` file are set to use exit codes so that your CI can detect when tests pass or fail.

```
test-suite unit
  type:               exitcode-stdio-1.0
  hs-source-dirs:     src/test
  main-is:            UnitTests.hs
  build-depends:      circleci-cabal ==0.1.0.0
                    , base           ==4.13.0.0
                    , HUnit          ==1.6.0.0
  ghc-options:        -Wall
  default-language:   Haskell2010
```

The line `type: exitcode-stdio-1.0` is the one that enables tests to emit proper exit codes.

Inside your tests you may need to manually emit the exit codes yourself like this example with HUnit:

```haskell
import System.Exit  (ExitCode(ExitFailure), exitWith, exitSuccess)

...

main :: IO ()
main = do
  results <- runTestTT $ TestList allTests
  if errors results + failures results == 0
    then exitSuccess
    else exitWith (ExitFailure 1)
```

Other libraries such as `test-framework` and `tasty` provide a function `defaultMain` that do this exit code mapping for you.

## CircleCI Config

Now that our tests are set up let's walk though the steps in the `.circleci/config.yml` file:

```yaml
version: 2.1

jobs:
  build:
    docker:
      - image: haskell:8.8.3
    steps:
      - checkout
      - restore_cache:
          name: Restore Cached Artifacts
          key: haskell-artifacts-{{ checksum "circleci-cabal.cabal" }}
      - run:
          name: Update Dependencies
          command: cabal new-update && cabal new-install --lib
      - run:
          name: Build
          command: cabal new-build
      - run:
          name: Build Tests
          command: cabal new-build --enable-tests
      - save_cache:
          name: Cache Artifacts
          key: haskell-artifacts-{{ checksum "circleci-cabal.cabal" }}
          paths:
            - '/root/.cabal'
            - 'dist-newstyle'
      - run:
          name: Run Tests
          command: cabal new-test --enable-tests --test-show-details=streaming
```

### Docker

CircleCI lets you can use any hosted docker image, but I chose to use one of the [official Haskell images](https://hub.docker.com/_/haskell?tab=tags).

```yaml
docker:
  - image: haskell:8.8.3
```

### checkout

Checkout out your code base from version control

```yaml
steps:
  - checkout
...
```

### Restore Cached Artifacts

Restores cached artifacts from a previous run that had the exact same cabal file.

```yaml
steps:
  ...
  - restore_cache:
      name: Restore Cached Artifacts
      key: haskell-artifacts-{{ checksum "circleci-cabal.cabal" }}
  ...
```

### Update Dependencies

`cabal new-update`: fetches the latest package list from hackage
`cabal new-install --lib`: installs the library and dependencies without looking for an executable. `--lib` is an undocumented flag but is referenced in many [GitHub Issues](https://github.com/haskell/cabal/issues).

```yaml
steps:
  ...
  - run:
      name: Update Dependencies
      command: cabal new-update && cabal new-install --lib
  ...
```

### Build

Compiles all non-test artifacts

```yaml
steps:
  ...
  - run:
      name: Compile
      command: cabal new-build
  ...
```

### Build Tests

Compiles all artifacts including tests. Existing non-test artifacts are already built so they won't be built again.

This outputs an executable that can be called directly as a standalone application to produce an exit code.

```yaml
steps:
  ...
  - run:
      name: Build Tests
      command: cabal new-build --enable-tests
  ...
```

### Cache Artifacts

At this point everything successfully built so we can save the artifacts for future runs.

`/root/.cabal`: cabal settings
`dist-newstyle`: artifacts

```yaml
steps:
  ...
  - save_cache:
      name: Cache Artifacts
      key: haskell-artifacts-{{ checksum "circleci-cabal.cabal" }}
      paths:
        - "/root/.cabal"
        - "dist-newstyle"
  ...
```

### Run Tests

Uses cabal to run all tests. Could instead use the executable built in the "Build Tests" step by referencing it with a CircleCI environment variable. This is useful when debugging your pipeline to decide if cabal is the issue.

`cabal new-test --enable-tests`: runs tests
`--test-show-details=streaming`: this flag redirects all print statements inside tests to stdout instead of a log file.

```yaml
steps:
  ...
  - run:
      name: Run Tests
      command: cabal new-test --enable-tests --test-show-details=streaming
```

# Additional Gotchas

I have a project that has two separate test stanzas:

- A test that forks a Haskell thread
- A test that forks an operating system thread

Both use the ghc flag `-threaded` in their stanzas in the `.cabal` file

The first test passes and emits the exit code properly.

The second test passes but does not emit the exit code properly. On CircleCI the process hangs indefinitely. To resolve this I used environment variables to call the built test binary directly.

Further reading: [Haskell threads vs operating system threads](http://hackage.haskell.org/package/base-4.14.0.0/docs/Control-Concurrent.html#g:11)

# Conclusion

I honestly had a hard time coming up with this so I wanted to share it both to help anyone else who runs into the same issues, but also to help future me when I inevitably forget some of these details.
