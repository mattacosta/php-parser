/**
 * Copyright 2017 Matt Acosta
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

import * as assert from 'assert';

import { LexerTestArgs, Test } from '../Test';

import { Encoding } from '../../../src/text/Encoding';
import { PhpLexer } from '../../../src/parser/PhpLexer';
import { PhpLexerState } from '../../../src/parser/PhpLexerState';
import { PhpVersion, PhpVersionInfo } from '../../../src/parser/PhpVersion';
import { SourceTextFactory } from '../../../src/text/SourceTextFactory';
import { Token } from '../../../src/parser/Token';
import { TokenKind, TokenKindInfo } from '../../../src/language/TokenKind';

function assertTokensWithEncoding(
  tests: LexerTestArgs[],
  encoding: Encoding,
  allowUtf16: boolean,
  minVersion = PhpVersion.PHP7_0,
  maxVersion = PhpVersion.Latest
): void {
  for (let i = 0; i < tests.length; i++) {
    let args = tests[i];
    let desc = args.description || args.text;
    if (!Test.isPhpVersionInRange(minVersion, maxVersion)) {
      it(`[SKIP ${PhpVersionInfo.getText(Test.PhpVersion)}] ${desc}`, Test.Pass);
      continue;
    }
    it(desc, () => {
      let state = PhpLexerState.InHostLanguage;
      let token: Token;
      let tokenCount: number = 0;
      let lexer = new PhpLexer(SourceTextFactory.from(args.text, encoding), Test.PhpVersion, true, allowUtf16);

      do {
        token = lexer.lex(state);
        state = lexer.currentState;
        if (args.skipTrivia && TokenKindInfo.isTrivia(token.kind)) {
          continue;
        }
        assert.equal(TokenKind[token.kind], TokenKind[args.expectedTokens[tokenCount]], 'token kind');
        assert.equal(token.diagnostics.length, 0, 'contains diagnostics');
        if (args.expectedText[tokenCount]) {
          assert.equal(args.text.substr(token.offset, token.length), args.expectedText[tokenCount]);
        }
        tokenCount++;
      } while (token.kind !== TokenKind.EOF && tokenCount < args.expectedTokens.length);

      assert.equal(tokenCount, args.expectedTokens.length, 'unexpected end of text');
    });
  }
}

describe('PhpLexer', function() {

  describe('utf8', function() {
    let tests = [
      // U+00F1 Latin Small Letter N With Tilde
      new LexerTestArgs('<?php ma\u00F1ana', 'identifier', [TokenKind.Identifier], ['ma\u00F1ana']),
      // U+0303 Combining Tilde
      new LexerTestArgs('<?php man\u0303ana', 'identifier', [TokenKind.Identifier], ['man\u0303ana']),
    ];
    assertTokensWithEncoding(tests, Encoding.Utf8, false);
  });

  describe('utf16le', function() {
    let tests = [
      new LexerTestArgs('<?php ', 'should not match open tag', [TokenKind.InlineText], ['<?php ']),
    ];
    assertTokensWithEncoding(tests, Encoding.Utf16le, false);

    let utf16Tests = [
      new LexerTestArgs('<?php man\u0303ana', 'identifier', [TokenKind.Identifier], ['man\u0303ana']),
    ];
    assertTokensWithEncoding(utf16Tests, Encoding.Utf16le, true);
  });

});
