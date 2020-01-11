# php-parser

[![Build Status](https://travis-ci.org/mattacosta/php-parser.svg?branch=master)](https://travis-ci.org/mattacosta/php-parser)

A cross-platform, error-tolerant PHP parser that provides a complete
representation of your source code.

This parser enables the integration of PHP language support in IDEs and other
custom environments, which allows developers to focus on creating additional
code analysis and transformation features.

## Features
- Supports the latest PHP 7 features.
- Works anywhere a JavaScript environment is available.
- Optimized for [V8](https://en.wikipedia.org/wiki/Chrome_V8) to be faster and use
  less memory than other parsers (see [benchmarks][Wiki_Benchmarks]).

## Installation

### Using a package manager:

`npm install @mattacosta/php-parser`

### Building from source code:

Run the following commands to get the latest files, install any dependencies,
and build the project.

`git clone https://github.com/mattacosta/php-parser.git`

`npm install`

`npx gulp compile`

## Getting started

Parsing a file and getting diagnostics:

```ts
let tree = PhpSyntaxTree.fromText('<?php var_dump($a);');

for (let diagnostic of tree.getDiagnostics()) {
  let message = ErrorCodeInfo.formatMessage(diagnostic.code, diagnostic.messageArgs);
  console.log(message);
}
```

Syntax nodes also contain additional properties and methods to traverse the
syntax tree. If visiting multiple nodes in a tree, consider extending the
`SyntaxVisitor` or `SyntaxTransform` classes.

## Documentation
- [Design overview][Wiki_DesignOverview]
- [FAQ][Wiki_FAQ]

## Contributing

If you find any bugs, typos, or something that could be improved, submit an
[issue](https://github.com/mattacosta/php-parser/issues) after reading the
[contribution guide][File_CONTRIBUTING.md].

<!-- Reference links -->

[File_CONTRIBUTING.md]: https://github.com/mattacosta/php-parser/blob/master/CONTRIBUTING.md
[Wiki_Benchmarks]: https://github.com/mattacosta/php-parser/wiki/Benchmarks
[Wiki_FAQ]: https://github.com/mattacosta/php-parser/wiki/FAQ
[Wiki_DesignOverview]: https://github.com/mattacosta/php-parser/wiki/Design-overview
