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

import {
  LexerTestArgs,
  LexerDiagnosticTestArgs,
  Test,
} from '../Test';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { PhpVersion } from '../../../src/parser/PhpVersion';
import { TokenKind } from '../../../src/language/TokenKind';

describe('PhpLexer', function() {

  describe('tokens', function() {

    describe('inline text', function() {
      let tests = [
        new LexerTestArgs('<h1></h1>', 'should match inline text', [TokenKind.InlineText], [], false),

        new LexerTestArgs('<?php ', 'should match open tag', [TokenKind.OpenTag], [], false),
        new LexerTestArgs('<h1><?php ', 'should match open tag after inline text', [TokenKind.InlineText, TokenKind.OpenTag], [], false),
        new LexerTestArgs('<?php', 'should not match open tag without trailing whitespace', [TokenKind.InlineText], [], false),
        new LexerTestArgs('<?phpunit', 'should not partially match open tag', [TokenKind.InlineText], [], false),

        new LexerTestArgs('<?=', 'should match open tag with echo', [TokenKind.OpenTagWithEcho], [], false),
        new LexerTestArgs('<h1><?=', 'should match open tag with echo after inline text', [TokenKind.InlineText, TokenKind.OpenTagWithEcho], [], false),

      //new LexerTestArgs('<?', 'should match short open tag', [TokenKind.ShortOpenTag], [], false),
      //new LexerTestArgs('<?php', 'should match short open tag in open tag', [TokenKind.ShortOpenTag, TokenKind.Identifier], [], false),
      //new LexerTestArgs('<h1><?', 'should match short open tag after inline text', [TokenKind.InlineText, TokenKind.ShortOpenTag], [], false),

        new LexerTestArgs('<?php ?>', 'should match close tag', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.CloseTag], [], false),
        new LexerTestArgs('<?php ?></h1>', 'should match inline text after close tag', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.CloseTag, TokenKind.InlineText], [], false),
        new LexerTestArgs('?>', 'should not match close tag without open tag', [TokenKind.InlineText], [], false),
      ];
      Test.assertTokens(tests);
    });

    describe('comments', function() {
      let tests = [
        new LexerTestArgs('<?php // line comment', 'single line comment using // syntax', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.SingleLineComment], [], false),
        new LexerTestArgs('<?php # line comment', 'single line comment using # syntax', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.SingleLineComment], [], false),
        new LexerTestArgs('<?php // comment\n ', 'single line comment with LF', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.SingleLineComment, TokenKind.NewLine, TokenKind.Whitespace], [], false),
        new LexerTestArgs('<?php // comment\r\n ', 'single line comment with CRLF', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.SingleLineComment, TokenKind.NewLine, TokenKind.Whitespace], [], false),
        new LexerTestArgs('<?php // comment ?> ', 'single line comment with close tag', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.SingleLineComment, TokenKind.CloseTag, TokenKind.InlineText], [], false),

        new LexerTestArgs('<?php /* */', 'multiple line comment on single line', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.MultipleLineComment], [], false),
        new LexerTestArgs('<?php /*\n*/', 'multiple line comment on multiple lines', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.MultipleLineComment], [], false),
        new LexerTestArgs('<?php /**/', 'multiple line comment without whitespace', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.MultipleLineComment], [], false),

        new LexerTestArgs('<?php /** */', 'documentation comment', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.DocumentationComment], [], false),
        new LexerTestArgs('<?php /****/', 'documentation comment requires whitespace', [TokenKind.OpenTag, TokenKind.Whitespace, TokenKind.MultipleLineComment], [], false),
      ];
      Test.assertTokens(tests);

      let diagnosticTests = [
        new LexerDiagnosticTestArgs('<?php /*', 'unterminated multiple line comment', TokenKind.MultipleLineComment, ErrorCode.WRN_UnterminatedComment),
        new LexerDiagnosticTestArgs('<?php /** ', 'unterminated documentation comment', TokenKind.DocumentationComment, ErrorCode.WRN_UnterminatedComment),
      ];
      Test.assertTokenDiagnostics(diagnosticTests);
    });

    describe('keywords', function() {
      let tests = [
        new LexerTestArgs('<?php abstract', 'abstract', [TokenKind.Abstract]),
        new LexerTestArgs('<?php array', 'array', [TokenKind.Array]),
        new LexerTestArgs('<?php as', 'as', [TokenKind.As]),
        new LexerTestArgs('<?php break', 'break', [TokenKind.Break]),
        new LexerTestArgs('<?php callable', 'callable', [TokenKind.Callable]),
        new LexerTestArgs('<?php case', 'case', [TokenKind.Case]),
        new LexerTestArgs('<?php catch', 'catch', [TokenKind.Catch]),
        new LexerTestArgs('<?php class', 'class', [TokenKind.Class]),
        new LexerTestArgs('<?php clone', 'clone', [TokenKind.Clone]),
        new LexerTestArgs('<?php const', 'const', [TokenKind.Const]),
        new LexerTestArgs('<?php continue', 'continue', [TokenKind.Continue]),
        new LexerTestArgs('<?php declare', 'declare', [TokenKind.Declare]),
        new LexerTestArgs('<?php default', 'default', [TokenKind.Default]),
        new LexerTestArgs('<?php die', 'die', [TokenKind.Die]),
        new LexerTestArgs('<?php do', 'do', [TokenKind.Do]),
        new LexerTestArgs('<?php echo', 'echo', [TokenKind.Echo]),
        new LexerTestArgs('<?php else', 'else', [TokenKind.Else]),
        new LexerTestArgs('<?php elseif', 'elseif', [TokenKind.ElseIf]),
        new LexerTestArgs('<?php empty', 'empty', [TokenKind.Empty]),
        new LexerTestArgs('<?php enddeclare', 'enddeclare', [TokenKind.EndDeclare]),
        new LexerTestArgs('<?php endfor', 'endfor', [TokenKind.EndFor]),
        new LexerTestArgs('<?php endforeach', 'endforeach', [TokenKind.EndForEach]),
        new LexerTestArgs('<?php endif', 'endif', [TokenKind.EndIf]),
        new LexerTestArgs('<?php endswitch', 'endswitch', [TokenKind.EndSwitch]),
        new LexerTestArgs('<?php endwhile', 'endwhile', [TokenKind.EndWhile]),
        new LexerTestArgs('<?php eval', 'eval', [TokenKind.Eval]),
        new LexerTestArgs('<?php exit', 'exit', [TokenKind.Exit]),
        new LexerTestArgs('<?php extends', 'extends', [TokenKind.Extends]),
        new LexerTestArgs('<?php final', 'final', [TokenKind.Final]),
        new LexerTestArgs('<?php finally', 'finally', [TokenKind.Finally]),
        new LexerTestArgs('<?php for', 'for', [TokenKind.For]),
        new LexerTestArgs('<?php foreach', 'foreach', [TokenKind.ForEach]),
        new LexerTestArgs('<?php function', 'function', [TokenKind.Function]),
        new LexerTestArgs('<?php global', 'global', [TokenKind.Global]),
        new LexerTestArgs('<?php goto', 'goto', [TokenKind.GoTo]),
        new LexerTestArgs('<?php if', 'if', [TokenKind.If]),
        new LexerTestArgs('<?php implements', 'implements', [TokenKind.Implements]),
        new LexerTestArgs('<?php include', 'include', [TokenKind.Include]),
        new LexerTestArgs('<?php include_once', 'include_once', [TokenKind.IncludeOnce]),
        new LexerTestArgs('<?php instanceof', 'instanceof', [TokenKind.InstanceOf]),
        new LexerTestArgs('<?php insteadof', 'insteadof', [TokenKind.InsteadOf]),
        new LexerTestArgs('<?php interface', 'interface', [TokenKind.Interface]),
        new LexerTestArgs('<?php isset', 'isset', [TokenKind.IsSet]),
        new LexerTestArgs('<?php list', 'list', [TokenKind.List]),
        new LexerTestArgs('<?php namespace', 'namespace', [TokenKind.Namespace]),
        new LexerTestArgs('<?php new', 'new', [TokenKind.New]),
        new LexerTestArgs('<?php print', 'print', [TokenKind.Print]),
        new LexerTestArgs('<?php protected', 'protected', [TokenKind.Protected]),
        new LexerTestArgs('<?php private', 'private', [TokenKind.Private]),
        new LexerTestArgs('<?php public', 'public', [TokenKind.Public]),
        new LexerTestArgs('<?php require', 'require', [TokenKind.Require]),
        new LexerTestArgs('<?php require_once', 'require_once', [TokenKind.RequireOnce]),
        new LexerTestArgs('<?php return', 'return', [TokenKind.Return]),
        new LexerTestArgs('<?php static', 'static', [TokenKind.Static]),
        new LexerTestArgs('<?php switch', 'switch', [TokenKind.Switch]),
        new LexerTestArgs('<?php throw', 'throw', [TokenKind.Throw]),
        new LexerTestArgs('<?php trait', 'trait', [TokenKind.Trait]),
        new LexerTestArgs('<?php try', 'try', [TokenKind.Try]),
        new LexerTestArgs('<?php while', 'while', [TokenKind.While]),
        new LexerTestArgs('<?php unset', 'unset', [TokenKind.Unset]),
        new LexerTestArgs('<?php use', 'use', [TokenKind.Use]),
        new LexerTestArgs('<?php var', 'var', [TokenKind.Var]),
        new LexerTestArgs('<?php yield', 'yield', [TokenKind.Yield]),
        // Multiple words.
        new LexerTestArgs('<?php yield from', 'yield from', [TokenKind.YieldFrom]),
        new LexerTestArgs('<?php yield\n\nfrom', 'yield from (multiple new lines)', [TokenKind.YieldFrom]),
        new LexerTestArgs('<?php yield from_', 'should not match partial identifier (yield from)', [TokenKind.Yield, TokenKind.Identifier]),
        // False positives.
        new LexerTestArgs('<?php catchable', 'should not match keyword at start of string (catch in catchable)', [TokenKind.Identifier], ['catchable']),
        new LexerTestArgs('<?php refuse', 'should not match keyword at end of string (use in refuse)', [TokenKind.Identifier], ['refuse']),
        new LexerTestArgs('<?php window', 'should not match keyword in middle of string (do in window)', [TokenKind.Identifier], ['window']),
      ];
      Test.assertTokens(tests);

      let tests7_4 = [
        new LexerTestArgs('<?php fn', 'fn', [TokenKind.Fn]),
      ];
      Test.assertTokens(tests7_4, PhpVersion.PHP7_4);

      let regressionTests7_4 = [
        new LexerTestArgs('<?php fn', 'fn', [TokenKind.Identifier]),
      ];
      Test.assertTokens(regressionTests7_4, PhpVersion.PHP7_0, PhpVersion.PHP7_3);
    });

    describe('string literals', function() {
      let tests = [
        new LexerTestArgs('<?php \'a\'', 'single quote', [TokenKind.StringLiteral], ['\'a\'']),
        new LexerTestArgs('<?php \'$a\'', 'single quote with variable', [TokenKind.StringLiteral], ['\'$a\'']),
        new LexerTestArgs('<?php \'\\\\\'', 'single quote with escaped backslash', [TokenKind.StringLiteral], ['\'\\\\\'']),
        new LexerTestArgs('<?php \'\\\'\'', 'single quote with escaped single quote', [TokenKind.StringLiteral], ['\'\\\'\'']),
        new LexerTestArgs('<?php \'\\n\'', 'single quote with escaped line feed (invalid)', [TokenKind.StringLiteral], ['\'\\n\'']),

        new LexerTestArgs('<?php "a"', 'double quote', [TokenKind.StringLiteral], ['"a"']),
        new LexerTestArgs('<?php "\\""', 'double quote with escaped double quote', [TokenKind.StringLiteral], ['"\\""']),
        new LexerTestArgs('<?php "\\n"', 'double quote with escaped line feed', [TokenKind.StringLiteral], ['"\\n"']),
        new LexerTestArgs('<?php "\\$a"', 'double quote with escaped variable sigil', [TokenKind.StringLiteral], ['"\\$a"']),
        new LexerTestArgs('<?php "$1.00"', 'double quote with text containing variable sigil', [TokenKind.StringLiteral], ['"$1.00"']),
        new LexerTestArgs('<?php "\\u110000"', 'double quote with JSON-encoded unicode escape sequence', [TokenKind.StringLiteral], ['"\\u110000"']),
      ];
      Test.assertTokens(tests);

      let diagnosticTests = [
        new LexerDiagnosticTestArgs('<?php \'a', 'unterminated string literal', TokenKind.StringLiteral, ErrorCode.ERR_UnterminatedStringConstant),
        new LexerDiagnosticTestArgs('<?php "\\u{"', 'double quote with unterminated unicode escape sequence', TokenKind.StringLiteral, ErrorCode.ERR_UnterminatedUnicodeEscapeSequence),
        new LexerDiagnosticTestArgs('<?php "\\u{}"', 'double quote with empty unicode escape sequence', TokenKind.StringLiteral, ErrorCode.ERR_InvalidEscapeSequenceUnicode),
        new LexerDiagnosticTestArgs('<?php "\\u{110000}"', 'double quote with unicode escape sequence overflow', TokenKind.StringLiteral, ErrorCode.ERR_UnicodeEscapeSequenceOverflow),
        new LexerDiagnosticTestArgs('<?php "\\400"', 'double quote with octal escape sequence overflow', TokenKind.StringLiteral, ErrorCode.WRN_OctalEscapeSequenceOverflow),
      ];
      Test.assertTokenDiagnostics(diagnosticTests);
    });

    describe('numbers', function() {
      let tests = [
        new LexerTestArgs('<?php 0xFF', 'hexadecimal number', [TokenKind.LNumber], ['0xFF']),
        new LexerTestArgs('<?php 0x00', 'hexadecimal number (all zeroes)', [TokenKind.LNumber], ['0x00']),
        new LexerTestArgs('<?php 0xF0', 'hexadecimal number with trailing zero', [TokenKind.LNumber], ['0xF0']),
        new LexerTestArgs('<?php 0x0F', 'hexadecimal number with leading zero', [TokenKind.LNumber], ['0x0F']),
      //new LexerTestArgs('<?php 0x7FFFFFFF', 'hex max int (32-bit)', [TokenKind.LNumber]),
      //new LexerTestArgs('<?php 0x8FFFFFFF', 'hex max int overflow (32-bit)', [TokenKind.DNumber]),
        new LexerTestArgs('<?php 0x7FFFFFFFFFFFFFFF', 'hex max int (64-bit)', [TokenKind.LNumber]),
        new LexerTestArgs('<?php 0x8FFFFFFFFFFFFFFF', 'hex max int overflow (64-bit)', [TokenKind.DNumber]),
        new LexerTestArgs('<?php 0b11', 'binary number', [TokenKind.LNumber], ['0b11']),
        new LexerTestArgs('<?php 0b00', 'binary number (all zeroes)', [TokenKind.LNumber], ['0b00']),
        new LexerTestArgs('<?php 0b10', 'binary number with trailing zero', [TokenKind.LNumber], ['0b10']),
        new LexerTestArgs('<?php 0b01', 'binary number with leading zero', [TokenKind.LNumber], ['0b01']),
      //new LexerTestArgs('<?php 0b01111111111111111111111111111111', 'bin max int (32-bit)', [TokenKind.LNumber]),
      //new LexerTestArgs('<?php 0b11111111111111111111111111111111', 'bin max int overflow (32-bit)', [TokenKind.DNumber]),
        new LexerTestArgs('<?php 0b0111111111111111111111111111111111111111111111111111111111111111', 'bin max int (64-bit)', [TokenKind.LNumber]),
        new LexerTestArgs('<?php 0b1111111111111111111111111111111111111111111111111111111111111111', 'bin max int overflow (64-bit)', [TokenKind.DNumber]),
        new LexerTestArgs('<?php 123', 'integer', [TokenKind.LNumber], ['123']),
        new LexerTestArgs('<?php 123e4', 'integer with exponent', [TokenKind.DNumber], ['123e4']),
        new LexerTestArgs('<?php 123E45', 'integer with exponent (uppercase)', [TokenKind.DNumber], ['123E45']),
        new LexerTestArgs('<?php 123e+4', 'integer with exponent and positive sign', [TokenKind.DNumber], ['123e+4']),
        new LexerTestArgs('<?php 123e-4', 'integer with exponent and negative sign', [TokenKind.DNumber], ['123e-4']),
        new LexerTestArgs('<?php 123e', 'integer with missing exponent', [TokenKind.LNumber, TokenKind.Identifier], ['123', 'e']),
        new LexerTestArgs('<?php 1.23', 'floating-point', [TokenKind.DNumber], ['1.23']),
        new LexerTestArgs('<?php 0.12', 'floating-point with leading zero', [TokenKind.DNumber], ['0.12']),
        new LexerTestArgs('<?php .123', 'floating-point without leading digits', [TokenKind.DNumber], ['.123']),
        new LexerTestArgs('<?php 1.23e4', 'floating-point with exponent', [TokenKind.DNumber], ['1.23e4']),
        new LexerTestArgs('<?php 1.23E45', 'floating-point with exponent (uppercase)', [TokenKind.DNumber], ['1.23E45']),
        new LexerTestArgs('<?php 1.23e+4', 'floating-point with exponent and positive sign', [TokenKind.DNumber], ['1.23e+4']),
        new LexerTestArgs('<?php 1.23e-4', 'floating-point with exponent and negative sign', [TokenKind.DNumber], ['1.23e-4']),
        new LexerTestArgs('<?php 1.23e', 'floating-point with missing exponent', [TokenKind.DNumber, TokenKind.Identifier], ['1.23', 'e']),
        new LexerTestArgs('<?php .0.12', 'floating-point with multiple decimal points', [TokenKind.DNumber, TokenKind.DNumber], ['.0', '.12']),
        new LexerTestArgs('<?php 0.1.2', 'floating-point with multiple decimal points and leading digits', [TokenKind.DNumber, TokenKind.DNumber], ['0.1', '.2']),
      ];
      Test.assertTokens(tests);

      let diagnosticTests = [
        new LexerDiagnosticTestArgs('<?php 0xYZ', 'hexadecimal number with invalid digits', TokenKind.LNumber, ErrorCode.ERR_InvalidNumber),
        new LexerDiagnosticTestArgs('<?php 0x', 'hexadecimal number with missing digits', TokenKind.LNumber, ErrorCode.ERR_InvalidNumber),

        new LexerDiagnosticTestArgs('<?php 0bAA', 'binary number with invalid digits', TokenKind.LNumber, ErrorCode.ERR_InvalidNumber),
        new LexerDiagnosticTestArgs('<?php 0b', 'binary number with missing digits', TokenKind.LNumber, ErrorCode.ERR_InvalidNumber),
      ];
      Test.assertTokenDiagnostics(diagnosticTests);
    });

    describe('punctuation', function() {
      let tests = [
        // Do not combine into single test (need to see multiple failures).
        new LexerTestArgs('<?php ;', 'semicolon', [TokenKind.Semicolon]),
        new LexerTestArgs('<?php :', 'colon', [TokenKind.Colon]),
        new LexerTestArgs('<?php ,', 'comma', [TokenKind.Comma]),
        new LexerTestArgs('<?php .', 'period', [TokenKind.Period]),
        new LexerTestArgs('<?php [', 'open bracket', [TokenKind.OpenBracket]),
        new LexerTestArgs('<?php ]', 'close bracket', [TokenKind.CloseBracket]),
        new LexerTestArgs('<?php (', 'open parenthesis', [TokenKind.OpenParen]),
        new LexerTestArgs('<?php )', 'close parenthesis', [TokenKind.CloseParen]),
        new LexerTestArgs('<?php |', 'vertical bar', [TokenKind.VerticalBar]),
        new LexerTestArgs('<?php ^', 'caret', [TokenKind.Caret]),
        new LexerTestArgs('<?php &', 'ampersand', [TokenKind.Ampersand]),
        new LexerTestArgs('<?php +', 'plus', [TokenKind.Plus]),
        new LexerTestArgs('<?php -', 'minus', [TokenKind.Minus]),
        new LexerTestArgs('<?php /', 'slash', [TokenKind.Slash]),
        new LexerTestArgs('<?php *', 'asterisk', [TokenKind.Asterisk]),
        new LexerTestArgs('<?php =', 'equal', [TokenKind.Equal]),
        new LexerTestArgs('<?php %', 'percent', [TokenKind.Percent]),
        new LexerTestArgs('<?php !', 'exclamation', [TokenKind.Exclamation]),
        new LexerTestArgs('<?php ~', 'tilde', [TokenKind.Tilde]),
        new LexerTestArgs('<?php $', 'dollar', [TokenKind.Dollar]),
        new LexerTestArgs('<?php <', 'less than', [TokenKind.LessThan]),
        new LexerTestArgs('<?php >', 'greater than', [TokenKind.GreaterThan]),
        new LexerTestArgs('<?php ?', 'question', [TokenKind.Question]),
        new LexerTestArgs('<?php @', 'at', [TokenKind.At]),
      ];
      Test.assertTokens(tests);
    });

    describe('punctuation (compound)', function() {
      let tests = [
        // Arithmetic
        new LexerTestArgs('<?php +=', 'plus equal', [TokenKind.PlusEqual]),
        new LexerTestArgs('<?php -=', 'minus equal', [TokenKind.MinusEqual]),
        new LexerTestArgs('<?php *=', 'multiply equal', [TokenKind.MultiplyEqual]),
        new LexerTestArgs('<?php /=', 'divide equal', [TokenKind.DivideEqual]),
        new LexerTestArgs('<?php %=', 'mod equal', [TokenKind.ModEqual]),
        new LexerTestArgs('<?php **', 'pow', [TokenKind.Pow]),
        new LexerTestArgs('<?php **=', 'pow equal', [TokenKind.PowEqual]),
        new LexerTestArgs('<?php ++', 'increment', [TokenKind.Increment]),
        new LexerTestArgs('<?php --', 'decrement', [TokenKind.Decrement]),
        // Bitwise
        new LexerTestArgs('<?php &=', 'and equal', [TokenKind.AndEqual]),
        new LexerTestArgs('<?php |=', 'or equal', [TokenKind.OrEqual]),
        new LexerTestArgs('<?php ^=', 'xor equal', [TokenKind.XorEqual]),
        new LexerTestArgs('<?php <<', 'shift left', [TokenKind.ShiftLeft]),
        new LexerTestArgs('<?php <<=', 'shift left equal', [TokenKind.ShiftLeftEqual]),
        new LexerTestArgs('<?php >>', 'shift right', [TokenKind.ShiftRight]),
        new LexerTestArgs('<?php >>=', 'shift right equal', [TokenKind.ShiftRightEqual]),
        // Comparison
        new LexerTestArgs('<?php ==', 'equal', [TokenKind.IsEqual]),
        new LexerTestArgs('<?php !=', 'not equal', [TokenKind.IsNotEqual]),
        new LexerTestArgs('<?php <>', 'not equal (alternate)', [TokenKind.Inequality]),
        new LexerTestArgs('<?php ===', 'is identical', [TokenKind.IsIdentical]),
        new LexerTestArgs('<?php !==', 'is not identical', [TokenKind.IsNotIdentical]),
        new LexerTestArgs('<?php <=', 'smaller or equal', [TokenKind.IsLessThanOrEqual]),
        new LexerTestArgs('<?php >=', 'greater or equal', [TokenKind.IsGreaterThanOrEqual]),
        new LexerTestArgs('<?php ??', 'coalesce', [TokenKind.Coalesce]),
        new LexerTestArgs('<?php <=>', 'spaceship', [TokenKind.Spaceship]),
        // Logical
        new LexerTestArgs('<?php &&', 'boolean and', [TokenKind.BooleanAnd]),
        new LexerTestArgs('<?php ||', 'boolean or', [TokenKind.BooleanOr]),
        // Objects
        new LexerTestArgs('<?php .=', 'concat equal', [TokenKind.ConcatEqual]),
        new LexerTestArgs('<?php ::', 'double colon', [TokenKind.DoubleColon]),
        new LexerTestArgs('<?php =>', 'double arrow', [TokenKind.DoubleArrow]),
        new LexerTestArgs('<?php ->', 'object operator', [TokenKind.ObjectOperator]),
      ];
      Test.assertTokens(tests);

      let tests7_4 = [
        new LexerTestArgs('<?php ??=', 'coalesce equal', [TokenKind.CoalesceEqual]),
      ];
      Test.assertTokens(tests7_4, PhpVersion.PHP7_4);
    });

    describe('type casts', function() {
      let tests = [
        new LexerTestArgs('<?php (array)', 'to array (array)', [TokenKind.ArrayCast]),
        new LexerTestArgs('<?php (binary)', 'to string (binary)', [TokenKind.BinaryCast]),
        new LexerTestArgs('<?php (bool)', 'to boolean (bool)', [TokenKind.BoolCast]),
        new LexerTestArgs('<?php (boolean)', 'to boolean (boolean)', [TokenKind.BooleanCast]),
        new LexerTestArgs('<?php (double)', 'to float (double)', [TokenKind.DoubleCast]),
        new LexerTestArgs('<?php (int)', 'to integer (int)', [TokenKind.IntCast]),
        new LexerTestArgs('<?php (integer)', 'to integer (integer)', [TokenKind.IntegerCast]),
        new LexerTestArgs('<?php (float)', 'to float (float)', [TokenKind.FloatCast]),
        new LexerTestArgs('<?php (object)', 'to object (object)', [TokenKind.ObjectCast]),
        new LexerTestArgs('<?php (real)', 'to float (real)', [TokenKind.RealCast]),
        new LexerTestArgs('<?php (string)', 'to string (string)', [TokenKind.StringCast]),
        new LexerTestArgs('<?php (unset)', 'type unset', [TokenKind.UnsetCast]),
        new LexerTestArgs('<?php (  int)', 'should match with leading spaces', [TokenKind.IntCast]),
        new LexerTestArgs('<?php (int  )', 'should match with trailing spaces', [TokenKind.IntCast]),
        new LexerTestArgs('<?php (\tint)', 'should match with leading tab', [TokenKind.IntCast]),
        new LexerTestArgs('<?php (int\t)', 'should match with trailing tab', [TokenKind.IntCast]),
        new LexerTestArgs('<?php (\nint)', 'should not match with new lines', [TokenKind.OpenParen, TokenKind.Identifier, TokenKind.CloseParen]),
      ];
      Test.assertTokens(tests);
    });

    describe('variables', function() {
      let tests = [
        new LexerTestArgs('<?php $a', 'variable', [TokenKind.Variable], ['$a']),
        new LexerTestArgs('<?php $_', 'variable (underscore)', [TokenKind.Variable], ['$_']),
        new LexerTestArgs('<?php $\x80', 'variable (lowest extended character)', [TokenKind.Variable], ['$\x80']),
        new LexerTestArgs('<?php $\xFF', 'variable (highest extended character)', [TokenKind.Variable], ['$\xFF']),
        new LexerTestArgs('<?php $1', 'should not start with a number', [TokenKind.Dollar, TokenKind.LNumber], ['$', '1']),
      ];
      Test.assertTokens(tests);
    });

    describe('variables (7.0)', function() {
      let tests = [
        new LexerTestArgs('<?php $\x7F', 'variable (lowest extended character)', [TokenKind.Variable], ['$\x7F']),
      ];
      Test.assertTokens(tests, PhpVersion.PHP7_0, PhpVersion.PHP7_0);
    });

    describe('unexpected characters', function() {
      let diagnosticTests = [
        new LexerDiagnosticTestArgs('<?php \v', 'should skip unexpected characters (at EOF)', TokenKind.Error, ErrorCode.ERR_UnexpectedCharacter),
      ];
      Test.assertTokenDiagnostics(diagnosticTests);
    });

  });

});
