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

import { ErrorCode } from '../../src/diagnostics/ErrorCode.Generated';
import { ISyntaxNode } from '../../src/language/syntax/ISyntaxNode';
import { ISyntaxToken } from '../../src/language/syntax/ISyntaxToken';
import { ISyntaxTrivia } from '../../src/language/syntax/ISyntaxTrivia';
import { PhpLexer } from '../../src/parser/PhpLexer';
import { PhpLexerState } from '../../src/parser/PhpLexerState';
import { PhpParserOptions } from '../../src/parser/PhpParserOptions';
import { PhpSyntaxTree } from '../../src/parser/PhpSyntaxTree';
import { PhpVersion, PhpVersionInfo } from '../../src/parser/PhpVersion';
import { SourceTextFactory } from '../../src/text/SourceTextFactory';
import { Token } from '../../src/parser/Token';
import { TokenKind, TokenKindInfo } from '../../src/language/TokenKind';

type TestCallback = (children: ISyntaxNode[], text: string) => void;

export class DiagnosticTestArgs {

  constructor(public text: string, public description: string, public expectedCodes: ErrorCode[], public expectedOffsets: number[]) {}

}

export class LexerTestArgs {

  constructor(public text: string, public description: string, public expectedTokens: TokenKind[], public expectedText: string[] = [], public skipTrivia = true) {}

}

export class LexerDiagnosticTestArgs {

  /**
   * @todo Add support for testing multiple diagnostics.
   */
  constructor(public text: string, public description: string, public expectedToken: TokenKind, public expectedCode: ErrorCode) {}

}

export class ParserTestArgs {

  constructor(public text: string, public description?: string, public testCallback?: TestCallback) {}

}

export class Test {

  /**
   * A test callback that always passes.
   */
  public static readonly Pass = () => {};

  /**
   * The version of PHP to test. Defaults to `PhpVersion.Latest`.
   */
  public static get PhpVersion(): PhpVersion {
    // Windows (PowerShell):
    // - `$env:PHP_PARSER_VERSION = '7_0'; npm test`
    // Linux:
    // - `PHP_PARSER_VERSION=7_0 npm test`
    switch (process.env.PHP_PARSER_VERSION) {
      case '7_0':
        return PhpVersion.PHP7_0;
      case '7_1':
        return PhpVersion.PHP7_1;
      case '7_2':
        return PhpVersion.PHP7_2;
      case '7_3':
        return PhpVersion.PHP7_3;
      case '7_4':
        return PhpVersion.PHP7_4;
      default:
        return PhpVersion.Latest;
    }
  }

  public static assertDiagnostics(tests: DiagnosticTestArgs[], minVersion = PhpVersion.PHP7_0, maxVersion = PhpVersion.Latest) {
    Test.assertDiagnosticsWithTag(tests, '<?php ', minVersion, maxVersion);
  }

  public static assertDiagnosticsWithShortOpen(tests: DiagnosticTestArgs[], minVersion = PhpVersion.PHP7_0, maxVersion = PhpVersion.Latest) {
    Test.assertDiagnosticsWithTag(tests, '<?= ', minVersion, maxVersion);
  }

  public static assertSyntaxNodes(tests: ParserTestArgs[], minVersion = PhpVersion.PHP7_0, maxVersion = PhpVersion.Latest) {
    Test.assertSyntaxNodesWithTag(tests, '<?php ', minVersion, maxVersion);
  }

  public static assertSyntaxNodesWithShortOpen(tests: ParserTestArgs[], minVersion = PhpVersion.PHP7_0, maxVersion = PhpVersion.Latest) {
    Test.assertSyntaxNodesWithTag(tests, '<?= ', minVersion, maxVersion);
  }

  public static assertSyntaxToken(token: ISyntaxToken | null, sourceText: string, expectedKind: TokenKind, expectedText: string, allowMissing = false) {
    assert.notStrictEqual(token, null, 'token not found');
    if (token === null) {
      return;
    }
    if (!allowMissing) {
      assert.equal(token.containsDiagnostics, false, 'contains diagnostics');
      assert.equal(token.isMissing, false, 'is missing');
    }
    assert.equal(TokenKind[token.kind], TokenKind[expectedKind], 'token kind');
    let span = token.span;
    let text = sourceText.substr(span.start, span.length);
    assert.equal(text, expectedText, 'token text');
  }

  public static assertSyntaxTrivia(trivia: ISyntaxTrivia | null, sourceText: string, expectedKind: TokenKind, expectedText: string, isSkippedToken = false, hasStructure = false) {
    assert.notStrictEqual(trivia, null, 'trivia not found');
    if (trivia === null) {
      return;
    }
    assert.equal(TokenKind[trivia.kind], TokenKind[expectedKind], 'trivia kind');
    assert.equal(trivia.containsSkippedText, isSkippedToken);
    assert.equal(trivia.containsStructuredTrivia, hasStructure);
    let span = trivia.span;
    let text = sourceText.substr(span.start, span.length);
    assert.equal(text, expectedText, 'trivia text');
  }

