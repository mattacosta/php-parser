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
import { PhpLexer } from '../../src/parser/PhpLexer';
import { PhpLexerState } from '../../src/parser/PhpLexerState';
import { PhpSyntaxTree } from '../../src/parser/PhpSyntaxTree';
import { SourceTextFactory } from '../../src/text/SourceTextFactory';
import { ISyntaxToken } from '../../src/language/syntax/ISyntaxToken';
import { TextSpan } from '../../src/text/TextSpan';
import { Token } from '../../src/parser/Token';
import { TokenKind, TokenKindInfo } from '../../src/language/TokenKind';

type TestCallback = (children: ISyntaxNode[], text: string) => void;

export class DiagnosticTestArgs {

  constructor(public text: string, public description: string, public expectedCodes: ErrorCode[], public expectedOffsets: number[]) {}

}

export class LexerTestArgs {

  constructor(public text: string, public description: string, public expectedTokens: TokenKind[], public expectedText: string[] = [], public skipTrivia = true) {}

}

export class ParserTestArgs {

  constructor(public text: string, public description?: string, public testCallback?: TestCallback) {}

}

export class Test {

  public static assertDiagnostics(argList: DiagnosticTestArgs[], openTagWithEcho = false) {
    for (let i = 0; i < argList.length; i++) {
      const args = argList[i];
      const desc = args.description || args.text;
      if (args.expectedCodes.length > 0) {
        it(desc, () => {
          const prefix = openTagWithEcho ? '<?= ' : '<?php ';
          const tree = PhpSyntaxTree.fromText(prefix + args.text);

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
            assert.equal(d.code, args.expectedCodes[n], 'diagnostic code');
            assert.equal(d.offset, args.expectedOffsets[n] + prefix.length, 'diagnostic offset');
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

  public static assertSyntaxNodes(argList: ParserTestArgs[], assertDiagnostics = true, openTagWithEcho = false) {
    for (let i = 0; i < argList.length; i++) {
      const args = argList[i];
      const desc = args.description || args.text;
      const testFn = args.testCallback;
      if (testFn) {
        it(desc, () => {
          const text = (openTagWithEcho ? '<?= ' : '<?php ') + args.text;
          const tree = PhpSyntaxTree.fromText(text);
          const statements = tree.root.statements;
          if (assertDiagnostics) {
            assert.equal(tree.root.containsDiagnostics, false, 'contains diagnostics');
          }
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

  public static assertSyntaxToken(token: ISyntaxToken | null, sourceText: string, expectedKind: TokenKind, expectedText: string, allowMissing = false) {
    assert.notStrictEqual(token, null, 'token not found');
    if (!token) {
      return;
    }
    if (!allowMissing) {
      assert.equal(token.containsDiagnostics, false, 'contains diagnostics');
      assert.equal(token.isMissing, false, 'is missing');
    }
    assert.equal(token.kind, expectedKind, 'token kind');
    let span = token.span ? token.span : new TextSpan(0, 0);
    let text = sourceText.substr(span.start, span.length);
    assert.equal(text, expectedText, 'token text');
  }

  public static assertTokens(tests: LexerTestArgs[], customLexer?: PhpLexer) {
    for (let i = 0; i < tests.length; i++) {
      let args = tests[i];
      it(args.description || args.text, () => {
        let state = PhpLexerState.InHostLanguage;
        let token: Token;
        let tokenCount: number = 0;
        let lexer = !customLexer ? new PhpLexer(SourceTextFactory.from(args.text)) : customLexer;

        do {
          token = lexer.lex(state);
          state = lexer.currentState;
          if (args.skipTrivia && TokenKindInfo.isTrivia(token.kind)) {
            continue;
          }
          assert.equal(TokenKind[token.kind], TokenKind[args.expectedTokens[tokenCount]]);
          if (args.expectedText[tokenCount]) {
            assert.equal(args.text.substr(token.offset, token.length), args.expectedText[tokenCount]);
          }
          tokenCount++;
        } while (token.kind != TokenKind.EOF && tokenCount < args.expectedTokens.length);

        assert.equal(tokenCount, args.expectedTokens.length, 'unexpected end of text');
      });
    }
  }

}
