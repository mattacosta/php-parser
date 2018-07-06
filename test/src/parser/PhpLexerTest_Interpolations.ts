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
import * as mocha from 'mocha';

import { LexerTestArgs } from '../Test';

import { PhpLexer } from '../../../src/parser/PhpLexer';
import { SourceTextFactory } from '../../../src/text/SourceTextFactory';
import { TokenKind, TokenKindInfo } from '../../../src/language/TokenKind';

function assertRescannedTokens(tests: LexerTestArgs[], templateKind: TokenKind) {
  for (let i = 0; i < tests.length; i++) {
    let test = tests[i];
    if (test.expectedTokens.length > 0) {
      it(test.description || test.text, () => {
        let code = '<?php ' + test.text;
        let fullText = SourceTextFactory.from(code);
        let lexer = new PhpLexer(fullText);

        // Find the template.
        let token = lexer.lex(lexer.currentState);
        while (TokenKindInfo.isTrivia(token.kind)) {
          token = lexer.lex(lexer.currentState);
        }
        assert.equal(token.kind, templateKind, 'template kind');

        // Create a new lexer to rescan the template. This must use a substring
        // of the original source text to test the bounds of the template's span.
        let rescanText = SourceTextFactory.from(fullText.substring(token.offset, token.length));
        let rescanLexer = new PhpLexer(rescanText);
        if (templateKind == TokenKind.StringTemplate) {
          rescanLexer.rescanInterpolatedString(lexer.templateSpans);
        }
        else if (templateKind == TokenKind.BackQuoteTemplate) {
          rescanLexer.rescanInterpolatedBackQuote(lexer.templateSpans);
        }
        else {
          rescanLexer.rescanInterpolatedHeredoc(lexer.templateSpans);
        }

        for (let n = 0; n < test.expectedTokens.length; n++) {
          let rescanToken = rescanLexer.lex(rescanLexer.currentState);
          assert.equal(rescanToken.kind, test.expectedTokens[n], 'token kind');
          if (test.expectedText.length > 0) {
            let text = rescanText.substring(rescanToken.offset, rescanToken.length);
            assert.equal(text, test.expectedText[n], 'token text');
          }
        }
      });
    }
    else {
      it(test.description || test.text);
    }
  }
}

