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

import { PhpLexer } from '../../../src/parser/PhpLexer';
import { PhpVersion } from '../../../src/parser/PhpVersion';
import { SourceTextFactory } from '../../../src/text/SourceTextFactory';
import { TokenKind, TokenKindInfo } from '../../../src/language/TokenKind';

function assertRescannedTokens(tests: LexerTestArgs[], templateKind: TokenKind, minVersion = PhpVersion.PHP7_0, maxVersion = PhpVersion.Latest) {
  for (let i = 0; i < tests.length; i++) {
    let test = tests[i];

    if (test.expectedTokens.length == 0) {
      it(test.description || test.text);
      continue;
    }
    if (!Test.isPhpVersionInRange(minVersion, maxVersion)) {
      it(test.description || test.text, Test.Pass);
      continue;
    }

    it(test.description || test.text, () => {
      let code = '<?php ' + test.text;
      let fullText = SourceTextFactory.from(code);
      let lexer = new PhpLexer(fullText, Test.PhpVersion);

      // Find the template.
      let token = lexer.lex(lexer.currentState);
      while (TokenKindInfo.isTrivia(token.kind)) {
        token = lexer.lex(lexer.currentState);
      }
      assert.equal(token.kind, templateKind, 'template kind');

      // Create a new lexer to rescan the template. This must use a substring
      // of the original source text to test the bounds of the template's span.
      let rescanText = SourceTextFactory.from(fullText.substring(token.offset, token.length));
      let rescanLexer = new PhpLexer(rescanText, Test.PhpVersion);
      if (templateKind == TokenKind.StringTemplate) {
        rescanLexer.rescanInterpolatedString(lexer.templateSpans);
      }
      else if (templateKind == TokenKind.BackQuoteTemplate) {
        rescanLexer.rescanInterpolatedBackQuote(lexer.templateSpans);
      }
      else if (templateKind == TokenKind.HeredocTemplate) {
        rescanLexer.rescanInterpolatedHeredoc(lexer.templateSpans);
      }
      else if (templateKind == TokenKind.FlexdocTemplate) {
        rescanLexer.rescanInterpolatedFlexdoc(lexer.templateSpans);
      }
      else {
        assert.fail('Unknown template kind');
      }

      for (let n = 0; n < test.expectedTokens.length; n++) {
        let rescanToken = rescanLexer.lex(rescanLexer.currentState);
        assert.equal(TokenKind[rescanToken.kind], TokenKind[test.expectedTokens[n]], 'token kind');
        if (test.expectedText.length > 0) {
          let text = rescanText.substring(rescanToken.offset, rescanToken.length);
          assert.equal(text, test.expectedText[n], 'token text');
        }
      }
    });
  }
}

