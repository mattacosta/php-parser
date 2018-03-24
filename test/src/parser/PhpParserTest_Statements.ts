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
  ConstantDeclarationSyntaxNode,
  ConstantElementSyntaxNode,
  DeclareSyntaxNode,
  DeclareBlockSyntaxNode,
  EchoSyntaxNode,
  ExpressionStatementSyntaxNode,
  FullyQualifiedNameSyntaxNode,
  GlobalSyntaxNode,
  LabelSyntaxNode,
  LiteralSyntaxNode,
  LocalVariableSyntaxNode,
  NamespaceDeclarationSyntaxNode,
  NamespaceGroupDeclarationSyntaxNode,
  PartiallyQualifiedNameSyntaxNode,
  RelativeNameSyntaxNode,
  StatementBlockSyntaxNode,
  StaticSyntaxNode,
  StaticElementSyntaxNode,
  TryCatchSyntaxNode,
  TryFinallySyntaxNode,
  TrySyntaxNode,
  UnsetSyntaxNode,
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { SyntaxList } from '../../../src/language/syntax/SyntaxList';
import { TokenKind } from '../../../src/language/TokenKind';

describe('PhpParser', function() {

  describe('compound-statement', function() {
    let syntaxTests = [
      new ParserTestArgs('{}', 'should parse a compound statement', (statements) => {
        let statementBlock = <StatementBlockSyntaxNode>statements[0];
        assert.equal(statementBlock instanceof StatementBlockSyntaxNode, true, 'StatementBlockSyntaxNode');
        assert.strictEqual(statementBlock.statements, null);
      }),
      new ParserTestArgs('{;}', 'should parse a compound statement with child statement', (statements) => {
        let statementBlock = <StatementBlockSyntaxNode>statements[0];
        assert.equal(statementBlock instanceof StatementBlockSyntaxNode, true, 'StatementBlockSyntaxNode');
        let children = statementBlock.childNodes();
        assert.equal(children.length, 1);
        assert.equal(children[0] instanceof ExpressionStatementSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('{', 'missing close brace', [ErrorCode.ERR_CloseBraceExpected], [1]),
      // @todo This should be a recovery test.
      new DiagnosticTestArgs('}', 'missing open brace', [ErrorCode.ERR_UnexpectedToken], [0]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('named-label-statement', function() {
    let syntaxTests = [
      new ParserTestArgs('label:', 'should parse a label statement', (statements, text) => {
        let labelNode = <LabelSyntaxNode>statements[0];
        assert.equal(labelNode instanceof LabelSyntaxNode, true, 'LabelSyntaxNode');
        Test.assertSyntaxToken(labelNode.label, text, TokenKind.Identifier, 'label');
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    // There are no diagnostics because an identifier without a colon is a constant.
  });

  describe('expression-statement', function() {
    let syntaxTests = [
      new ParserTestArgs('1;', 'should parse an expression statement', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        assert.equal(exprNode.expression instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs(';', 'should parse an expression statement with no expression', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        assert.strictEqual(exprNode.expression, null);
      }),
      new ParserTestArgs('?>', 'should parse an expression statement with no expression (close tag)', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        assert.strictEqual(exprNode.expression, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('1', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [1]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('try-statement', function() {
    // NOTE: Only catch and finally clauses need to be tested since they
    // implicitly test the actual try statement.

    let syntaxTests = [
      // Catch clause.
      new ParserTestArgs('try {} catch (A $e) {}', 'should parse a catch clause', (statements, text) => {
        let tryNode = <TrySyntaxNode>statements[0];
        assert.equal(tryNode instanceof TrySyntaxNode, true, 'TrySyntaxNode');
        let catchClauses = tryNode.catchClauses ? tryNode.catchClauses.childNodes() : [];
        assert.equal(catchClauses.length, 1);

        let catchNode = <TryCatchSyntaxNode>catchClauses[0];
        assert.equal(catchNode instanceof TryCatchSyntaxNode, true);
        let names = catchNode.typeNames ? catchNode.typeNames.childNodes() : [];
        assert.equal(names.length, 1);
        assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        Test.assertSyntaxToken(catchNode.variable, text, TokenKind.Variable, '$e');

        assert.strictEqual(tryNode.finallyClause, null);
      }),
      new ParserTestArgs('try {} catch (\\A $e) {}', 'should parse a catch clause with fully qualified name', (statements, text) => {
        let tryNode = <TrySyntaxNode>statements[0];
        assert.equal(tryNode instanceof TrySyntaxNode, true, 'TrySyntaxNode');
        let catchClauses = tryNode.catchClauses ? tryNode.catchClauses.childNodes() : [];
        assert.equal(catchClauses.length, 1);

        let catchNode = <TryCatchSyntaxNode>catchClauses[0];
        assert.equal(catchNode instanceof TryCatchSyntaxNode, true);
        let names = catchNode.typeNames ? catchNode.typeNames.childNodes() : [];
        assert.equal(names.length, 1);
        assert.equal(names[0] instanceof FullyQualifiedNameSyntaxNode, true);
        Test.assertSyntaxToken(catchNode.variable, text, TokenKind.Variable, '$e');

        assert.strictEqual(tryNode.finallyClause, null);
      }),
      new ParserTestArgs('try {} catch (namespace\\A $e) {}', 'should parse a catch clause with relative name', (statements, text) => {
        let tryNode = <TrySyntaxNode>statements[0];
        assert.equal(tryNode instanceof TrySyntaxNode, true, 'TrySyntaxNode');
        let catchClauses = tryNode.catchClauses ? tryNode.catchClauses.childNodes() : [];
        assert.equal(catchClauses.length, 1);

        let catchNode = <TryCatchSyntaxNode>catchClauses[0];
        assert.equal(catchNode instanceof TryCatchSyntaxNode, true);
        let names = catchNode.typeNames ? catchNode.typeNames.childNodes() : [];
        assert.equal(names.length, 1);
        assert.equal(names[0] instanceof RelativeNameSyntaxNode, true);
        Test.assertSyntaxToken(catchNode.variable, text, TokenKind.Variable, '$e');

        assert.strictEqual(tryNode.finallyClause, null);
      }),
      new ParserTestArgs('try {} catch (A | B $e) {}', 'should parse a catch clause with type union', (statements, text) => {
        let tryNode = <TrySyntaxNode>statements[0];
        assert.equal(tryNode instanceof TrySyntaxNode, true, 'TrySyntaxNode');
        let catchClauses = tryNode.catchClauses ? tryNode.catchClauses.childNodes() : [];
        assert.equal(catchClauses.length, 1);

        let catchNode = <TryCatchSyntaxNode>catchClauses[0];
        assert.equal(catchNode instanceof TryCatchSyntaxNode, true);
        let names = catchNode.typeNames ? catchNode.typeNames.allChildren() : [];
        assert.equal(names.length, 3);
        assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        Test.assertSyntaxToken(<any>names[1], text, TokenKind.VerticalBar, '|');
        assert.equal(names[2] instanceof PartiallyQualifiedNameSyntaxNode, true);
        Test.assertSyntaxToken(catchNode.variable, text, TokenKind.Variable, '$e');

        assert.strictEqual(tryNode.finallyClause, null);
      }),
    //new ParserTestArgs('try {} catch (A | \\B\\C $e) {}', ''),
    //new ParserTestArgs('try {} catch (A | namespace\\B $e) {}', ''),
      new ParserTestArgs('try {} catch (A $e) {} catch (B $e) {}', 'should parse multiple catch clauses', (statements, text) => {
        let tryNode = <TrySyntaxNode>statements[0];
        assert.equal(tryNode instanceof TrySyntaxNode, true, 'TrySyntaxNode');
        let catchClauses = tryNode.catchClauses ? tryNode.catchClauses.childNodes() : [];
        assert.equal(catchClauses.length, 2);

        let firstCatchNode = <TryCatchSyntaxNode>catchClauses[0];
        assert.equal(firstCatchNode instanceof TryCatchSyntaxNode, true);
        let names = firstCatchNode.typeNames ? firstCatchNode.typeNames.childNodes() : [];
        assert.equal(names.length, 1);
        assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);

        let secondCatchNode = <TryCatchSyntaxNode>catchClauses[1];
        assert.equal(secondCatchNode instanceof TryCatchSyntaxNode, true);
        names = secondCatchNode.typeNames ? secondCatchNode.typeNames.childNodes() : [];
        assert.equal(names.length, 1);
        assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        Test.assertSyntaxToken(secondCatchNode.variable, text, TokenKind.Variable, '$e');

        assert.strictEqual(tryNode.finallyClause, null);
      }),
      // Finally clause.
      new ParserTestArgs('try {} finally {}', 'should parse a finally clause', (statements, text) => {
        let tryNode = <TrySyntaxNode>statements[0];
        assert.equal(tryNode instanceof TrySyntaxNode, true, 'TrySyntaxNode');
        assert.strictEqual(tryNode.catchClauses, null);
        assert.equal(tryNode.finallyClause instanceof TryFinallySyntaxNode, true);
      }),
      new ParserTestArgs('try {} catch (A $e) {} finally {}', 'should parse a finally clause after a catch clause', (statements, text) => {
        let tryNode = <TrySyntaxNode>statements[0];
        assert.equal(tryNode instanceof TrySyntaxNode, true, 'TrySyntaxNode');
        let catchClauses = tryNode.catchClauses ? tryNode.catchClauses.childNodes() : [];
        assert.equal(catchClauses.length, 1);

        let catchNode = <TryCatchSyntaxNode>catchClauses[0];
        assert.equal(catchNode instanceof TryCatchSyntaxNode, true);
        let names = catchNode.typeNames ? catchNode.typeNames.childNodes() : [];
        assert.equal(names.length, 1);
        assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        Test.assertSyntaxToken(catchNode.variable, text, TokenKind.Variable, '$e');

        assert.equal(tryNode.finallyClause instanceof TryFinallySyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('try', 'missing open brace', [ErrorCode.ERR_OpenBraceExpected], [3]),
      new DiagnosticTestArgs('try {', 'missing close brace', [ErrorCode.ERR_CloseBraceExpected], [5]),
      new DiagnosticTestArgs('try {}', 'missing catch or finally', [ErrorCode.ERR_CatchOrFinallyExpected], [6]),
      new DiagnosticTestArgs('try {} catch', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [12]),
      new DiagnosticTestArgs('try {} catch (', 'missing identifier', [ErrorCode.ERR_TypeExpected], [14]),
      new DiagnosticTestArgs('try {} catch (A', 'missing vertical bar or variable', [ErrorCode.ERR_TryUnionOrVariableExpected], [15]),
      new DiagnosticTestArgs('try {} catch (A $e', 'missing close paren', [ErrorCode.ERR_CloseParenExpected], [18]),
      new DiagnosticTestArgs('try {} catch (A $e)', 'missing open brace (catch clause)', [ErrorCode.ERR_OpenBraceExpected], [19]),
      new DiagnosticTestArgs('try {} catch (A $e) {', 'missing close brace (catch clause)', [ErrorCode.ERR_CloseBraceExpected], [21]),
      new DiagnosticTestArgs('try {} catch (A |', 'missing identifier after vertical bar', [ErrorCode.ERR_TypeExpected], [17]),
      new DiagnosticTestArgs('try {} finally', 'missing open brace (finally clause)', [ErrorCode.ERR_OpenBraceExpected], [14]),
      new DiagnosticTestArgs('try {} finally {', 'missing close brace (finally clause)', [ErrorCode.ERR_CloseBraceExpected], [16]),

      new DiagnosticTestArgs('try {} catch (A B $e) {}', 'should expect vertical bar between catch types', [ErrorCode.ERR_Syntax], [15]),
      new DiagnosticTestArgs('try {} finally {} finally', 'should not parse multiple finally clauses', [ErrorCode.ERR_UnexpectedToken], [18]),
      new DiagnosticTestArgs('try {} finally {} catch', 'should not parse a catch clause after a finally clause', [ErrorCode.ERR_UnexpectedToken], [18]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('declare-statement', function() {
    let syntaxTests = [
      new ParserTestArgs('declare(a=1);', 'should parse a declare statement', (statements) => {
        let declareNode = <DeclareSyntaxNode>statements[0];
        assert.equal(declareNode instanceof DeclareSyntaxNode, true, 'DeclareSyntaxNode');
        let directives = declareNode.directives;
        assert.equal(declareNode.directives instanceof SyntaxList, true);
        let constants = directives ? directives.childNodes() : [];
        assert.equal(constants.length, 1);
        assert.equal(constants[0] instanceof ConstantElementSyntaxNode, true);
        assert.equal(declareNode.statement instanceof ExpressionStatementSyntaxNode, true);
      }),
      new ParserTestArgs('declare(a=1, b=2);', 'should parse a declare statement with multiple directives', (statements) => {
        let declareNode = <DeclareSyntaxNode>statements[0];
        assert.equal(declareNode instanceof DeclareSyntaxNode, true, 'DeclareSyntaxNode');
        let directives = declareNode.directives;
        assert.equal(declareNode.directives instanceof SyntaxList, true);
        let constants = directives ? directives.childNodes() : [];
        assert.equal(constants.length, 2);
        assert.equal(constants[0] instanceof ConstantElementSyntaxNode, true);
        assert.equal(constants[1] instanceof ConstantElementSyntaxNode, true);
        assert.equal(declareNode.statement instanceof ExpressionStatementSyntaxNode, true);
      }),
      new ParserTestArgs('declare(a=1): enddeclare;', 'should parse a declare statement (alternate syntax)', (statements) => {
        let declareNode = <DeclareBlockSyntaxNode>statements[0];
        assert.equal(declareNode instanceof DeclareBlockSyntaxNode, true, 'DeclareBlockSyntaxNode');
        let directives = declareNode.directives;
        assert.equal(declareNode.directives instanceof SyntaxList, true);
        let constants = directives ? directives.childNodes() : [];
        assert.equal(constants.length, 1);
        assert.equal(constants[0] instanceof ConstantElementSyntaxNode, true);
        assert.strictEqual(declareNode.statements, null);
      }),
      new ParserTestArgs('declare(a=1): 1; 2; enddeclare;', 'should parse a declare statement with child statements (alternate syntax)', (statements) => {
        let declareNode = <DeclareBlockSyntaxNode>statements[0];
        assert.equal(declareNode instanceof DeclareBlockSyntaxNode, true, 'DeclareBlockSyntaxNode');
        let directives = declareNode.directives;
        assert.equal(declareNode.directives instanceof SyntaxList, true);
        let constants = directives ? directives.childNodes() : [];
        assert.equal(constants.length, 1);
        assert.equal(constants[0] instanceof ConstantElementSyntaxNode, true);
        assert.notStrictEqual(declareNode.statements, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    // NOTE: See `const-declaration` for assignment tests.
    let diagnosticTests = [
      new DiagnosticTestArgs('declare', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [7]),
      new DiagnosticTestArgs('declare(', 'missing constant declaration', [ErrorCode.ERR_IdentifierExpected], [8]),
      new DiagnosticTestArgs('declare(a=1', 'missing comma or close paren', [ErrorCode.ERR_CommaOrCloseParenExpected], [11]),
      new DiagnosticTestArgs('declare(a=1)', 'missing statement or colon', [ErrorCode.ERR_StatementOrColonExpected], [12]),
      new DiagnosticTestArgs('declare(a=1):', 'missing enddeclare', [ErrorCode.ERR_Syntax], [13]),
      new DiagnosticTestArgs('declare(a=1): enddeclare', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [24]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('echo-statement', function() {
    let syntaxTests = [
      new ParserTestArgs('echo 1;', 'should parse an echo statement', (statements) => {
        let echoNode = <EchoSyntaxNode>statements[0];
        assert.equal(echoNode instanceof EchoSyntaxNode, true, 'EchoSyntaxNode');
        let expressions = echoNode.expressionList.childNodes();
        assert.equal(expressions.length, 1);
        assert.equal(expressions[0] instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('echo 1, $a;', 'should parse an echo statement with multiple expressions', (statements) => {
        let echoNode = <EchoSyntaxNode>statements[0];
        assert.equal(echoNode instanceof EchoSyntaxNode, true, 'EchoSyntaxNode');
        let expressions = echoNode.expressionList.childNodes();
        assert.equal(expressions.length, 2);
        assert.equal(expressions[0] instanceof LiteralSyntaxNode, true);
        assert.equal(expressions[1] instanceof LocalVariableSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('echo', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [4]),
      new DiagnosticTestArgs('echo $a', 'missing comma or semicolon', [ErrorCode.ERR_CommaOrSemicolonExpected], [7]),
      new DiagnosticTestArgs('echo $a,', 'missing expression after comma', [ErrorCode.ERR_ExpressionExpectedEOF], [8]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('unset-statement', function() {
    let syntaxTests = [
      new ParserTestArgs('unset($a);', 'should parse an unset statement', (statements, text) => {
        let unsetNode = <UnsetSyntaxNode>statements[0];
        assert.equal(unsetNode instanceof UnsetSyntaxNode, true, 'UnsetSyntaxNode');
        let variables = unsetNode.expressionList.childNodes();
        assert.equal(variables.length, 1);
        let variable = <LocalVariableSyntaxNode>variables[0];
        assert.equal(variable instanceof LocalVariableSyntaxNode, true);
        Test.assertSyntaxToken(variable.variable, text, TokenKind.Variable, '$a');
      }),
      new ParserTestArgs('unset($a, $b);', 'should parse an unset statement with multiple variables', (statements, text) => {
        let unsetNode = <UnsetSyntaxNode>statements[0];
        assert.equal(unsetNode instanceof UnsetSyntaxNode, true, 'UnsetSyntaxNode');
        let variables = unsetNode.expressionList.childNodes();
        assert.equal(variables.length, 2);
        let firstVariable = <LocalVariableSyntaxNode>variables[0];
        assert.equal(firstVariable instanceof LocalVariableSyntaxNode, true);
        Test.assertSyntaxToken(firstVariable.variable, text, TokenKind.Variable, '$a');
        let secondVariable = <LocalVariableSyntaxNode>variables[0];
        assert.equal(secondVariable instanceof LocalVariableSyntaxNode, true);
        Test.assertSyntaxToken(secondVariable.variable, text, TokenKind.Variable, '$a');
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('unset', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [5]),
      new DiagnosticTestArgs('unset(', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [6]),
      new DiagnosticTestArgs('unset($a', 'missing comma or close paren', [ErrorCode.ERR_CommaOrCloseParenExpected], [8]),
      new DiagnosticTestArgs('unset($a,', 'missing expression after comma', [ErrorCode.ERR_ExpressionExpectedEOF], [9]),
      new DiagnosticTestArgs('unset(1);', 'should expect an explicit expression', [ErrorCode.ERR_ExpressionNotAddressable], [6]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('const-declaration', function() {
    let syntaxTests = [
      new ParserTestArgs('const A=1;', 'should parse a constant declaration', (statements, text) => {
        let constDecl = <ConstantDeclarationSyntaxNode>statements[0];
        assert.equal(constDecl instanceof ConstantDeclarationSyntaxNode, true, 'ConstantDeclarationSyntaxNode');
        let elements = constDecl.elements ? constDecl.elements.childNodes() : [];
        assert.equal(elements.length, 1);
        let constNode = <ConstantElementSyntaxNode>elements[0];
        assert.equal(constNode instanceof ConstantElementSyntaxNode, true);
        Test.assertSyntaxToken(constNode.identifier, text, TokenKind.Identifier, 'A');
        assert.equal(constNode.expression instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('const A=1, B=2;', 'should parse multiple constant declarations', (statements, text) => {
        let constDecl = <ConstantDeclarationSyntaxNode>statements[0];
        assert.equal(constDecl instanceof ConstantDeclarationSyntaxNode, true, 'ConstantDeclarationSyntaxNode');
        let elements = constDecl.elements ? constDecl.elements.childNodes() : [];
        assert.equal(elements.length, 2);
        let firstConst = <ConstantElementSyntaxNode>elements[0];
        assert.equal(firstConst instanceof ConstantElementSyntaxNode, true);
        Test.assertSyntaxToken(firstConst.identifier, text, TokenKind.Identifier, 'A');
        assert.equal(firstConst.expression instanceof LiteralSyntaxNode, true);
        let secondConst = <ConstantElementSyntaxNode>elements[1];
        assert.equal(secondConst instanceof ConstantElementSyntaxNode, true);
        Test.assertSyntaxToken(secondConst.identifier, text, TokenKind.Identifier, 'B');
        assert.equal(secondConst.expression instanceof LiteralSyntaxNode, true);
      })
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('const', 'missing identifier', [ErrorCode.ERR_IdentifierExpected], [5]),
      new DiagnosticTestArgs('const A', 'missing assignment', [ErrorCode.ERR_Syntax], [7]),
      new DiagnosticTestArgs('const A=', 'missing expression (EOF)', [ErrorCode.ERR_ExpressionExpectedEOF], [8]),
      new DiagnosticTestArgs('const A=;', 'missing expression', [ErrorCode.ERR_ExpressionExpected], [8]),
      new DiagnosticTestArgs('const A=1', 'missing comma or semicolon', [ErrorCode.ERR_CommaOrSemicolonExpected], [9]),
      new DiagnosticTestArgs('const A=1,', 'missing identifier after comma', [ErrorCode.ERR_IdentifierExpected], [10]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  // function-definition (see PhpParserTest_FunctionDeclaration.ts)

  // class-declaration (see PhpParserTest_ClassDeclaration.ts)

  // interface-declaration (see PhpParserTest_InterfaceDeclaration.ts)

  // trait-declaration (see PhpParserTest_TraitDeclaration.ts)

  // Officially this is `namespace-definition`.
  describe('namespace-declaration', function() {
    let syntaxTests = [
      new ParserTestArgs('namespace A;', 'should parse a namespace declaration', (statements) => {
        let decl = <NamespaceDeclarationSyntaxNode>statements[0];
        assert.equal(decl instanceof NamespaceDeclarationSyntaxNode, true, 'NamespaceDeclarationSyntaxNode');
        assert.equal(decl.name instanceof PartiallyQualifiedNameSyntaxNode, true);
      }),
      new ParserTestArgs('namespace A\\B;', 'should parse a namespace declaration with multiple names', (statements) => {
        let decl = <NamespaceDeclarationSyntaxNode>statements[0];
        assert.equal(decl instanceof NamespaceDeclarationSyntaxNode, true, 'NamespaceDeclarationSyntaxNode');
        assert.equal(decl.name instanceof PartiallyQualifiedNameSyntaxNode, true);
      }),
      new ParserTestArgs('namespace A {}', 'should parse a namespace group declaration', (statements) => {
        let decl = <NamespaceGroupDeclarationSyntaxNode>statements[0];
        assert.equal(decl instanceof NamespaceGroupDeclarationSyntaxNode, true, 'NamespaceGroupDeclarationSyntaxNode');
        assert.equal(decl.name instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(decl.statements, null);
      }),
      new ParserTestArgs('namespace A\\B {}', 'should parse a namespace group declaration with multiple names', (statements) => {
        let decl = <NamespaceGroupDeclarationSyntaxNode>statements[0];
        assert.equal(decl instanceof NamespaceGroupDeclarationSyntaxNode, true, 'NamespaceGroupDeclarationSyntaxNode');
        assert.equal(decl.name instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(decl.statements, null);
      }),
      new ParserTestArgs('namespace A { ; }', 'should parse a namespace group declaration with child statement', (statements) => {
        let decl = <NamespaceGroupDeclarationSyntaxNode>statements[0];
        assert.equal(decl instanceof NamespaceGroupDeclarationSyntaxNode, true, 'NamespaceGroupDeclarationSyntaxNode');
        assert.equal(decl.name instanceof PartiallyQualifiedNameSyntaxNode, true);
        let children = decl.statements ? decl.statements.childNodes() : [];
        assert.equal(children.length, 1);
        assert.equal(children[0] instanceof ExpressionStatementSyntaxNode, true);
      }),
      new ParserTestArgs('namespace {}', 'should parse a global namespace declaration', (statements) => {
        let decl = <NamespaceGroupDeclarationSyntaxNode>statements[0];
        assert.equal(decl instanceof NamespaceGroupDeclarationSyntaxNode, true, 'NamespaceGroupDeclarationSyntaxNode');
        assert.strictEqual(decl.name, null);
      }),
      new ParserTestArgs('namespace { ; }', 'should parse a global namespace declaration with child statement', (statements) => {
        let decl = <NamespaceGroupDeclarationSyntaxNode>statements[0];
        assert.equal(decl instanceof NamespaceGroupDeclarationSyntaxNode, true, 'NamespaceGroupDeclarationSyntaxNode');
        assert.strictEqual(decl.name, null);
        let children = decl.statements ? decl.statements.childNodes() : [];
        assert.equal(children.length, 1);
        assert.equal(children[0] instanceof ExpressionStatementSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('namespace', 'missing name', [ErrorCode.ERR_IncompleteNamespace], [9]),
      new DiagnosticTestArgs('namespace A', 'missing semicolon or open brace', [ErrorCode.ERR_OpenBraceOrSemicolonExpected], [11]),
      new DiagnosticTestArgs('namespace A {', 'missing close brace', [ErrorCode.ERR_CloseBraceExpected], [13]),
      new DiagnosticTestArgs('namespace A { namespace B; }', 'should not parse a nested namespace', [ErrorCode.ERR_NamespaceIsNested], [14]),
      new DiagnosticTestArgs('namespace A { namespace B {} }', 'should not parse a nested namespace group', [ErrorCode.ERR_NamespaceIsNested], [14]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  // use-declaration (see PhpParserTest_UseDeclaration.ts)

  describe('global-declaration', function() {
    let syntaxTests = [
      new ParserTestArgs('global $a;', 'should parse a global declaration', (statements) => {
        let globalDecl = <GlobalSyntaxNode>statements[0];
        assert.equal(globalDecl instanceof GlobalSyntaxNode, true, 'GlobalSyntaxNode');
        let variables = globalDecl.variables ? globalDecl.variables.childNodes() : [];
        assert.equal(variables.length, 1);
        assert.equal(variables[0] instanceof LocalVariableSyntaxNode, true);
      }),
      new ParserTestArgs('global $a, $b;', 'should parse multiple global declarations', (statements) => {
        let globalDecl = <GlobalSyntaxNode>statements[0];
        assert.equal(globalDecl instanceof GlobalSyntaxNode, true, 'GlobalSyntaxNode');
        let variables = globalDecl.variables ? globalDecl.variables.childNodes() : [];
        assert.equal(variables.length, 2);
        assert.equal(variables[0] instanceof LocalVariableSyntaxNode, true);
        assert.equal(variables[1] instanceof LocalVariableSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    // @todo `global $a $b;` or `global $a $b = 1;`

    let diagnosticTests = [
      new DiagnosticTestArgs('global', 'missing variable', [ErrorCode.ERR_VariableExpected], [6]),
      new DiagnosticTestArgs('global $a', 'missing comma or semicolon', [ErrorCode.ERR_CommaOrSemicolonExpected], [9]),
      new DiagnosticTestArgs('global $a,', 'missing variable in list', [ErrorCode.ERR_VariableExpected], [10]),
      // Unlike a static declaration, this expects a `simple-variable`.
      new DiagnosticTestArgs('global $', 'partial variable name', [ErrorCode.ERR_IncompleteVariable], [7]),
      new DiagnosticTestArgs('global $a=1;', 'should not parse a global declaration with initializer', [ErrorCode.ERR_CommaOrSemicolonExpected], [9]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('static-declaration', function() {
    let syntaxTests = [
      new ParserTestArgs('static $a;', 'should parse a static declaration', (statements, text) => {
        let staticDecl = <StaticSyntaxNode>statements[0];
        assert.equal(staticDecl instanceof StaticSyntaxNode, true, 'StaticSyntaxNode');
        let variables = staticDecl.variables ? staticDecl.variables.childNodes() : [];
        assert.equal(variables.length, 1);
        let staticVariable = <StaticElementSyntaxNode>variables[0];
        assert.equal(staticVariable instanceof StaticElementSyntaxNode, true);
        Test.assertSyntaxToken(staticVariable.variable, text, TokenKind.Variable, '$a');
        assert.strictEqual(staticVariable.expression, null);
      }),
      new ParserTestArgs('static $a=1;', 'should parse a static declaration with initializer', (statements, text) => {
        let staticDecl = <StaticSyntaxNode>statements[0];
        assert.equal(staticDecl instanceof StaticSyntaxNode, true, 'StaticSyntaxNode');
        let variables = staticDecl.variables ? staticDecl.variables.childNodes() : [];
        assert.equal(variables.length, 1);
        let staticVariable = <StaticElementSyntaxNode>variables[0];
        assert.equal(staticVariable instanceof StaticElementSyntaxNode, true);
        Test.assertSyntaxToken(staticVariable.variable, text, TokenKind.Variable, '$a');
        assert.equal(staticVariable.expression instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('static $a, $b;', 'should parse multiple static declarations', (statements, text) => {
        let staticDecl = <StaticSyntaxNode>statements[0];
        assert.equal(staticDecl instanceof StaticSyntaxNode, true, 'StaticSyntaxNode');
        let variables = staticDecl.variables ? staticDecl.variables.childNodes() : [];
        assert.equal(variables.length, 2);
        let firstVariable = <StaticElementSyntaxNode>variables[0];
        assert.equal(firstVariable instanceof StaticElementSyntaxNode, true);
        Test.assertSyntaxToken(firstVariable.variable, text, TokenKind.Variable, '$a');
        assert.strictEqual(firstVariable.expression, null);
        let secondVariable = <StaticElementSyntaxNode>variables[1];
        assert.equal(secondVariable instanceof StaticElementSyntaxNode, true);
        Test.assertSyntaxToken(secondVariable.variable, text, TokenKind.Variable, '$b');
        assert.strictEqual(secondVariable.expression, null);
      }),
      new ParserTestArgs('static $a=1, $b;', 'should parse multiple static declarations (first with initializer)', (statements, text) => {
        let staticDecl = <StaticSyntaxNode>statements[0];
        assert.equal(staticDecl instanceof StaticSyntaxNode, true, 'StaticSyntaxNode');
        let variables = staticDecl.variables ? staticDecl.variables.childNodes() : [];
        assert.equal(variables.length, 2);
        let firstVariable = <StaticElementSyntaxNode>variables[0];
        assert.equal(firstVariable instanceof StaticElementSyntaxNode, true);
        Test.assertSyntaxToken(firstVariable.variable, text, TokenKind.Variable, '$a');
        assert.equal(firstVariable.expression instanceof LiteralSyntaxNode, true);
        let secondVariable = <StaticElementSyntaxNode>variables[1];
        assert.equal(secondVariable instanceof StaticElementSyntaxNode, true);
        Test.assertSyntaxToken(secondVariable.variable, text, TokenKind.Variable, '$b');
        assert.strictEqual(secondVariable.expression, null);
      }),
      new ParserTestArgs('static $a, $b=2;', 'should parse multiple static declarations (second with initializer)', (statements, text) => {
        let staticDecl = <StaticSyntaxNode>statements[0];
        assert.equal(staticDecl instanceof StaticSyntaxNode, true, 'StaticSyntaxNode');
        let variables = staticDecl.variables ? staticDecl.variables.childNodes() : [];
        assert.equal(variables.length, 2);
        let firstVariable = <StaticElementSyntaxNode>variables[0];
        assert.equal(firstVariable instanceof StaticElementSyntaxNode, true);
        Test.assertSyntaxToken(firstVariable.variable, text, TokenKind.Variable, '$a');
        assert.strictEqual(firstVariable.expression, null);
        let secondVariable = <StaticElementSyntaxNode>variables[1];
        assert.equal(secondVariable instanceof StaticElementSyntaxNode, true);
        Test.assertSyntaxToken(secondVariable.variable, text, TokenKind.Variable, '$b');
        assert.equal(secondVariable.expression instanceof LiteralSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    // @todo `static $a = 1 $b = 2;`

    let diagnosticTests = [
      new DiagnosticTestArgs('static', 'missing double colon, function, or variable', [ErrorCode.ERR_StaticExpressionExpected], [6]),
      // Technically, an assignment to a constant expression is also possible.
      new DiagnosticTestArgs('static $a', 'missing equals, comma or semicolon', [ErrorCode.ERR_CommaOrSemicolonExpected], [9]),
      new DiagnosticTestArgs('static $a=', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [10]),
      new DiagnosticTestArgs('static $a=1', 'missing comma or semicolon', [ErrorCode.ERR_CommaOrSemicolonExpected], [11]),
      new DiagnosticTestArgs('static $a,', 'missing variable in list', [ErrorCode.ERR_VariableExpected], [10]),
      // Unlike a global declaration, this expects a `VARIABLE` token.
      new DiagnosticTestArgs('static $', 'partial variable name', [ErrorCode.ERR_VariableNameExpected], [7]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

});