  public static assertTokens(tests: LexerTestArgs[], minVersion = PhpVersion.PHP7_0, maxVersion = PhpVersion.Latest) {
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
        let lexer = new PhpLexer(SourceTextFactory.from(args.text), Test.PhpVersion);

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
        } while (token.kind != TokenKind.EOF && tokenCount < args.expectedTokens.length);

        assert.equal(tokenCount, args.expectedTokens.length, 'unexpected end of text');
      });
    }
  }

  public static assertTokenDiagnostics(tests: LexerDiagnosticTestArgs[]) {
    for (let testIndex = 0; testIndex < tests.length; testIndex++) {
      let args = tests[testIndex];
      let desc = args.description || args.text;
      it(desc, () => {
        let lexer = new PhpLexer(SourceTextFactory.from(args.text), Test.PhpVersion);
        let state = lexer.currentState;

        let token: Token;
        let found = false;
        do {
          token = lexer.lex(state);
          state = lexer.currentState;
          if (token.kind == args.expectedToken) {
            found = true;
            assert.equal(token.diagnostics.length > 0, true, 'diagnostic not found');
            assert.equal(ErrorCode[token.diagnostics[0].code], ErrorCode[args.expectedCode], 'diagnostic code');
            // if (args.expectedOffset === void 0) {
            //   assert.equal(token.diagnostics[0].offset, 0, 'diagnostic offset');
            // }
            break;
          }
        } while (token.kind != TokenKind.EOF);

        if (!found) {
          assert.fail('token not found');
        }
      });
    }
  }

  public static isPhpVersionInRange(minVersion: PhpVersion, maxVersion = PhpVersion.Latest): boolean {
    let version = Test.PhpVersion;
    return version >= minVersion && version <= maxVersion;
  }

  protected static assertDiagnosticsWithTag(argList: DiagnosticTestArgs[], openTag: string, minVersion = PhpVersion.PHP7_0, maxVersion = PhpVersion.Latest) {
    const options = new PhpParserOptions(Test.PhpVersion);
    for (let i = 0; i < argList.length; i++) {
      const args = argList[i];
      const desc = args.description || args.text;
      const text = openTag + args.text;
      if (!Test.isPhpVersionInRange(minVersion, maxVersion)) {
        it(`[SKIP ${PhpVersionInfo.getText(Test.PhpVersion)}] ${desc}`, Test.Pass);
        continue;
      }
      if (args.expectedCodes.length > 0) {
        it(desc, () => {
          const tree = PhpSyntaxTree.fromText(text, '', options);

          assert.equal(tree.root.fullSpan.length, text.length, 'syntax tree mismatch');

          let n = 0;
          for (let d of tree.getDiagnostics()) {
            // All expected diagnostics have been tested, skip the rest.
            if (n >= args.expectedCodes.length) {
              break;
            }
            // The diagnostic at this position can be ignored.
            if (args.expectedCodes[n] === void 0) {
              n++;
              continue;
            }
            assert.equal(ErrorCode[d.code], ErrorCode[args.expectedCodes[n]], 'diagnostic code');
            assert.equal(d.offset, args.expectedOffsets[n] + openTag.length, 'diagnostic offset');
            n++;
          }

          // Finished early...
          assert.equal(n, args.expectedCodes.length, 'diagnostic not found');
        });
      }
      else {
        it(desc);
      }
    }
  }

  protected static assertSyntaxNodesWithTag(argList: ParserTestArgs[], openTag: string, minVersion = PhpVersion.PHP7_0, maxVersion = PhpVersion.Latest) {
    const options = new PhpParserOptions(Test.PhpVersion);
    for (let i = 0; i < argList.length; i++) {
      const args = argList[i];
      const desc = args.description || args.text;
      const text = openTag + args.text;
      const testFn = args.testCallback;
      if (testFn) {
        if (!Test.isPhpVersionInRange(minVersion, maxVersion)) {
          it(`[SKIP ${PhpVersionInfo.getText(Test.PhpVersion)}] ${desc}`, Test.Pass);
          continue;
        }
        it(desc, () => {
          const tree = PhpSyntaxTree.fromText(text, '', options);
          assert.equal(tree.root.fullSpan.length, text.length, 'syntax tree mismatch');
          const statements = tree.root.statements;
          assert.equal(tree.root.hasError, false, 'has error');
          assert.notStrictEqual(statements, null, 'statements not found');
          if (!statements) {
            return;
          }
          testFn(statements.childNodes(), text);
        });
      }
      else {
        it(desc);
      }
    }
  }

}
