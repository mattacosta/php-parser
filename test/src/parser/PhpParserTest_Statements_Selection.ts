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
  ElseBlockSyntaxNode,
  ElseIfBlockSyntaxNode,
  ElseIfSyntaxNode,
  ElseSyntaxNode,
  ExpressionStatementSyntaxNode,
  IfBlockSyntaxNode,
  IfSyntaxNode,
  LiteralSyntaxNode,
  LocalVariableSyntaxNode,
  SwitchBlockSyntaxNode,
  SwitchCaseSyntaxNode,
  SwitchSyntaxNode
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { SyntaxList } from '../../../src/language/syntax/SyntaxList';

function firstSwitchBlockLabel(switchNode: SwitchBlockSyntaxNode): SwitchCaseSyntaxNode {
  assert.strictEqual(switchNode instanceof SwitchBlockSyntaxNode, true, 'SwitchBlockSyntaxNode');
  assert.strictEqual(switchNode.expression instanceof LocalVariableSyntaxNode, true);
  let clauses = switchNode.caseClauses;
  assert.strictEqual(clauses instanceof SyntaxList, true);
  let labels = clauses ? clauses.childNodes() : [];
  assert.strictEqual(labels.length, 1);
  let firstLabel = <SwitchCaseSyntaxNode>labels[0];
  assert.strictEqual(firstLabel instanceof SwitchCaseSyntaxNode, true);
  return firstLabel;
}

function firstSwitchLabel(switchNode: SwitchSyntaxNode): SwitchCaseSyntaxNode {
  assert.strictEqual(switchNode instanceof SwitchSyntaxNode, true, 'SwitchSyntaxNode');
  assert.strictEqual(switchNode.expression instanceof LocalVariableSyntaxNode, true);
  let clauses = switchNode.caseClauses;
  assert.strictEqual(clauses instanceof SyntaxList, true);
  let labels = clauses ? clauses.childNodes() : [];
  assert.strictEqual(labels.length, 1);
  let firstLabel = <SwitchCaseSyntaxNode>labels[0];
  assert.strictEqual(firstLabel instanceof SwitchCaseSyntaxNode, true);
  return firstLabel;
}