describe('PhpLexer', function() {

  describe('double quoted strings', function() {

    describe('in double quote', function() {
      // NOTE: Plain text in double quotes is tested along with single quoted strings.
      let lexerTests = [
        new LexerTestArgs('"$a"', 'simple variable',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"\\\\$a"', 'simple variable with escaped backslash',
          [TokenKind.DoubleQuote, TokenKind.StringTemplateLiteral, TokenKind.Variable, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"\\"$a"', 'simple variable with escaped double quote',
          [TokenKind.DoubleQuote, TokenKind.StringTemplateLiteral, TokenKind.Variable, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"\\n$a"', 'simple variable with escaped line feed',
          [TokenKind.DoubleQuote, TokenKind.StringTemplateLiteral, TokenKind.Variable, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"\\$$a"', 'simple variable with escaped variable sigil',
          [TokenKind.DoubleQuote, TokenKind.StringTemplateLiteral, TokenKind.Variable, TokenKind.DoubleQuote]
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);
    });

    describe('looking for property', function() {
      let lexerTests = [
        new LexerTestArgs('"$a->b"', 'object operator with identifier',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.ObjectOperator, TokenKind.Identifier, TokenKind.DoubleQuote],
          ['"', '$a', '->', 'b', '"']
        ),
        new LexerTestArgs('"$a->"', 'object operator without identifier',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '->', '"']
        ),
        new LexerTestArgs('"$a->b->c"', 'should end after first property (trailing property)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.ObjectOperator, TokenKind.Identifier, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '->', 'b', '->c', '"']
        ),
        new LexerTestArgs('"$a ->b"', 'should not allow whitespace before object operator',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', ' ->b', '"']
        ),
        new LexerTestArgs('"$a-> b"', 'should not allow whitespace after object operator',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '-> b', '"']
        ),
        new LexerTestArgs('"$a\n\t->b"', 'should not allow whitespace before object operator (multiple)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '\n\t->b', '"']
        ),
        new LexerTestArgs('"$a->\n\tb"', 'should not allow whitespace after object operator (multiple)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '->\n\tb', '"']
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);
    });

    describe('looking for variable name', function() {
      let lexerTests = [
        new LexerTestArgs('"${a}"', 'indirect variable name',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringIdentifier, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', 'a', '}', '"']
        ),
        new LexerTestArgs('"${a[0]}"', 'indirect variable name with offset',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringIdentifier, TokenKind.OpenBracket, TokenKind.LNumber, TokenKind.CloseBracket, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', 'a', '[', '0', ']', '}', '"']
        ),
        new LexerTestArgs('"${a}}"', 'indirect variable name with trailing close brace',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringIdentifier, TokenKind.CloseBrace, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '${', 'a', '}', '}', '"']
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);
    });

    describe('in script', function() {
      let lexerTests = [
        // Entered via `InDoubleQuote`.
        // - Starts with the '$' after an opening brace.
        // - Ends at a matching closing brace or close tag.
        new LexerTestArgs('"{$a}"', 'variable substitution',
          [TokenKind.DoubleQuote, TokenKind.OpenBrace, TokenKind.Variable, TokenKind.CloseBrace, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"{$a{}}"', 'variable substitution with braces',
          [TokenKind.DoubleQuote, TokenKind.OpenBrace, TokenKind.Variable, TokenKind.OpenBrace, TokenKind.CloseBrace, TokenKind.CloseBrace, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"{$"', 'should not move beyond EOF if variable substitution is incomplete',
          [TokenKind.DoubleQuote, TokenKind.OpenBrace, TokenKind.Dollar, TokenKind.StringLiteral],
          // The '$' and '"' are part of the embedded script and cause the string to be unterminated.
          ['"', '{', '$', '"']
        ),

        // Entered via `LookingForVariableName`.
        // - Starts at first non-label character after the opening brace.
        // - Ends at a matching close brace or close tag.
        new LexerTestArgs('"${\'}\'}"', 'indirect variable name should not match close brace in single-quoted string',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringLiteral, TokenKind.CloseBrace, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"${"}"}"', 'indirect variable name should not match close brace in double-quoted string',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringLiteral, TokenKind.CloseBrace, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"${`}`}"', 'indirect variable name should not match close brace in back-quoted string',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.BackQuoteTemplate, TokenKind.CloseBrace, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"${<<<LABEL\n}\nLABEL\n}"', 'indirect variable name should not match close brace in heredoc',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.HeredocTemplate, TokenKind.NewLine, TokenKind.CloseBrace, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"${A//comment}\n}"', 'indirect variable name should not match close brace in line comment',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.Identifier, TokenKind.SingleLineComment, TokenKind.CloseBrace, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"${A?>}"', 'indirect variable name should end after close tag',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.Identifier, TokenKind.CloseTag, TokenKind.InlineText]
        ),
        new LexerTestArgs('"${A//comment?>}"', 'indirect variable name should end after close tag (in line comment)',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.Identifier, TokenKind.SingleLineComment, TokenKind.CloseTag, TokenKind.InlineText]
        ),

        new LexerTestArgs('"${\'a\'?><?php .\'b\'}"', 'indirect variable name with embedded close tag followed by open tag', [
          TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringLiteral, TokenKind.CloseTag, TokenKind.OpenTag,
          TokenKind.Whitespace, TokenKind.Period, TokenKind.StringLiteral, TokenKind.CloseBrace, TokenKind.DoubleQuote
        ], ['"', '${', '\'a\'', '?>', '<?php', ' ', '.', '\'b\'', '}', '"']),

        // All text after the identifier is part of the embedded script. If a
        // closing token is not found the string is unterminated.
        new LexerTestArgs('"${a{"', 'should not move beyond EOF if indirect variable name is incomplete (unmatched brace)',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.Identifier, TokenKind.OpenBrace, TokenKind.StringLiteral],
        ),
        new LexerTestArgs('"${a["', 'should not move beyond EOF if indirect variable name is incomplete (unmatched bracket)',
          // Only an indentifier followed by a '[' or '}' results in the
          // expected `StringIdentifier`.
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringIdentifier, TokenKind.OpenBracket, TokenKind.StringLiteral],
        ),
        new LexerTestArgs('"${a("', 'should not move beyond EOF if indirect variable name is incomplete (unmatched parenthesis)',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.Identifier, TokenKind.OpenParen, TokenKind.StringLiteral],
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);
    });

    describe('in variable offset', function() {
      let lexerTests = [
        new LexerTestArgs('"$a[10]"', 'variable with integer offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"$a[01]"', 'variable with integer offset (leading zero)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"$a[-1]"', 'variable with integer offset (negative)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.Minus, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"$a[0]"', 'variable with integer offset (zero)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"$a[0xFF]"', 'variable with hexadecimal offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"$a[0b11]"', 'variable with binary offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"$a[$b]"', 'variable with variable offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.Variable, TokenKind.CloseBracket, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"$a[B]"', 'variable with constant offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.Identifier, TokenKind.CloseBracket, TokenKind.DoubleQuote]
        ),

        // Invalid offsets.
        new LexerTestArgs('"$a[0.1]"', 'variable with floating-point offset',
        [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"$a[-B]"', 'negative constant',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.Minus, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"$a[-]"', 'minus without integer offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.Minus, TokenKind.CloseBracket, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"$a[0-]"', 'minus after integer offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote]
        ),
        new LexerTestArgs('"$a[:]"', 'invalid offset character',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote]
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);
    });

  });

  describe('back quoted strings', function() {
    let lexerTests = [
      new LexerTestArgs('``', 'empty text', [TokenKind.BackQuote, TokenKind.BackQuote]),
      new LexerTestArgs('`abc`', 'plain text', [TokenKind.BackQuote, TokenKind.StringTemplateLiteral, TokenKind.BackQuote]),
      new LexerTestArgs('`$a`', 'simple variable', [TokenKind.BackQuote, TokenKind.Variable, TokenKind.BackQuote]),
    ];
    assertRescannedTokens(lexerTests, TokenKind.BackQuoteTemplate);
  });

  describe('heredoc strings', function() {
    let lexerTests = [
      new LexerTestArgs('<<<LABEL\nLABEL\n', 'empty text',
        [TokenKind.HeredocStart, TokenKind.HeredocEnd],
        ['<<<LABEL\n', 'LABEL']),
      new LexerTestArgs('<<<LABEL\ntext\nLABEL\n', 'plain text',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<LABEL\n', 'text\n', 'LABEL']),
      new LexerTestArgs('<<<LABEL\n$a\nLABEL\n', 'simple variable',
        [TokenKind.HeredocStart, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<LABEL\n', '$a', '\n', 'LABEL']),
      new LexerTestArgs('<<<LABEL\nlabel\n', 'heredoc label should be case-sensitive',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral],
        ['<<<LABEL\n', 'label\n']),
      new LexerTestArgs('<<<LABEL\n\n\nLABEL\n', 'multiple newlines before end label',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<LABEL\n', '\n\n', 'LABEL']),
    ];
    assertRescannedTokens(lexerTests, TokenKind.HeredocTemplate);
  });

  describe('heredoc strings (with double quotes)', function() {
    let lexerTests = [
      new LexerTestArgs('<<<"LABEL"\nLABEL\n', 'empty text',
        [TokenKind.HeredocStart, TokenKind.HeredocEnd],
        ['<<<"LABEL"\n', 'LABEL']),
      new LexerTestArgs('<<<"LABEL"\ntext\nLABEL\n', 'plain text',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<"LABEL"\n', 'text\n', 'LABEL']),
      new LexerTestArgs('<<<"LABEL"\n$a\nLABEL\n', 'simple variable',
        [TokenKind.HeredocStart, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<"LABEL"\n', '$a', '\n', 'LABEL']),
      new LexerTestArgs('<<<"LABEL"\nlabel\n', 'heredoc label should be case-sensitive',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral],
        ['<<<"LABEL"\n', 'label\n']),
    ];
    assertRescannedTokens(lexerTests, TokenKind.HeredocTemplate);
  });

  describe('nowdoc strings', function() {
    let lexerTests = [
      new LexerTestArgs('<<<\'LABEL\'\nLABEL\n', 'empty text', [TokenKind.HeredocStart, TokenKind.HeredocEnd]),
      new LexerTestArgs('<<<\'LABEL\'\ntext\nLABEL\n', 'plain text', [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd]),
      new LexerTestArgs('<<<\'LABEL\'\n$a\nLABEL\n', 'simple variable', [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd]),
      new LexerTestArgs('<<<\'LABEL\'\n\n\nLABEL\n', 'multiple newlines before end label',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<\'LABEL\'\n', '\n\n', 'LABEL']),
    ];
    assertRescannedTokens(lexerTests, TokenKind.HeredocTemplate);
  });

});
