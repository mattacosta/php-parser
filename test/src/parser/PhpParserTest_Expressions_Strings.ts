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

import {
  DiagnosticTestArgs,
  ParserTestArgs,
  Test
} from '../Test';

import {
  ElementAccessSyntaxNode,
  ExpressionStatementSyntaxNode,
  FlexibleHeredocElementSyntaxNode,
  FlexibleHeredocTemplateSyntaxNode,
  HeredocTemplateSyntaxNode,
  IndirectStringVariableSyntaxNode,
  LiteralSyntaxNode,
  LocalVariableSyntaxNode,
  NamedMemberAccessSyntaxNode,
  ShellCommandTemplateSyntaxNode,
  StringElementAccessSyntaxNode,
  StringExpressionSyntaxNode,
  StringTemplateSyntaxNode,
  StringVariableSyntaxNode,
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { ISyntaxNode } from '../../../src/language/syntax/ISyntaxNode';
import { PhpVersion } from '../../../src/parser/PhpVersion';
import { TokenKind } from '../../../src/language/TokenKind';

function assertFlexibleHeredocLine(node: ISyntaxNode, sourceText: string, indent: string, templateText?: string | null): ISyntaxNode[] {
  let element = <FlexibleHeredocElementSyntaxNode>node;
  assert.strictEqual(element instanceof FlexibleHeredocElementSyntaxNode, true, 'FlexibleHeredocElementSyntaxNode');
  Test.assertSyntaxToken(element.indent, sourceText, TokenKind.StringIndent, indent);
  let template = element.template ? element.template.childNodes() : [];
  if (templateText) {
    // Simple literal.
    assert.strictEqual(template.length, 1);
    let stringLiteral = <LiteralSyntaxNode>template[0];
    assert.strictEqual(stringLiteral instanceof LiteralSyntaxNode, true);
    Test.assertSyntaxToken(stringLiteral.value, sourceText, TokenKind.StringTemplateLiteral, templateText);
  }
  else if (templateText === null) {
    // Intended to be empty.
    assert.strictEqual(element.template, null);
  }
  else {
    // Interpolations.
    assert.notEqual(template.length, 0);
  }
  return template;
}

function assertFlexibleHeredocTemplate(statements: ISyntaxNode[]): ISyntaxNode[] {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let interpolatedString = <FlexibleHeredocTemplateSyntaxNode>exprNode.expression;
  assert.strictEqual(interpolatedString instanceof FlexibleHeredocTemplateSyntaxNode, true, 'FlexibleHeredocTemplateSyntaxNode');
  return interpolatedString.flexibleElements.childNodes();
}

function assertStringTemplate(statements: ISyntaxNode[]): ISyntaxNode[] {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let interpolatedString = <StringTemplateSyntaxNode>exprNode.expression;
  assert.strictEqual(interpolatedString instanceof StringTemplateSyntaxNode, true, 'StringTemplateSyntaxNode');
  return interpolatedString.template.childNodes();
}

describe('PhpParser', function() {

  describe('string-template', function() {
    let syntaxTests = [
      // Variable.
      new ParserTestArgs('"$a";', 'should parse a template', (statements) => {
        let contents = assertStringTemplate(statements);
        assert.strictEqual(contents[0] instanceof LocalVariableSyntaxNode, true);
      }),
      new ParserTestArgs('"$a->b";', 'should parse a template using member access', (statements) => {
        let contents = assertStringTemplate(statements);
        assert.strictEqual(contents[0] instanceof NamedMemberAccessSyntaxNode, true);
      }),
      new ParserTestArgs('"$a->class";', 'should parse a template using member access with keyword (class)', (statements) => {
        let contents = assertStringTemplate(statements);
        assert.strictEqual(contents[0] instanceof NamedMemberAccessSyntaxNode, true);
      }),

      // Variable with element access.
      new ParserTestArgs('"$a[0]";', 'should parse a template using element access with numeric offset', (statements, text) => {
        let contents = assertStringTemplate(statements);
        let elementAccess = <StringElementAccessSyntaxNode>contents[0];
        assert.strictEqual(elementAccess instanceof StringElementAccessSyntaxNode, true, 'StringElementAccessSyntaxNode');
        Test.assertSyntaxToken(elementAccess.variable, text, TokenKind.Variable, '$a');
        assert.strictEqual(elementAccess.minus, null);
        Test.assertSyntaxToken(elementAccess.index, text, TokenKind.StringNumber, '0');
      }),
      new ParserTestArgs('"$a[-1]";', 'should parse a template using element access with numeric offset (negative)', (statements, text) => {
        let contents = assertStringTemplate(statements);
        let elementAccess = <StringElementAccessSyntaxNode>contents[0];
        assert.strictEqual(elementAccess instanceof StringElementAccessSyntaxNode, true, 'StringElementAccessSyntaxNode');
        Test.assertSyntaxToken(elementAccess.variable, text, TokenKind.Variable, '$a');
        Test.assertSyntaxToken(elementAccess.minus, text, TokenKind.Minus, '-');
        Test.assertSyntaxToken(elementAccess.index, text, TokenKind.StringNumber, '1');
      }),
      new ParserTestArgs('"$a[B]";', 'should parse a template using element access with named offset', (statements, text) => {
        let contents = assertStringTemplate(statements);
        let elementAccess = <StringElementAccessSyntaxNode>contents[0];
        assert.strictEqual(elementAccess instanceof StringElementAccessSyntaxNode, true, 'StringElementAccessSyntaxNode');
        Test.assertSyntaxToken(elementAccess.variable, text, TokenKind.Variable, '$a');
        assert.strictEqual(elementAccess.minus, null);
        Test.assertSyntaxToken(elementAccess.index, text, TokenKind.Identifier, 'B');
      }),
      new ParserTestArgs('"$a[$b]";', 'should parse a template using element access with variable offset', (statements, text) => {
        let contents = assertStringTemplate(statements);
        let elementAccess = <StringElementAccessSyntaxNode>contents[0];
        assert.strictEqual(elementAccess instanceof StringElementAccessSyntaxNode, true, 'StringElementAccessSyntaxNode');
        Test.assertSyntaxToken(elementAccess.variable, text, TokenKind.Variable, '$a');
        assert.strictEqual(elementAccess.minus, null);
        Test.assertSyntaxToken(elementAccess.index, text, TokenKind.Variable, '$b');
      }),

      // Indirect variable name.
      new ParserTestArgs('"${a}";', 'should parse a template using indirect variable name', (statements) => {
        let contents = assertStringTemplate(statements);
        let variable = <IndirectStringVariableSyntaxNode>contents[0];
        assert.strictEqual(variable instanceof IndirectStringVariableSyntaxNode, true);
        assert.strictEqual(variable.expression instanceof StringVariableSyntaxNode, true);
      }),
      new ParserTestArgs('"${a[0]}";', 'should parse a template using element access of indirect variable name', (statements) => {
        let contents = assertStringTemplate(statements);
        let variable = <IndirectStringVariableSyntaxNode>contents[0];
        assert.strictEqual(variable instanceof IndirectStringVariableSyntaxNode, true);
        let elementAccess = <ElementAccessSyntaxNode>variable.expression;
        assert.strictEqual(elementAccess instanceof ElementAccessSyntaxNode, true);
        assert.strictEqual(elementAccess.dereferenceable instanceof StringVariableSyntaxNode, true);
        assert.strictEqual(elementAccess.index instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('"${$a}";', 'should parse a template using indirect variable name with expression', (statements) => {
        let contents = assertStringTemplate(statements);
        let variable = <IndirectStringVariableSyntaxNode>contents[0];
        assert.strictEqual(variable instanceof IndirectStringVariableSyntaxNode, true);
        assert.strictEqual(variable.expression instanceof LocalVariableSyntaxNode, true);
      }),

      // Expression.
      new ParserTestArgs('"{$a}";', 'should parse a template using variable expression', (statements) => {
        let contents = assertStringTemplate(statements);
        let strExpr = <StringExpressionSyntaxNode>contents[0];
        assert.strictEqual(strExpr instanceof StringExpressionSyntaxNode, true);
        assert.strictEqual(strExpr.expression instanceof LocalVariableSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      // All incomplete variables are just plain variables followed by strings.

      // Variable with element access.
      new DiagnosticTestArgs('"$a[]";', 'missing identifier, variable, minus, or string number', [ErrorCode.ERR_StringOffsetExpected], [4]),
      new DiagnosticTestArgs('"$a[0";', 'missing close bracket', [ErrorCode.ERR_CloseBracketExpected], [5]),
      new DiagnosticTestArgs('"$a[-";', 'missing string number', [ErrorCode.ERR_StringOffsetNumberExpected], [5]),

      // Indirect variable name.
      new DiagnosticTestArgs('"${}";', 'missing expression or string identifier', [ErrorCode.ERR_StringVariableNameExpected], [3]),

      // Expression.
      new DiagnosticTestArgs('"{$}";', 'partial variable name', [ErrorCode.ERR_IncompleteVariable], [2]),

      // @todo These should be recovery tests.
      new DiagnosticTestArgs('"${a";', 'missing close brace (indirect variable name)', [ErrorCode.ERR_UnterminatedString, ErrorCode.ERR_CloseBraceExpected], [0, 4]),
      new DiagnosticTestArgs('"${a[0}";', 'missing close bracket (indirect variable name)', [ErrorCode.ERR_CloseBracketExpected], [6]),

      new DiagnosticTestArgs('"{$a";', 'missing close brace (expression)', [ErrorCode.ERR_UnterminatedString, ErrorCode.ERR_CloseBraceExpected], [0, 4]),
      new DiagnosticTestArgs('"{$a[0}";', 'missing close bracket (expression)', [ErrorCode.ERR_CloseBracketExpected], [6]),

      new DiagnosticTestArgs('"$a" "";', 'should use template span of string template', [ErrorCode.ERR_SemicolonExpected], [4]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('shell-command', function() {
    let syntaxTests = [
      new ParserTestArgs('`a`;', 'should parse a shell command expression', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let shellCommand = <ShellCommandTemplateSyntaxNode>exprNode.expression;
        assert.strictEqual(shellCommand instanceof ShellCommandTemplateSyntaxNode, true);
        let contents = shellCommand.template ? shellCommand.template.childNodes() : [];
        assert.strictEqual(contents[0] instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('``;', 'should parse a shell command expression (empty)', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let shellCommand = <ShellCommandTemplateSyntaxNode>exprNode.expression;
        assert.strictEqual(shellCommand instanceof ShellCommandTemplateSyntaxNode, true);
        assert.strictEqual(shellCommand.template, null);
      }),
      new ParserTestArgs('`$a`;', 'should parse a shell command expression with interpolation', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let shellCommand = <ShellCommandTemplateSyntaxNode>exprNode.expression;
        assert.strictEqual(shellCommand instanceof ShellCommandTemplateSyntaxNode, true);
        let contents = shellCommand.template ? shellCommand.template.childNodes() : [];
        assert.strictEqual(contents[0] instanceof LocalVariableSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('`', 'missing back quote', [ErrorCode.ERR_UnterminatedString], [0]),
      new DiagnosticTestArgs('`a', 'missing back quote (after literal)', [ErrorCode.ERR_UnterminatedString], [0]),
      new DiagnosticTestArgs('`$a', 'missing back quote (after interpolation)', [ErrorCode.ERR_UnterminatedString], [0]),

      new DiagnosticTestArgs('`$a` "";', 'should use template span of shell command template', [ErrorCode.ERR_SemicolonExpected], [4]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('heredoc', function() {
    let syntaxTests = [
      new ParserTestArgs('<<<LABEL\na\nLABEL;\n', 'should parse a heredoc string', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let heredoc = <HeredocTemplateSyntaxNode>exprNode.expression;
        assert.strictEqual(heredoc instanceof HeredocTemplateSyntaxNode, true);
        let contents = heredoc.template ? heredoc.template.childNodes() : [];
        assert.strictEqual(contents[0] instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('<<<LABEL\nLABEL;\n', 'should parse a heredoc string (empty)', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let heredoc = <HeredocTemplateSyntaxNode>exprNode.expression;
        assert.strictEqual(heredoc instanceof HeredocTemplateSyntaxNode, true);
        assert.strictEqual(heredoc.template, null);
      }),
      new ParserTestArgs('<<<LABEL\n$a\nLABEL;\n', 'should parse a heredoc string with interpolation', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let heredoc = <HeredocTemplateSyntaxNode>exprNode.expression;
        assert.strictEqual(heredoc instanceof HeredocTemplateSyntaxNode, true);
        let contents = heredoc.template ? heredoc.template.childNodes() : [];
        assert.strictEqual(contents[0] instanceof LocalVariableSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('<<<LABEL\n', 'missing end label', [ErrorCode.ERR_UnterminatedString], [0]),
      new DiagnosticTestArgs('<<<LABEL\na', 'missing end label (after literal)', [ErrorCode.ERR_UnterminatedString], [0]),
      new DiagnosticTestArgs('<<<LABEL\n$a', 'missing end label (after interpolation)', [ErrorCode.ERR_UnterminatedString], [0]),
    ];
    Test.assertDiagnostics(diagnosticTests);

    let diagnosticTests7_3 = [
      // Unlike other templates, heredocs are not required to contain any
      // template spans, which means that they can successfully parse with
      // incorrect tokens. Adding leading text to the string will however
      // force any incorrect tokens into causing a different parser exception.
      new DiagnosticTestArgs('<<<LABEL\n  $a\nLABEL "";', 'should use template span of heredoc', [ErrorCode.ERR_SemicolonExpected], [19]),
    ];
    Test.assertDiagnostics(diagnosticTests7_3, PhpVersion.PHP7_3);
  });

  describe('nowdoc', function() {
    let syntaxTests = [
      new ParserTestArgs('<<<\'LABEL\'\na\nLABEL;\n', 'should parse a nowdoc string', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let heredoc = <HeredocTemplateSyntaxNode>exprNode.expression;
        assert.strictEqual(heredoc instanceof HeredocTemplateSyntaxNode, true);
        let contents = heredoc.template ? heredoc.template.childNodes() : [];
        assert.strictEqual(contents[0] instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('<<<\'LABEL\'\nLABEL;\n', 'should parse a nowdoc string (empty)', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let heredoc = <HeredocTemplateSyntaxNode>exprNode.expression;
        assert.strictEqual(heredoc instanceof HeredocTemplateSyntaxNode, true);
        assert.strictEqual(heredoc.template, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    // See heredoc for diagnostic tests.
  });

  describe('flexible-heredoc', function() {
    let syntaxTests = [
      new ParserTestArgs('<<<LABEL\n  LABEL;', 'should parse a flexible heredoc string (empty)', (statements, text) => {
        let elements = assertFlexibleHeredocTemplate(statements);
        assert.strictEqual(elements.length, 1);
        assertFlexibleHeredocLine(elements[0], text, '  ', null);
      }),

      new ParserTestArgs('<<<LABEL\n\n  LABEL;', 'should parse an empty line', (statements, text) => {
        let elements = assertFlexibleHeredocTemplate(statements);
        assert.strictEqual(elements.length, 2);
        let lineBreak = <LiteralSyntaxNode>elements[0];
        assert.strictEqual(lineBreak instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
        Test.assertSyntaxToken(lineBreak.value, text, TokenKind.StringLineBreak, '\n');
        assertFlexibleHeredocLine(elements[1], text, '  ', null);
      }),
      new ParserTestArgs('<<<LABEL\n  \n  LABEL;', 'should parse an indented line', (statements, text) => {
        let elements = assertFlexibleHeredocTemplate(statements);
        assert.strictEqual(elements.length, 3);
        assertFlexibleHeredocLine(elements[0], text, '  ', null);
        let lineBreak = <LiteralSyntaxNode>elements[1];
        assert.strictEqual(lineBreak instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
        assertFlexibleHeredocLine(elements[2], text, '  ', null);
      }),

      new ParserTestArgs('<<<LABEL\n  a\n  LABEL;', 'should parse an indented line with literal', (statements, text) => {
        let elements = assertFlexibleHeredocTemplate(statements);
        assert.strictEqual(elements.length, 3);
        assertFlexibleHeredocLine(elements[0], text, '  ', 'a');
        let lineBreak = <LiteralSyntaxNode>elements[1];
        assert.strictEqual(lineBreak instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
        assertFlexibleHeredocLine(elements[2], text, '  ', null);
      }),
      new ParserTestArgs('<<<LABEL\n  $a\n  LABEL;', 'should parse an indented line with interpolation', (statements, text) => {
        let elements = assertFlexibleHeredocTemplate(statements);
        assert.strictEqual(elements.length, 3);
        let interpolations = assertFlexibleHeredocLine(elements[0], text, '  ');
        let variable = <LocalVariableSyntaxNode>interpolations[0];
        assert.strictEqual(variable instanceof LocalVariableSyntaxNode, true);
        Test.assertSyntaxToken(variable.variable, text, TokenKind.Variable, '$a');
        let lineBreak = <LiteralSyntaxNode>elements[1];
        assert.strictEqual(lineBreak instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
        assertFlexibleHeredocLine(elements[2], text, '  ', null);
      }),
      new ParserTestArgs('<<<LABEL\n  $a b\n  LABEL;', 'should parse an indented line with interpolation followed by literal', (statements, text) => {
        let elements = assertFlexibleHeredocTemplate(statements);
        assert.strictEqual(elements.length, 3);

        let interpolations = assertFlexibleHeredocLine(elements[0], text, '  ');
        let variable = <LocalVariableSyntaxNode>interpolations[0];
        assert.strictEqual(variable instanceof LocalVariableSyntaxNode, true);
        Test.assertSyntaxToken(variable.variable, text, TokenKind.Variable, '$a');
        let literal = <LiteralSyntaxNode>interpolations[1];
        Test.assertSyntaxToken(literal.value, text, TokenKind.StringTemplateLiteral, ' b');

        let lineBreak = <LiteralSyntaxNode>elements[1];
        assert.strictEqual(lineBreak instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
        assertFlexibleHeredocLine(elements[2], text, '  ', null);
      }),
      new ParserTestArgs('<<<LABEL\n  a $b\n  LABEL;', 'should parse an indented line with literal followed by interpolation', (statements, text) => {
        let elements = assertFlexibleHeredocTemplate(statements);
        assert.strictEqual(elements.length, 3);

        let interpolations = assertFlexibleHeredocLine(elements[0], text, '  ');
        let literal = <LiteralSyntaxNode>interpolations[0];
        Test.assertSyntaxToken(literal.value, text, TokenKind.StringTemplateLiteral, 'a ');
        let variable = <LocalVariableSyntaxNode>interpolations[1];
        assert.strictEqual(variable instanceof LocalVariableSyntaxNode, true);
        Test.assertSyntaxToken(variable.variable, text, TokenKind.Variable, '$b');

        let lineBreak = <LiteralSyntaxNode>elements[1];
        assert.strictEqual(lineBreak instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
        assertFlexibleHeredocLine(elements[2], text, '  ', null);
      }),
      new ParserTestArgs('<<<LABEL\n  $a$b\n  LABEL;', 'should parse an indented line with consecutive interpolations', (statements, text) => {
        let elements = assertFlexibleHeredocTemplate(statements);
        assert.strictEqual(elements.length, 3);

        let interpolations = assertFlexibleHeredocLine(elements[0], text, '  ');
        let firstVariable = <LocalVariableSyntaxNode>interpolations[0];
        assert.strictEqual(firstVariable instanceof LocalVariableSyntaxNode, true);
        Test.assertSyntaxToken(firstVariable.variable, text, TokenKind.Variable, '$a');
        let secondVariable = <LocalVariableSyntaxNode>interpolations[1];
        assert.strictEqual(secondVariable instanceof LocalVariableSyntaxNode, true);
        Test.assertSyntaxToken(secondVariable.variable, text, TokenKind.Variable, '$b');

        let lineBreak = <LiteralSyntaxNode>elements[1];
        assert.strictEqual(lineBreak instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
        assertFlexibleHeredocLine(elements[2], text, '  ', null);
      }),

      new ParserTestArgs('<<<LABEL\n  ${a}\n  LABEL;', 'should parse an indented line with indirection', (statements, text) => {
        let elements = assertFlexibleHeredocTemplate(statements);
        assert.strictEqual(elements.length, 3);
        let interpolations = assertFlexibleHeredocLine(elements[0], text, '  ');
        let variable = <IndirectStringVariableSyntaxNode>interpolations[0];
        assert.strictEqual(variable instanceof IndirectStringVariableSyntaxNode, true);
        let lineBreak = <LiteralSyntaxNode>elements[1];
        assert.strictEqual(lineBreak instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
        assertFlexibleHeredocLine(elements[2], text, '  ', null);
      }),
      new ParserTestArgs('<<<LABEL\n  {$a}\n  LABEL;', 'should parse an indented line with interpolated expression', (statements, text) => {
        let elements = assertFlexibleHeredocTemplate(statements);
        assert.strictEqual(elements.length, 3);
        let interpolations = assertFlexibleHeredocLine(elements[0], text, '  ');
        let strExpr = <StringExpressionSyntaxNode>interpolations[0];
        assert.strictEqual(strExpr instanceof StringExpressionSyntaxNode, true);
        let lineBreak = <LiteralSyntaxNode>elements[1];
        assert.strictEqual(lineBreak instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
        assertFlexibleHeredocLine(elements[2], text, '  ', null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests, PhpVersion.PHP7_3);

    let diagnosticTests = [
      new DiagnosticTestArgs('<<<LABEL\na\n  LABEL;', 'missing indent', [ErrorCode.ERR_HeredocIndentExpected], [9]),

      // @todo Lexer tests.
      new DiagnosticTestArgs('<<<LABEL\n\t\ta\n  LABEL;', 'should match indent of end label', [ErrorCode.ERR_HeredocIndentMismatch], [9]),
      new DiagnosticTestArgs('<<<LABEL\n  a\n\t\tLABEL;', 'should match indent of end label (tabs)', [ErrorCode.ERR_HeredocIndentMismatch], [9]),
      new DiagnosticTestArgs('<<<LABEL\n a\n  LABEL;', 'should not partially match indent of end label', [ErrorCode.ERR_HeredocIndentMismatch], [9]),
      new DiagnosticTestArgs('<<<LABEL\n\ta\n\t\tLABEL;', 'should not partially match indent of end label (tabs)', [ErrorCode.ERR_HeredocIndentMismatch], [9]),
      new DiagnosticTestArgs('<<<LABEL\n \ta\n \tLABEL;', 'should not contain spaces and tabs', [ErrorCode.ERR_HeredocIndentHasSpacesAndTabs], [13]),

      // @todo Recovery tests.
      new DiagnosticTestArgs('<<<LABEL\n  {$a $b}\n  LABEL;', 'missing close brace (in malformed interpolation)', [ErrorCode.ERR_CloseBraceExpected], [14]),

      new DiagnosticTestArgs('<<<LABEL\n  $a\n  LABEL "";', 'should use template span of flexible heredoc', [ErrorCode.ERR_SemicolonExpected], [21]),
    ];
    Test.assertDiagnostics(diagnosticTests, PhpVersion.PHP7_3);
  });

});
