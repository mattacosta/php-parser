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

import {
  DiagnosticTestArgs,
  ParserTestArgs,
  Test
} from '../Test';

import {
  ElementAccessSyntaxNode,
  ExpressionStatementSyntaxNode,
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
import { TokenKind } from '../../../src/language/TokenKind';

function assertStringTemplate(statements: ISyntaxNode[]): ISyntaxNode[] {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let shellCommand = <StringTemplateSyntaxNode>exprNode.expression;
  assert.equal(shellCommand instanceof StringTemplateSyntaxNode, true, 'StringTemplateSyntaxNode');
  let contents = shellCommand.template ? shellCommand.template.childNodes() : [];
  return contents;
}

describe('PhpParser', function() {

  describe('string-template', function() {
    let syntaxTests = [
      // Variable.
      new ParserTestArgs('"$a";', 'should parse a template', (statements) => {
        let contents = assertStringTemplate(statements);
        assert.equal(contents[0] instanceof LocalVariableSyntaxNode, true);
      }),
      new ParserTestArgs('"$a->b";', 'should parse a template using member access', (statements) => {
        let contents = assertStringTemplate(statements);
        assert.equal(contents[0] instanceof NamedMemberAccessSyntaxNode, true);
      }),
      new ParserTestArgs('"$a->class";', 'should parse a template using member access with keyword (class)', (statements) => {
        let contents = assertStringTemplate(statements);
        assert.equal(contents[0] instanceof NamedMemberAccessSyntaxNode, true);
      }),
      new ParserTestArgs('"{$a}";', 'should parse a template using variable expression', (statements) => {
        let contents = assertStringTemplate(statements);
        let strExpr = <StringExpressionSyntaxNode>contents[0];
        assert.equal(strExpr instanceof StringExpressionSyntaxNode, true);
        assert.equal(strExpr.expression instanceof LocalVariableSyntaxNode, true);
      }),

      // Element access.
      new ParserTestArgs('"$a[0]";', 'should parse a template using element access with numeric offset', (statements, text) => {
        let contents = assertStringTemplate(statements);
        let elementAccess = <StringElementAccessSyntaxNode>contents[0];
        assert.equal(elementAccess instanceof StringElementAccessSyntaxNode, true, 'StringElementAccessSyntaxNode');
        Test.assertSyntaxToken(elementAccess.variable, text, TokenKind.Variable, '$a');
        assert.strictEqual(elementAccess.minus, null);
        Test.assertSyntaxToken(elementAccess.index, text, TokenKind.StringNumber, '0');
      }),
      new ParserTestArgs('"$a[-1]";', 'should parse a template using element access with numeric offset (negative)', (statements, text) => {
        let contents = assertStringTemplate(statements);
        let elementAccess = <StringElementAccessSyntaxNode>contents[0];
        assert.equal(elementAccess instanceof StringElementAccessSyntaxNode, true, 'StringElementAccessSyntaxNode');
        Test.assertSyntaxToken(elementAccess.variable, text, TokenKind.Variable, '$a');
        Test.assertSyntaxToken(elementAccess.minus, text, TokenKind.Minus, '-');
        Test.assertSyntaxToken(elementAccess.index, text, TokenKind.StringNumber, '1');
      }),
      new ParserTestArgs('"$a[B]";', 'should parse a template using element access with named offset', (statements, text) => {
        let contents = assertStringTemplate(statements);
        let elementAccess = <StringElementAccessSyntaxNode>contents[0];
        assert.equal(elementAccess instanceof StringElementAccessSyntaxNode, true, 'StringElementAccessSyntaxNode');
        Test.assertSyntaxToken(elementAccess.variable, text, TokenKind.Variable, '$a');
        assert.strictEqual(elementAccess.minus, null);
        Test.assertSyntaxToken(elementAccess.index, text, TokenKind.Identifier, 'B');
      }),
      new ParserTestArgs('"$a[$b]";', 'should parse a template using element access with variable offset', (statements, text) => {
        let contents = assertStringTemplate(statements);
        let elementAccess = <StringElementAccessSyntaxNode>contents[0];
        assert.equal(elementAccess instanceof StringElementAccessSyntaxNode, true, 'StringElementAccessSyntaxNode');
        Test.assertSyntaxToken(elementAccess.variable, text, TokenKind.Variable, '$a');
        assert.strictEqual(elementAccess.minus, null);
        Test.assertSyntaxToken(elementAccess.index, text, TokenKind.Variable, '$b');
      }),

      // Indirect variable.
      new ParserTestArgs('"${a}";', 'should parse a template using indirect variable name', (statements) => {
        let contents = assertStringTemplate(statements);
        let variable = <IndirectStringVariableSyntaxNode>contents[0];
        assert.equal(variable instanceof IndirectStringVariableSyntaxNode, true);
        assert.equal(variable.expression instanceof StringVariableSyntaxNode, true);
      }),
      new ParserTestArgs('"${a[0]}";', 'should parse a template using element access of indirect variable name', (statements) => {
        let contents = assertStringTemplate(statements);
        let variable = <IndirectStringVariableSyntaxNode>contents[0];
        assert.equal(variable instanceof IndirectStringVariableSyntaxNode, true);
        let elementAccess = <ElementAccessSyntaxNode>variable.expression;
        assert.equal(elementAccess instanceof ElementAccessSyntaxNode, true);
        assert.equal(elementAccess.dereferencable instanceof StringVariableSyntaxNode, true);
        assert.equal(elementAccess.index instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('"${$a}";', 'should parse a template using indirect variable name with expression', (statements) => {
        let contents = assertStringTemplate(statements);
        let variable = <IndirectStringVariableSyntaxNode>contents[0];
        assert.equal(variable instanceof IndirectStringVariableSyntaxNode, true);
        assert.equal(variable.expression instanceof LocalVariableSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    // @todo Add diagnostic tests.
  });

  describe('shell-command', function() {
    let syntaxTests = [
      new ParserTestArgs('`a`;', 'should parse a shell command expression', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let shellCommand = <ShellCommandTemplateSyntaxNode>exprNode.expression;
        assert.equal(shellCommand instanceof ShellCommandTemplateSyntaxNode, true);
        let contents = shellCommand.template ? shellCommand.template.childNodes() : [];
        assert.equal(contents[0] instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('``;', 'should parse a shell command expression (empty)', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let shellCommand = <ShellCommandTemplateSyntaxNode>exprNode.expression;
        assert.equal(shellCommand instanceof ShellCommandTemplateSyntaxNode, true);
        assert.strictEqual(shellCommand.template, null);
      }),
      new ParserTestArgs('`$a`;', 'should parse a shell command expression with interpolation', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let shellCommand = <ShellCommandTemplateSyntaxNode>exprNode.expression;
        assert.equal(shellCommand instanceof ShellCommandTemplateSyntaxNode, true);
        let contents = shellCommand.template ? shellCommand.template.childNodes() : [];
        assert.equal(contents[0] instanceof LocalVariableSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('`', 'missing back quote', [ErrorCode.ERR_UnterminatedString], [0]),
      new DiagnosticTestArgs('`$a', 'missing back quote (after interpolation)', [ErrorCode.ERR_UnterminatedString], [0]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('heredoc', function() {
    let syntaxTests = [
      new ParserTestArgs('<<<LABEL\na\nLABEL;\n', 'should parse a heredoc string', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let heredoc = <HeredocTemplateSyntaxNode>exprNode.expression;
        assert.equal(heredoc instanceof HeredocTemplateSyntaxNode, true);
        let contents = heredoc.template ? heredoc.template.childNodes() : [];
        assert.equal(contents[0] instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('<<<LABEL\nLABEL;\n', 'should parse a heredoc string (empty)', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let heredoc = <HeredocTemplateSyntaxNode>exprNode.expression;
        assert.equal(heredoc instanceof HeredocTemplateSyntaxNode, true);
        assert.strictEqual(heredoc.template, null);
      }),
      new ParserTestArgs('<<<LABEL\n$a\nLABEL;\n', 'should parse a heredoc string with interpolation', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let heredoc = <HeredocTemplateSyntaxNode>exprNode.expression;
        assert.equal(heredoc instanceof HeredocTemplateSyntaxNode, true);
        let contents = heredoc.template ? heredoc.template.childNodes() : [];
        assert.equal(contents[0] instanceof LocalVariableSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('<<<LABEL\n', 'missing end label', [ErrorCode.ERR_UnterminatedString], [0]),
      new DiagnosticTestArgs('<<<LABEL\n$a', 'missing end label (after interpolation)', [ErrorCode.ERR_UnterminatedString], [0]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('nowdoc', function() {
    let syntaxTests = [
      new ParserTestArgs('<<<\'LABEL\'\na\nLABEL;\n', 'should parse a nowdoc string', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let heredoc = <HeredocTemplateSyntaxNode>exprNode.expression;
        assert.equal(heredoc instanceof HeredocTemplateSyntaxNode, true);
        let contents = heredoc.template ? heredoc.template.childNodes() : [];
        assert.equal(contents[0] instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('<<<\'LABEL\'\nLABEL;\n', 'should parse a nowdoc string (empty)', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let heredoc = <HeredocTemplateSyntaxNode>exprNode.expression;
        assert.equal(heredoc instanceof HeredocTemplateSyntaxNode, true);
        assert.strictEqual(heredoc.template, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);
  });

});
