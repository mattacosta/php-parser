<?php

// Usage: php tokenize.php <file|code>

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

$tokens = token_get_all($source);
for ($i = 0; $i < count($tokens); $i++) {
  $token = $tokens[$i];
  if (is_array($token)) {
    $name = token_name($token[0]);
    $text = str_replace(["\r", "\n"], ['\\r', '\\n'], $token[1]);
    echo sprintf('%d: %s = \'%s\'', $i + 1, $name, $text) . PHP_EOL;
  }
  else {
    echo sprintf('%d: \'%s\'', $i + 1, $token) . PHP_EOL;
  }
}