describe('PhpParser', function() {

  describe('selection-statement', function() {

    describe('if-statement', function() {
      let syntaxTests = [
        new ParserTestArgs('if ($a) 1;', 'should parse an if statement', (statements) => {
          let ifNode = <IfSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfSyntaxNode, true, 'IfSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statement instanceof ExpressionStatementSyntaxNode, true);
          assert.strictEqual(ifNode.elseIfClauses, null);
          assert.strictEqual(ifNode.elseClause, null);
        }),
        new ParserTestArgs('if ($a) 1; elseif ($b) 2;', 'should parse an elseif clause', (statements) => {
          let ifNode = <IfSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfSyntaxNode, true, 'IfSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statement instanceof ExpressionStatementSyntaxNode, true);
          let elseIfNodes = ifNode.elseIfClauses ? ifNode.elseIfClauses.childNodes() : [];
          assert.strictEqual(elseIfNodes.length, 1);
          let elseIf = <ElseIfSyntaxNode>elseIfNodes[0];
          assert.strictEqual(elseIf instanceof ElseIfSyntaxNode, true);
          assert.strictEqual(elseIf.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(elseIf.statement instanceof ExpressionStatementSyntaxNode, true);
          assert.strictEqual(ifNode.elseClause, null);
        }),
        new ParserTestArgs('if ($a) 1; elseif ($b) 2; elseif ($c) 3;', 'should parse multiple elseif clauses', (statements) => {
          let ifNode = <IfSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfSyntaxNode, true, 'IfSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statement instanceof ExpressionStatementSyntaxNode, true);
          let elseIfNodes = ifNode.elseIfClauses ? ifNode.elseIfClauses.childNodes() : [];
          assert.strictEqual(elseIfNodes.length, 2);
          let firstElseIf = <ElseIfSyntaxNode>elseIfNodes[0];
          assert.strictEqual(firstElseIf instanceof ElseIfSyntaxNode, true);
          assert.strictEqual(firstElseIf.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(firstElseIf.statement instanceof ExpressionStatementSyntaxNode, true);
          let secondElseIf = <ElseIfSyntaxNode>elseIfNodes[1];
          assert.strictEqual(secondElseIf instanceof ElseIfSyntaxNode, true);
          assert.strictEqual(secondElseIf.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(secondElseIf.statement instanceof ExpressionStatementSyntaxNode, true);
          assert.strictEqual(ifNode.elseClause, null);
        }),
        new ParserTestArgs('if ($a) 1; else 2;', 'should parse an else clause', (statements) => {
          let ifNode = <IfSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfSyntaxNode, true, 'IfSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statement instanceof ExpressionStatementSyntaxNode, true);
          assert.strictEqual(ifNode.elseIfClauses, null);
          let elseNode = <ElseSyntaxNode>ifNode.elseClause;
          assert.strictEqual(elseNode instanceof ElseSyntaxNode, true);
          assert.strictEqual(elseNode.statement instanceof ExpressionStatementSyntaxNode, true);
        }),
        new ParserTestArgs('if ($a) 1; elseif ($b) 2; else 3;', 'should parse an else clause after an elseif clause', (statements) => {
          let ifNode = <IfSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfSyntaxNode, true, 'IfSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statement instanceof ExpressionStatementSyntaxNode, true);
          let elseIfNodes = ifNode.elseIfClauses ? ifNode.elseIfClauses.childNodes() : [];
          assert.strictEqual(elseIfNodes.length, 1);
          let elseIf = <ElseIfSyntaxNode>elseIfNodes[0];
          assert.strictEqual(elseIf instanceof ElseIfSyntaxNode, true);
          assert.strictEqual(elseIf.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(elseIf.statement instanceof ExpressionStatementSyntaxNode, true);
          let elseNode = <ElseSyntaxNode>ifNode.elseClause;
          assert.strictEqual(elseNode instanceof ElseSyntaxNode, true);
          assert.strictEqual(elseNode.statement instanceof ExpressionStatementSyntaxNode, true);
        }),
        // `elseif`  -> if {} elseif {} else {}
        // `else if` -> if {} else { if {} else {} }
        new ParserTestArgs('if ($a) 1; else if ($b) 2; else 3;', 'should parse a nested else clause with child if statement', (statements) => {
          let ifNode = <IfSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfSyntaxNode, true, 'IfSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statement instanceof ExpressionStatementSyntaxNode, true);
          assert.strictEqual(ifNode.elseIfClauses, null);
          let elseNode = <ElseSyntaxNode>ifNode.elseClause;
          assert.strictEqual(elseNode instanceof ElseSyntaxNode, true);

          let childIf = <IfSyntaxNode>elseNode.statement;
          assert.strictEqual(childIf instanceof IfSyntaxNode, true);
          assert.strictEqual(childIf.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(childIf.statement instanceof ExpressionStatementSyntaxNode, true);
          assert.strictEqual(childIf.elseIfClauses, null);
          let childElse = <ElseSyntaxNode>childIf.elseClause;
          assert.strictEqual(childElse instanceof ElseSyntaxNode, true);
          assert.strictEqual(childElse.statement instanceof ExpressionStatementSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('if', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [2]),
        new DiagnosticTestArgs('if (', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [4]),
        new DiagnosticTestArgs('if ($a', 'missing close paren', [ErrorCode.ERR_CloseParenExpected], [6]),
        new DiagnosticTestArgs('if ($a)', 'missing colon or statement', [ErrorCode.ERR_StatementOrColonExpected], [7]),
        new DiagnosticTestArgs('if ($a) {} else', 'missing statement (else)', [ErrorCode.ERR_StatementExpected], [15]),

        new DiagnosticTestArgs('if ($a) {} elseif', 'missing open paren (elseif)', [ErrorCode.ERR_OpenParenExpected], [17]),
        new DiagnosticTestArgs('if ($a) {} elseif (', 'missing condition (elseif)', [ErrorCode.ERR_ExpressionExpectedEOF], [19]),
        new DiagnosticTestArgs('if ($a) {} elseif ($b', 'missing close paren (elseif)', [ErrorCode.ERR_CloseParenExpected], [21]),
        new DiagnosticTestArgs('if ($a) {} elseif ($b)', 'missing statement (elseif)', [ErrorCode.ERR_StatementExpected], [22]),

        new DiagnosticTestArgs('if ($a);', 'should warn if empty statement', [ErrorCode.WRN_PossibleMistakenEmptyStatement], [7]),
        new DiagnosticTestArgs('if ($a) {} else ;', 'should warn if empty statement (else)', [ErrorCode.WRN_PossibleMistakenEmptyStatement], [16]),
        new DiagnosticTestArgs('if ($a) {} elseif ($b);', 'should warn if empty statement (elseif)', [ErrorCode.WRN_PossibleMistakenEmptyStatement], [22]),
        new DiagnosticTestArgs('if ($a) {} else {} elseif', 'should not parse an elseif clause after an else clause', [ErrorCode.ERR_UnexpectedToken], [19]),
        new DiagnosticTestArgs('if ($a) {} else {} else', 'should not parse multiple else clauses', [ErrorCode.ERR_UnexpectedToken], [19]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('if-statement (alternate syntax)', function() {
      let syntaxTests = [
        new ParserTestArgs('if ($a): endif;', 'should parse an if statement', (statements) => {
          let ifNode = <IfBlockSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfBlockSyntaxNode, true, 'IfBlockSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statements, null);
          assert.strictEqual(ifNode.elseIfClauses, null);
          assert.strictEqual(ifNode.elseClause, null);
        }),
        new ParserTestArgs('if ($a): 1; 2; endif;', 'should parse an if statement with child statements', (statements) => {
          let ifNode = <IfBlockSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfBlockSyntaxNode, true, 'IfBlockSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          let expressions = ifNode.statements ? ifNode.statements.childNodes() : [];
          assert.strictEqual(expressions.length, 2);
          assert.strictEqual(ifNode.elseIfClauses, null);
          assert.strictEqual(ifNode.elseClause, null);
        }),
        new ParserTestArgs('if ($a): else: endif;', 'should parse an else clause', (statements) => {
          let ifNode = <IfBlockSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfBlockSyntaxNode, true, 'IfBlockSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statements, null);
          assert.strictEqual(ifNode.elseIfClauses, null);
          let elseClause = <ElseBlockSyntaxNode>ifNode.elseClause;
          assert.strictEqual(elseClause instanceof ElseBlockSyntaxNode, true);
          assert.strictEqual(elseClause.statements, null);
        }),
        new ParserTestArgs('if ($a): else: 1; 2; endif;', 'should parse an else clause with child statements', (statements) => {
          let ifNode = <IfBlockSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfBlockSyntaxNode, true, 'IfBlockSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statements, null);
          assert.strictEqual(ifNode.elseIfClauses, null);
          let elseClause = <ElseBlockSyntaxNode>ifNode.elseClause;
          assert.strictEqual(elseClause instanceof ElseBlockSyntaxNode, true);
          let expressions = elseClause.statements ? elseClause.statements.childNodes() : [];
          assert.strictEqual(expressions.length, 2);
        }),
        new ParserTestArgs('if ($a): elseif ($b): endif;', 'should parse an elseif clause', (statements) => {
          let ifNode = <IfBlockSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfBlockSyntaxNode, true, 'IfBlockSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statements, null);
          let elseIfClauses = ifNode.elseIfClauses ? ifNode.elseIfClauses.childNodes() : [];
          assert.strictEqual(elseIfClauses.length, 1);
          let elseIf = <ElseIfBlockSyntaxNode>elseIfClauses[0];
          assert.strictEqual(elseIf instanceof ElseIfBlockSyntaxNode, true);
          assert.strictEqual(elseIf.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(elseIf.statements, null);
          assert.strictEqual(ifNode.elseClause, null);
        }),
        new ParserTestArgs('if ($a): elseif ($b): 1; 2; endif;', 'should parse an elseif clause with child statements', (statements) => {
          let ifNode = <IfBlockSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfBlockSyntaxNode, true, 'IfBlockSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statements, null);
          let elseIfClauses = ifNode.elseIfClauses ? ifNode.elseIfClauses.childNodes() : [];
          assert.strictEqual(elseIfClauses.length, 1);
          let elseIf = <ElseIfBlockSyntaxNode>elseIfClauses[0];
          assert.strictEqual(elseIf instanceof ElseIfBlockSyntaxNode, true);
          assert.strictEqual(elseIf.condition instanceof LocalVariableSyntaxNode, true);
          let expressions = elseIf.statements ? elseIf.statements.childNodes() : [];
          assert.strictEqual(expressions.length, 2);
          assert.strictEqual(expressions[0] instanceof ExpressionStatementSyntaxNode, true);
          assert.strictEqual(expressions[1] instanceof ExpressionStatementSyntaxNode, true);
          assert.strictEqual(ifNode.elseClause, null);
        }),
        new ParserTestArgs('if ($a): elseif ($b): elseif ($c): endif;', 'should parse multiple elseif clauses', (statements) => {
          let ifNode = <IfBlockSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfBlockSyntaxNode, true, 'IfBlockSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statements, null);
          let elseIfClauses = ifNode.elseIfClauses ? ifNode.elseIfClauses.childNodes() : [];
          assert.strictEqual(elseIfClauses.length, 2);
          let firstElseIf = <ElseIfBlockSyntaxNode>elseIfClauses[0];
          assert.strictEqual(firstElseIf instanceof ElseIfBlockSyntaxNode, true);
          assert.strictEqual(firstElseIf.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(firstElseIf.statements, null);
          let secondElseIf = <ElseIfBlockSyntaxNode>elseIfClauses[0];
          assert.strictEqual(secondElseIf instanceof ElseIfBlockSyntaxNode, true);
          assert.strictEqual(secondElseIf.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(secondElseIf.statements, null);
          assert.strictEqual(ifNode.elseClause, null);
        }),
        new ParserTestArgs('if ($a): elseif ($b): else: endif;', 'should parse an else clause after an elseif clause', (statements) => {
          let ifNode = <IfBlockSyntaxNode>statements[0];
          assert.strictEqual(ifNode instanceof IfBlockSyntaxNode, true, 'IfBlockSyntaxNode');
          assert.strictEqual(ifNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(ifNode.statements, null);
          let elseIfClauses = ifNode.elseIfClauses ? ifNode.elseIfClauses.childNodes() : [];
          assert.strictEqual(elseIfClauses.length, 1);
          let elseIf = <ElseIfBlockSyntaxNode>elseIfClauses[0];
          assert.strictEqual(elseIf instanceof ElseIfBlockSyntaxNode, true);
          assert.strictEqual(elseIf.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(elseIf.statements, null);
          let elseClause = <ElseBlockSyntaxNode>ifNode.elseClause;
          assert.strictEqual(elseClause instanceof ElseBlockSyntaxNode, true);
          assert.strictEqual(elseClause.statements, null);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('if ($a):', 'missing endif', [ErrorCode.ERR_Syntax], [8]),
        new DiagnosticTestArgs('if ($a): endif', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [14]),
        new DiagnosticTestArgs('if ($a): else', 'missing colon (else)', [ErrorCode.ERR_Syntax], [13]),
        new DiagnosticTestArgs('if ($a): else:', 'missing endif (else)', [ErrorCode.ERR_Syntax], [14]),

        new DiagnosticTestArgs('if ($a): elseif', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [15]),
        new DiagnosticTestArgs('if ($a): elseif (', 'missing condition', [ErrorCode.ERR_ExpressionExpectedEOF], [17]),
        new DiagnosticTestArgs('if ($a): elseif ($b', 'missing close paren', [ErrorCode.ERR_CloseParenExpected], [19]),
        new DiagnosticTestArgs('if ($a): elseif ($b)', 'missing colon (elseif)', [ErrorCode.ERR_Syntax], [20]),
        new DiagnosticTestArgs('if ($a): elseif ($b):', 'missing endif (elseif)', [ErrorCode.ERR_Syntax], [21]),

        new DiagnosticTestArgs('if ($a): else: elseif ($b): endif;', 'should not parse an elseif clause after an else clause', [ErrorCode.ERR_UnexpectedToken], [15]),
        new DiagnosticTestArgs('if ($a): else: else: endif;', 'should not parse multiple else clauses', [ErrorCode.ERR_UnexpectedToken], [15]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('switch-statement', function() {
      // Parse tests are handled by the case-statement and default-statement tests.

      let diagnosticTests = [
        new DiagnosticTestArgs('switch', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [6]),
        new DiagnosticTestArgs('switch (', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [8]),
        new DiagnosticTestArgs('switch ($a', 'missing close paren', [ErrorCode.ERR_CloseParenExpected], [10]),
        new DiagnosticTestArgs('switch ($a)', 'missing open brace or colon', [ErrorCode.ERR_OpenBraceOrColonExpected], [11]),
        new DiagnosticTestArgs('switch ($a) {', 'missing close brace', [ErrorCode.ERR_CloseBraceExpected], [13]),
        new DiagnosticTestArgs('switch ($a):', 'missing endswitch', [ErrorCode.ERR_Syntax], [12]),
        new DiagnosticTestArgs('switch ($a): default: endswitch', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [31]),
        new DiagnosticTestArgs('switch ($a) {}', 'empty switch block', [ErrorCode.WRN_EmptySwitchBlock], [12]),
        new DiagnosticTestArgs('switch ($a): endswitch;', 'empty switch block (alternate syntax)', [ErrorCode.WRN_EmptySwitchBlock], [11]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('case-statement', function() {
      let tests = [
        new ParserTestArgs('switch ($a) { case 1: }', 'should parse a case statement', (statements) => {
          let switchNode = <SwitchSyntaxNode>statements[0];
          let caseLabel = firstSwitchLabel(switchNode);
          assert.strictEqual(caseLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(caseLabel.expression instanceof LiteralSyntaxNode, true);
          assert.strictEqual(caseLabel.statements, null);
        }),
        new ParserTestArgs('switch ($a) { case 1; }', 'should parse a case statement with semicolon', (statements) => {
          let switchNode = <SwitchSyntaxNode>statements[0];
          let caseLabel = firstSwitchLabel(switchNode);
          assert.strictEqual(caseLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(caseLabel.expression instanceof LiteralSyntaxNode, true);
          assert.strictEqual(caseLabel.statements, null);
        }),
        new ParserTestArgs('switch ($a) { case 1: ; }', 'should parse a case statement with child statement', (statements) => {
          let switchNode = <SwitchSyntaxNode>statements[0];
          let caseLabel = firstSwitchLabel(switchNode);
          assert.strictEqual(caseLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(caseLabel.expression instanceof LiteralSyntaxNode, true);
          assert.strictEqual(caseLabel.statements instanceof SyntaxList, true);
        }),
        new ParserTestArgs('switch ($a) { case 1; ; }', 'should parse a case statement with semicolon and child statement', (statements) => {
          let switchNode = <SwitchSyntaxNode>statements[0];
          let caseLabel = firstSwitchLabel(switchNode);
          assert.strictEqual(caseLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(caseLabel.expression instanceof LiteralSyntaxNode, true);
          assert.strictEqual(caseLabel.statements instanceof SyntaxList, true);
        }),
        new ParserTestArgs('switch ($a) { case 1: case 2: }', 'should parse multiple case statements', (statements) => {
          let switchNode = <SwitchSyntaxNode>statements[0];
          assert.strictEqual(switchNode instanceof SwitchSyntaxNode, true, 'SwitchSyntaxNode');
          assert.strictEqual(switchNode.expression instanceof LocalVariableSyntaxNode, true);
          let clauses = switchNode.caseClauses;
          assert.strictEqual(clauses instanceof SyntaxList, true);
          let labels = clauses ? clauses.childNodes() : [];
          assert.strictEqual(labels.length, 2);
          assert.strictEqual(labels[0] instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(labels[1] instanceof SwitchCaseSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(tests);

      let diagnosticTests = [
        new DiagnosticTestArgs('switch ($a) { case }', 'missing expression and label separator', [ErrorCode.ERR_ExpressionExpected], [18]),
        new DiagnosticTestArgs('switch ($a) { case 1 }', 'missing colon or semicolon', [ErrorCode.ERR_CaseLabelSeparatorExpected], [20]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('case-statement (within switch using alternate syntax)', function() {
      let tests = [
        new ParserTestArgs('switch ($a): case 1: endswitch;', 'should parse a case statement', (statements) => {
          let switchNode = <SwitchBlockSyntaxNode>statements[0];
          let caseLabel = firstSwitchBlockLabel(switchNode);
          assert.strictEqual(caseLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(caseLabel.expression instanceof LiteralSyntaxNode, true);
          assert.strictEqual(caseLabel.statements, null);
        }),
        new ParserTestArgs('switch ($a): case 1; endswitch;', 'should parse a case statement with semicolon', (statements) => {
          let switchNode = <SwitchBlockSyntaxNode>statements[0];
          let caseLabel = firstSwitchBlockLabel(switchNode);
          assert.strictEqual(caseLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(caseLabel.expression instanceof LiteralSyntaxNode, true);
          assert.strictEqual(caseLabel.statements, null);
        }),
        new ParserTestArgs('switch ($a): case 1: ; endswitch;', 'should parse a case statement with child statement', (statements) => {
          let switchNode = <SwitchBlockSyntaxNode>statements[0];
          let caseLabel = firstSwitchBlockLabel(switchNode);
          assert.strictEqual(caseLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(caseLabel.expression instanceof LiteralSyntaxNode, true);
          assert.strictEqual(caseLabel.statements instanceof SyntaxList, true);
        }),
        new ParserTestArgs('switch ($a): case 1; ; endswitch;', 'should parse a case statement with semicolon and child statement', (statements) => {
          let switchNode = <SwitchBlockSyntaxNode>statements[0];
          let caseLabel = firstSwitchBlockLabel(switchNode);
          assert.strictEqual(caseLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(caseLabel.expression instanceof LiteralSyntaxNode, true);
          assert.strictEqual(caseLabel.statements instanceof SyntaxList, true);
        }),
      ];
      Test.assertSyntaxNodes(tests);

      let diagnosticTests = [
        new DiagnosticTestArgs('switch ($a): case endswitch;', 'missing expression and label separator', [ErrorCode.ERR_ExpressionExpected], [17]),
        new DiagnosticTestArgs('switch ($a): case 1 endswitch;', 'missing colon or semicolon', [ErrorCode.ERR_CaseLabelSeparatorExpected], [19]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('default-statement', function() {
      let tests = [
        new ParserTestArgs('switch ($a) { default: }', 'should parse a default statement', (statements) => {
          let switchNode = <SwitchSyntaxNode>statements[0];
          let defaultLabel = firstSwitchLabel(switchNode);
          assert.strictEqual(defaultLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(defaultLabel.expression, null);
          assert.strictEqual(defaultLabel.statements, null);
        }),
        new ParserTestArgs('switch ($a) { default; }', 'should parse a default statement with semicolon', (statements) => {
          let switchNode = <SwitchSyntaxNode>statements[0];
          let defaultLabel = firstSwitchLabel(switchNode);
          assert.strictEqual(defaultLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(defaultLabel.expression, null);
          assert.strictEqual(defaultLabel.statements, null);
        }),
        new ParserTestArgs('switch ($a) { default: ; }', 'should parse a default statement with child statement', (statements) => {
          let switchNode = <SwitchSyntaxNode>statements[0];
          let defaultLabel = firstSwitchLabel(switchNode);
          assert.strictEqual(defaultLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(defaultLabel.expression, null);
          assert.strictEqual(defaultLabel.statements instanceof SyntaxList, true);
        }),
        new ParserTestArgs('switch ($a) { default; ; }', 'should parse a default statement with semicolon and child statement', (statements) => {
          let switchNode = <SwitchSyntaxNode>statements[0];
          let defaultLabel = firstSwitchLabel(switchNode);
          assert.strictEqual(defaultLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(defaultLabel.expression, null);
          assert.strictEqual(defaultLabel.statements instanceof SyntaxList, true);
        }),
      ];
      Test.assertSyntaxNodes(tests);

      let diagnosticTests = [
        new DiagnosticTestArgs('switch ($a) { default }', 'missing colon or semicolon', [ErrorCode.ERR_CaseLabelSeparatorExpected], [21]),
        new DiagnosticTestArgs('switch ($a) { default: default: }', 'multiple default labels', [ErrorCode.ERR_MultipleDefaultSwitchLabels], [23]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('default-statement (within switch using alternate syntax)', function() {
      let tests = [
        new ParserTestArgs('switch ($a): default: endswitch;', 'should parse a default statement', (statements) => {
          let switchNode = <SwitchBlockSyntaxNode>statements[0];
          let defaultLabel = firstSwitchBlockLabel(switchNode);
          assert.strictEqual(defaultLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(defaultLabel.expression, null);
          assert.strictEqual(defaultLabel.statements, null);
        }),
        new ParserTestArgs('switch ($a): default; endswitch;', 'should parse a default statement with semicolon', (statements) => {
          let switchNode = <SwitchBlockSyntaxNode>statements[0];
          let defaultLabel = firstSwitchBlockLabel(switchNode);
          assert.strictEqual(defaultLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(defaultLabel.expression, null);
          assert.strictEqual(defaultLabel.statements, null);
        }),
        new ParserTestArgs('switch ($a): default: ; endswitch;', 'should parse a default statement with child statement', (statements) => {
          let switchNode = <SwitchBlockSyntaxNode>statements[0];
          let defaultLabel = firstSwitchBlockLabel(switchNode);
          assert.strictEqual(defaultLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(defaultLabel.expression, null);
          assert.strictEqual(defaultLabel.statements instanceof SyntaxList, true);
        }),
        new ParserTestArgs('switch ($a): default; ; endswitch;', 'should parse a default statement with semicolon and child statement', (statements) => {
          let switchNode = <SwitchBlockSyntaxNode>statements[0];
          let defaultLabel = firstSwitchBlockLabel(switchNode);
          assert.strictEqual(defaultLabel instanceof SwitchCaseSyntaxNode, true);
          assert.strictEqual(defaultLabel.expression, null);
          assert.strictEqual(defaultLabel.statements instanceof SyntaxList, true);
        }),
      ];
      Test.assertSyntaxNodes(tests);

      let diagnosticTests = [
        new DiagnosticTestArgs('switch ($a): default endswitch;', 'missing colon or semicolon', [ErrorCode.ERR_CaseLabelSeparatorExpected], [20]),
        new DiagnosticTestArgs('switch ($a): default: default: endswitch;', 'multiple default labels', [ErrorCode.ERR_MultipleDefaultSwitchLabels], [22]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

  });

});
