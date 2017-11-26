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
  less memory than other parsers.

## Installation

### Using npm:
`npm install @mattacosta/php-parser`

### From source code:
`git clone https://github.com/mattacosta/php-parser.git`

## Getting started

Parsing a file:

```ts
let code = fs.readFileSync('example.php', 'latin1');
let tree = PhpSyntaxTree.fromText(code);
```

Getting diagnostics:
```ts
for (let diagnostic of tree.getDiagnostics()) {
  // This message may have placeholders.
  let message = ErrorCodeInfo.getMessage(diagnostic.code);
  // Create a copy of the replacements.
  let args = diagnostic.messageArgs.slice();
  // Format the message.
  message = message.replace(/%s/g, function() { return args.shift(); });
  console.log(message);
}
```

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