describe('PhpLexer', function() {

  describe('interpolated strings', function() {

    // NOTE: Plain text in double quotes is tested along with single-quoted strings.

    describe('in double quote', function() {
      let lexerTests = [
        new LexerTestArgs('"$a"', 'simple variable',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.DoubleQuote],
          ['"', '$a', '"']
        ),
        new LexerTestArgs('"$ab"', 'simple variable (multiple characters)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.DoubleQuote],
          ['"', '$ab', '"']
        ),
        new LexerTestArgs('" $a"', 'simple variable in string with leading text',
          [TokenKind.DoubleQuote, TokenKind.StringTemplateLiteral, TokenKind.Variable, TokenKind.DoubleQuote],
          ['"', ' ', '$a', '"']
        ),

        new LexerTestArgs('"$a', 'should end at EOF',
          [TokenKind.DoubleQuote, TokenKind.Variable],
          ['"', '$a']
        ),
        new LexerTestArgs('"$a "', 'should end after variable name',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', ' ', '"']
        ),

        // See "looking for property" for "$a->b" interpolations.

        // See "looking for variable name" for "${...}" interpolations.

        // See "in script (from in double quote)" for "{$...}" interpolations.
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);
    });

    describe('looking for property', function() {
      let lexerTests = [
        new LexerTestArgs('"$a->b"', 'object operator with identifier',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.ObjectOperator, TokenKind.Identifier, TokenKind.DoubleQuote],
          ['"', '$a', '->', 'b', '"']
        ),
        new LexerTestArgs('" $a->b"', 'object operator with identifier in string with leading text',
          [TokenKind.DoubleQuote, TokenKind.StringTemplateLiteral, TokenKind.Variable, TokenKind.ObjectOperator, TokenKind.Identifier, TokenKind.DoubleQuote],
          ['"', ' ', '$a', '->', 'b', '"']
        ),

        new LexerTestArgs('"$a->"', 'should not start if identifier is missing',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '->', '"']
        ),
        new LexerTestArgs('"$a ->b"', 'should not start if whitespace is before object operator',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', ' ->b', '"']
        ),
        new LexerTestArgs('"$a\n\t->b"', 'should not start if whitespace is before object operator (multiple)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '\n\t->b', '"']
        ),
        new LexerTestArgs('"$a-> b"', 'should not start if whitespace is after object operator',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '-> b', '"']
        ),
        new LexerTestArgs('"$a->\n\tb"', 'should not start if whitespace is after object operator (multiple)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '->\n\tb', '"']
        ),

        new LexerTestArgs('"$a->b', 'should end at EOF',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.ObjectOperator, TokenKind.Identifier],
          ['"', '$a', '->', 'b']
        ),
        new LexerTestArgs('"$a->b->c"', 'should end after first property',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.ObjectOperator, TokenKind.Identifier, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '->', 'b', '->c', '"']
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
        new LexerTestArgs('"${ab}"', 'indirect variable name (multiple characters)',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringIdentifier, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', 'ab', '}', '"']
        ),
        new LexerTestArgs('" ${a}"', 'indirect variable name in string with leading text',
          [TokenKind.DoubleQuote, TokenKind.StringTemplateLiteral, TokenKind.DollarOpenBrace, TokenKind.StringIdentifier, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', ' ', '${', 'a', '}', '"']
        ),
        new LexerTestArgs('"${a[0]}"', 'indirect variable name with offset',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringIdentifier, TokenKind.OpenBracket, TokenKind.LNumber, TokenKind.CloseBracket, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', 'a', '[', '0', ']', '}', '"']
        ),

        new LexerTestArgs('"${', 'should end at EOF',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace],
          ['"', '${',]
        ),
        new LexerTestArgs('"${"', 'should end after dollar open brace if variable name is missing',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringLiteral],
          ['"', '${', '"']
        ),
        new LexerTestArgs('"${a"', 'should end after dollar open brace if variable name is not followed by close brace or open bracket',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.Identifier,  TokenKind.StringLiteral],
          ['"', '${', 'a', '"']
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);
    });

    describe('in host language (from in script)', function() {
      // Start: At first character after a close tag.

      let lexerTests = [
        new LexerTestArgs('"${?><?php ', 'should end at open tag',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.CloseTag, TokenKind.OpenTag, TokenKind.Whitespace],
          ['"', '${', '?>', '<?php', ' ']
        ),

        new LexerTestArgs('"${?><?php } "', 'should not start after close brace in restarted script',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.CloseTag, TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.CloseBrace, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '${', '?>', '<?php', ' ', '}', ' ', '"']
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);
    });

    describe('in script', function() {
      let lexerTests = [
        // Embedded strings.
        new LexerTestArgs('"${"$a"}"', 'embedded string template',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringTemplate, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', '"$a"', '}', '"']
        ),
        new LexerTestArgs('"${\'}\'}"', 'should not end at close brace in single-quoted string',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringLiteral, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', '\'}\'', '}', '"']
        ),
        new LexerTestArgs('"${"}"}"', 'should not end at close brace in double-quoted string',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.StringLiteral, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', '"}"', '}', '"']
        ),
        new LexerTestArgs('"${`}`}"', 'should not end at close brace in back-quoted string',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.BackQuoteTemplate, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', '`}`', '}', '"']
        ),
        new LexerTestArgs('"${<<<LABEL\n}\nLABEL\n}"', 'should not end at close brace in heredoc',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.HeredocTemplate, TokenKind.NewLine, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', '<<<LABEL\n}\nLABEL', '\n', '}', '"']
        ),

        // Embedded comments.
        new LexerTestArgs('"${//comment\n}"', 'embedded line comment',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.SingleLineComment, TokenKind.NewLine, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', '//comment', '\n', '}', '"']
        ),
        new LexerTestArgs('"${//comment"', 'embedded line comment (unterminated)',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.SingleLineComment],
          ['"', '${', '//comment"']
        ),
        new LexerTestArgs('"${//}\n}"', 'should not end at close brace in line comment',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.SingleLineComment, TokenKind.NewLine, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', '//}', '\n', '}', '"']
        ),
        new LexerTestArgs('"${#}\n}"', 'should not end at close brace in line comment (# syntax)',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.SingleLineComment, TokenKind.NewLine, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', '#}', '\n', '}', '"']
        ),
        new LexerTestArgs('"${/*comment*/}"', 'embedded multiple line comment',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.MultipleLineComment, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', '/*comment*/', '}', '"']
        ),
        new LexerTestArgs('"${/*comment"', 'embedded multiple line comment (unterminated)',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.MultipleLineComment],
          ['"', '${', '/*comment"']
        ),
        new LexerTestArgs('"${/*}*/}"', 'should not end at close brace in multiple line comment',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.MultipleLineComment, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '${', '/*}*/', '}', '"']
        ),

        // Close tags.

        // NOTE: The trailing semicolon is required to determine where the
        // template ends. If it were not present, these tests could result in
        // a false negative because a close tag that is not found would produce
        // the same scan range as a close tag that is found.

        new LexerTestArgs('"${?>}";', 'should end at close tag',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.CloseTag, TokenKind.InlineText],
          ['"', '${', '?>', '}";']
        ),
        new LexerTestArgs('"${//comment?>}";', 'should end at close tag (line comment)',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.SingleLineComment, TokenKind.CloseTag, TokenKind.InlineText],
          ['"', '${', '//comment', '?>', '}";']
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);
    });

    describe('in script (from in double quote)', function() {
      // Start: At '$' after an opening brace.

      let lexerTests = [
        // Also tests that the state ends after an unpaired '}'.
        new LexerTestArgs('"{$a}"', 'variable substitution',
          [TokenKind.DoubleQuote, TokenKind.OpenBrace, TokenKind.Variable, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '{', '$a', '}', '"']
        ),
        new LexerTestArgs('"{$a{0}}"', 'should not end after paired close brace',
          [TokenKind.DoubleQuote, TokenKind.OpenBrace, TokenKind.Variable, TokenKind.OpenBrace, TokenKind.LNumber, TokenKind.CloseBrace, TokenKind.CloseBrace, TokenKind.DoubleQuote],
          ['"', '{', '$a', '{', '0', '}', '}', '"']
        ),
        new LexerTestArgs('"{$', 'should end at EOF',
          [TokenKind.DoubleQuote, TokenKind.OpenBrace, TokenKind.Dollar],
          ['"', '{', '$']
        ),
        new LexerTestArgs('"{${', 'should end at EOF (unmatched embedded open brace)',
          [TokenKind.DoubleQuote, TokenKind.OpenBrace, TokenKind.Dollar, TokenKind.OpenBrace],
          ['"', '{', '$', '{']
        ),
        new LexerTestArgs('"{$[', 'should end at EOF (unmatched embedded open bracket)',
          [TokenKind.DoubleQuote, TokenKind.OpenBrace, TokenKind.Dollar, TokenKind.OpenBracket],
          ['"', '{', '$', '[']
        ),
        new LexerTestArgs('"{$(', 'should end at EOF (unmatched embedded open parenthesis)',
          [TokenKind.DoubleQuote, TokenKind.OpenBrace, TokenKind.Dollar, TokenKind.OpenParen],
          ['"', '{', '$', '(']
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);
    });

    describe('in script (from looking for variable name)', function() {
      // Start: At first non-label character after the opening brace.

      let lexerTests = [
        // See "looking for variable name" for EOF test.

        new LexerTestArgs('"${{', 'should end at EOF (unmatched embedded open brace)',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.OpenBrace],
          ['"', '${', '{']
        ),
        new LexerTestArgs('"${[', 'should end at EOF (unmatched embedded open bracket)',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.OpenBracket],
          ['"', '${', '[']
        ),
        new LexerTestArgs('"${(', 'should end at EOF (unmatched embedded open parenthesis)',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.OpenParen],
          ['"', '${', '(']
        ),
        new LexerTestArgs('"${} "', 'should end after first unmatched close brace',
          [TokenKind.DoubleQuote, TokenKind.DollarOpenBrace, TokenKind.CloseBrace, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '${', '}', ' ', '"']
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);
    });

    describe('in variable offset', function() {
      let lexerTests = [
        new LexerTestArgs('"$a[10]"', 'variable with integer offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', '10', ']', '"']
        ),
        new LexerTestArgs('"$a[01]"', 'variable with integer offset (leading zero)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', '01', ']', '"']
        ),
        new LexerTestArgs('"$a[-1]"', 'variable with integer offset (negative)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.Minus, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', '-', '1', ']', '"']
        ),
        new LexerTestArgs('"$a[0]"', 'variable with integer offset (zero)',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', '0', ']', '"']
        ),
        new LexerTestArgs('"$a[0xFF]"', 'variable with hexadecimal offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', '0xFF', ']', '"']
        ),
        new LexerTestArgs('"$a[0b11]"', 'variable with binary offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', '0b11', ']', '"']
        ),
        new LexerTestArgs('"$a[$b]"', 'variable with variable offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.Variable, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', '$b', ']', '"']
        ),
        new LexerTestArgs('"$a[B]"', 'variable with constant offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.Identifier, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', 'B', ']', '"']
        ),

        // Invalid offsets.
        new LexerTestArgs('"$a[0.1]"', 'variable with floating-point offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '[', '0', '.1]', '"']
        ),
        new LexerTestArgs('"$a[-B]"', 'negative constant',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.Minus, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '[', '-', 'B]', '"']
        ),
        new LexerTestArgs('"$a[-]"', 'minus without integer offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.Minus, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', '-', ']', '"']
        ),
        new LexerTestArgs('"$a[0-]"', 'minus after integer offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '[', '0', '-]', '"']
        ),
        new LexerTestArgs('"$a[:]"', 'invalid offset character',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '[', ':]', '"']
        ),
        new LexerTestArgs('"$a[0xZZ]"', 'invalid hex offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '[', '0', 'xZZ]', '"']
        ),
        new LexerTestArgs('"$a[0bAA]"', 'invalid bin offset',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.StringTemplateLiteral, TokenKind.DoubleQuote],
          ['"', '$a', '[', '0', 'bAA]', '"']
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.StringTemplate);

      let lexerTests7_4 = [
        new LexerTestArgs('"$a[1_000]"', 'variable with integer offset containing separator',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', '1_000', ']', '"']
        ),
        new LexerTestArgs('"$a[0x00_FF]"', 'variable with hexadecimal offset containing separator',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', '0x00_FF', ']', '"']
        ),
        new LexerTestArgs('"$a[0b00_11]"', 'variable with binary offset containing separator',
          [TokenKind.DoubleQuote, TokenKind.Variable, TokenKind.OpenBracket, TokenKind.StringNumber, TokenKind.CloseBracket, TokenKind.DoubleQuote],
          ['"', '$a', '[', '0b00_11', ']', '"']
        ),
      ];
      assertRescannedTokens(lexerTests7_4, TokenKind.StringTemplate, PhpVersion.PHP7_4);
    });

  });

  describe('heredoc templates', function() {
    let lexerTests = [
      new LexerTestArgs('<<<LABEL\nLABEL\n', 'empty text',
        [TokenKind.HeredocStart, TokenKind.HeredocEnd],
        ['<<<LABEL\n', 'LABEL']
      ),
      new LexerTestArgs('<<<LABEL\ntext\nLABEL\n', 'plain text',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<LABEL\n', 'text\n', 'LABEL']
      ),
      new LexerTestArgs('<<<LABEL\n$a\nLABEL\n', 'simple variable',
        [TokenKind.HeredocStart, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<LABEL\n', '$a', '\n', 'LABEL']
      ),

      new LexerTestArgs('<<< LABEL\nLABEL\n', 'heredoc start label should allow leading space',
        [TokenKind.HeredocStart, TokenKind.HeredocEnd],
        ['<<< LABEL\n', 'LABEL']
      ),
      new LexerTestArgs('<<<\tLABEL\nLABEL\n', 'heredoc start label should allow leading tab',
        [TokenKind.HeredocStart, TokenKind.HeredocEnd],
        ['<<<\tLABEL\n', 'LABEL']
      ),

      new LexerTestArgs('<<<LABEL\nlabel\n', 'heredoc end label should be case-sensitive',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral],
        ['<<<LABEL\n', 'label\n']
      ),
      new LexerTestArgs('<<<END\nENDLABEL\nEND\n', 'heredoc end label should not partially match text',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<END\n', 'ENDLABEL\n', 'END']
      ),
      new LexerTestArgs('<<<END\nEND1\nEND\n', 'heredoc end label should not partially match text with digit',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<END\n', 'END1\n', 'END']
      ),

      new LexerTestArgs('<<<LABEL\n\nLABEL\n', 'should match end label after line break in text',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<LABEL\n', '\n', 'LABEL']
      ),
    ];
    assertRescannedTokens(lexerTests, TokenKind.HeredocTemplate);
  });

  describe('heredoc templates (with double quotes)', function() {
    let lexerTests = [
      new LexerTestArgs('<<<"LABEL"\nLABEL\n', 'empty text',
        [TokenKind.HeredocStart, TokenKind.HeredocEnd],
        ['<<<"LABEL"\n', 'LABEL']
      ),
      new LexerTestArgs('<<<"LABEL"\ntext\nLABEL\n', 'plain text',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<"LABEL"\n', 'text\n', 'LABEL']
      ),
      new LexerTestArgs('<<<"LABEL"\n$a\nLABEL\n', 'simple variable',
        [TokenKind.HeredocStart, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<"LABEL"\n', '$a', '\n', 'LABEL']
      ),
      new LexerTestArgs('<<<"LABEL"\nlabel\n', 'heredoc end label should be case-sensitive',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral],
        ['<<<"LABEL"\n', 'label\n']
      ),
    ];
    assertRescannedTokens(lexerTests, TokenKind.HeredocTemplate);
  });

  describe('nowdoc templates', function() {
    let lexerTests = [
      new LexerTestArgs('<<<\'LABEL\'\nLABEL\n', 'empty text',
        [TokenKind.HeredocStart, TokenKind.HeredocEnd],
        ['<<<\'LABEL\'\n', 'LABEL']
      ),
      new LexerTestArgs('<<<\'LABEL\'\ntext\nLABEL\n', 'plain text',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<\'LABEL\'\n', 'text\n', 'LABEL']
      ),
      new LexerTestArgs('<<<\'LABEL\'\n$a\nLABEL\n', 'simple variable',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<\'LABEL\'\n', '$a\n', 'LABEL']
      ),
      new LexerTestArgs('<<<\'LABEL\'\n\n\nLABEL\n', 'should match end label after line break in text',
        [TokenKind.HeredocStart, TokenKind.StringTemplateLiteral, TokenKind.HeredocEnd],
        ['<<<\'LABEL\'\n', '\n\n', 'LABEL']
      ),
    ];
    assertRescannedTokens(lexerTests, TokenKind.HeredocTemplate);
  });

  describe('flexible heredoc templates', function() {

    describe('indentation', function() {
      let lexerTests = [
        // InFlexibleHeredoc
        new LexerTestArgs('<<<LABEL\n  \n  LABEL', 'should tokenize a full indent',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '  ', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n\t\t\n\t\tLABEL', 'should tokenize a full indent (tabs)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '\t\t', '\n', '\t\t', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n  \n\t\tLABEL', 'should tokenize a full indent (mixed)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '  ', '\n', '\t\t', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n  abc\n  LABEL', 'should tokenize a full indent with trailing text',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringTemplateLiteral, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '  ', 'abc', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n\t\tabc\n\t\tLABEL', 'should tokenize a full indent with trailing text (tabs)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringTemplateLiteral, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '\t\t', 'abc', '\n', '\t\t', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n    \n  LABEL', 'should tokenize a full indent with trailing whitespace',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringTemplateLiteral, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '  ', '  ', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n\t\t\t\t\n\t\tLABEL', 'should tokenize a full indent with trailing whitespace (tabs)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringTemplateLiteral, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '\t\t', '\t\t', '\n', '\t\t', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n \n  LABEL', 'should tokenize a partial indent',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', ' ', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n\t\n\t\tLABEL', 'should tokenize a partial indent (tabs)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '\t', '\n', '\t\t', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n\t\n  LABEL', 'should tokenize a partial indent (mixed)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '\t', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n abc\n  LABEL', 'should tokenize a partial indent with trailing text',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringTemplateLiteral, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', ' ', 'abc', '\n', '  ', 'LABEL']
        ),

        new LexerTestArgs('<<<LABEL\n  $a  \n  LABEL', 'should not tokenize whitespace after interpolation as indentation',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.Variable, TokenKind.StringTemplateLiteral, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '  ', '$a', '  ', '\n', '  ', 'LABEL']
        ),

        // LookingForHeredocLabel
        new LexerTestArgs('<<<LABEL\n  LABEL', 'should tokenize end label indentation',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '  ', 'LABEL']
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.FlexdocTemplate);
    });

    describe('line breaks', function() {
      let lexerTests = [
        // NOTE: Other tests already cover line breaks after literals and indents.
        new LexerTestArgs('<<<LABEL\n  $a\n  LABEL', 'should tokenize a line break after an interpolation',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.Variable, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '  ', '$a', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n\n  LABEL', 'should tokenize a line break after the starting label',
          [TokenKind.HeredocStart, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\n  \n\n\n  LABEL', 'should tokenize multiple line breaks',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\n', '  ', '\n\n\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<LABEL\r\n  \r\n\r\n\r\n  LABEL', 'should tokenize multiple line breaks (CRLF)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<LABEL\r\n', '  ', '\r\n\r\n\r\n', '  ', 'LABEL']
        ),

        // @todo Test that line breaks stop at text and interpolations?
      ];
      assertRescannedTokens(lexerTests, TokenKind.FlexdocTemplate);
    });

  });

  describe('flexible nowdoc templates', function() {

    describe('indentation', function() {
      let lexerTests = [
        // InFlexibleNowdoc
        new LexerTestArgs('<<<\'LABEL\'\n  \n  LABEL', 'should tokenize a full indent',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '  ', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\n\t\t\n\t\tLABEL', 'should tokenize a full indent (tabs)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '\t\t', '\n', '\t\t', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\n  \n\t\tLABEL', 'should tokenize a full indent (mixed)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '  ', '\n', '\t\t', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\n  abc\n  LABEL', 'should tokenize a full indent with trailing text',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringTemplateLiteral, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '  ', 'abc', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\n\t\tabc\n\t\tLABEL', 'should tokenize a full indent with trailing text (tabs)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringTemplateLiteral, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '\t\t', 'abc', '\n', '\t\t', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\n    \n  LABEL', 'should tokenize a full indent with trailing whitespace',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringTemplateLiteral, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '  ', '  ', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\n\t\t\t\t\n\t\tLABEL', 'should tokenize a full indent with trailing whitespace (tabs)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringTemplateLiteral, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '\t\t', '\t\t', '\n', '\t\t', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\n \n  LABEL', 'should tokenize a partial indent',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', ' ', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\n\t\n\t\tLABEL', 'should tokenize a partial indent (tabs)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '\t', '\n', '\t\t', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\n\t\n  LABEL', 'should tokenize a partial indent (mixed)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '\t', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\n abc\n  LABEL', 'should tokenize a partial indent with trailing text',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringTemplateLiteral, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', ' ', 'abc', '\n', '  ', 'LABEL']
        ),

        // LookingForHeredocLabel
        new LexerTestArgs('<<<\'LABEL\'\n  LABEL', 'should tokenize end label indentation',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '  ', 'LABEL']
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.FlexdocTemplate);
    });

    describe('line breaks', function() {
      let lexerTests = [
        // NOTE: Other tests already cover line breaks after literals and indents.
        new LexerTestArgs('<<<\'LABEL\'\n\n  LABEL', 'should tokenize a line break after the starting label',
          [TokenKind.HeredocStart, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\n  \n\n\n  LABEL', 'should tokenize multiple line breaks',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\n', '  ', '\n\n\n', '  ', 'LABEL']
        ),
        new LexerTestArgs('<<<\'LABEL\'\r\n  \r\n\r\n\r\n  LABEL', 'should tokenize multiple line breaks (CRLF)',
          [TokenKind.HeredocStart, TokenKind.StringIndent, TokenKind.StringNewLine, TokenKind.StringIndent, TokenKind.HeredocEnd],
          ['<<<\'LABEL\'\r\n', '  ', '\r\n\r\n\r\n', '  ', 'LABEL']
        ),
      ];
      assertRescannedTokens(lexerTests, TokenKind.FlexdocTemplate);
    });

  });

  describe('shell command templates', function() {
    let lexerTests = [
      new LexerTestArgs('``', 'empty text', [TokenKind.BackQuote, TokenKind.BackQuote]),
      new LexerTestArgs('`abc`', 'plain text', [TokenKind.BackQuote, TokenKind.StringTemplateLiteral, TokenKind.BackQuote]),
      new LexerTestArgs('`$a`', 'simple variable', [TokenKind.BackQuote, TokenKind.Variable, TokenKind.BackQuote]),
    ];
    assertRescannedTokens(lexerTests, TokenKind.BackQuoteTemplate);
  });

});
