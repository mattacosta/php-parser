<?php

// Usage: php parse.php <file|code>

// Requirements:
// - The [php-ast](https://github.com/nikic/php-ast) extension.
// - A copy of `util.php` (provided with the extension).

if (!extension_loaded('ast')) {
  echo 'Extension "php_ast" not found.';
  return;
}

require_once 'util.php';

if ($argc < 2) {
  echo 'Missing source argument.';
  return;
}

$source = $argv[1];
if (file_exists($source)) {
  $source = file_get_contents($source);
  if ($source === FALSE) {
    echo 'Unable to open file.';
    return;
  }
}

echo ast_dump(ast\parse_code($source, 80)) . PHP_EOL;
