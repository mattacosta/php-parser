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
  ArrayElementSyntaxNode,
  ArraySyntaxNode,
  AssignmentSyntaxNode,
  BinarySyntaxNode,
  ConditionalSyntaxNode,
  DestructuringAssignmentSyntaxNode,
  ExpressionStatementSyntaxNode,
  InstanceOfSyntaxNode,
  ListDestructureElementSyntaxNode,
  ListDestructureSyntaxNode,
  LiteralSyntaxNode,
  LocalVariableSyntaxNode,
  PartiallyQualifiedNameSyntaxNode,
  UnarySyntaxNode
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { ISyntaxNode } from '../../../src/language/syntax/ISyntaxNode';
import { PhpVersion } from '../../../src/parser/PhpVersion';
import { TokenKind } from '../../../src/language/TokenKind';

function assertArrayDeconstruction(statements: ISyntaxNode[]): ArraySyntaxNode {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let assignmentNode = <DestructuringAssignmentSyntaxNode>exprNode.expression;
  assert.equal(assignmentNode instanceof DestructuringAssignmentSyntaxNode, true, 'DestructuringAssignmentSyntaxNode');
  let array = <ArraySyntaxNode>assignmentNode.unpackedList;
  assert.equal(array instanceof ArraySyntaxNode, true);
  return array;
}

function assertAssignmentAssociativity(statements: ISyntaxNode[]) {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let parentExpr = <AssignmentSyntaxNode>exprNode.expression;
  assert.equal(parentExpr instanceof AssignmentSyntaxNode, true, 'AssignmentSyntaxNode');
  assert.equal(parentExpr.leftOperand instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
  let childExpr = <AssignmentSyntaxNode>parentExpr.rightOperand;
  assert.equal(childExpr instanceof AssignmentSyntaxNode, true);
  assert.equal(childExpr.leftOperand instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
  assert.equal(childExpr.rightOperand instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
}

function assertAssignmentNode(statements: ISyntaxNode[]): AssignmentSyntaxNode {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let assignmentNode = <AssignmentSyntaxNode>exprNode.expression;
  assert.equal(assignmentNode instanceof AssignmentSyntaxNode, true, 'AssignmentSyntaxNode');
  assert.equal(assignmentNode.leftOperand instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
  assert.equal(assignmentNode.rightOperand instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
  return assignmentNode;
}

function assertBinaryAssociativity(statements: ISyntaxNode[], isRightAssociative = false) {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementNode');
  let parentExpr = <BinarySyntaxNode>exprNode.expression;
  assert.equal(parentExpr instanceof BinarySyntaxNode, true, 'BinarySyntaxNode');
  if (isRightAssociative) {
    // Expected: `1 <op> ($a <op> 2)`
    assert.equal(parentExpr.leftOperand instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');  // 1
    let childExpr = <BinarySyntaxNode>parentExpr.rightOperand;
    assert.equal(childExpr instanceof BinarySyntaxNode, true);
    assert.equal(childExpr.leftOperand instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');  // $a
    assert.equal(childExpr.rightOperand instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');  // 2
  }
  else {
    // Expected: `(1 <op> $a) <op> 2`
    assert.equal(parentExpr.rightOperand instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');  // 2
    let childExpr = <BinarySyntaxNode>parentExpr.leftOperand;
    assert.equal(childExpr instanceof BinarySyntaxNode, true);
    assert.equal(childExpr.leftOperand instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');  // 1
    assert.equal(childExpr.rightOperand instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');  // $a
  }
}

function assertBinaryNode(statements: ISyntaxNode[]): BinarySyntaxNode {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let binaryNode = <BinarySyntaxNode>exprNode.expression;
  assert.equal(binaryNode instanceof BinarySyntaxNode, true, 'BinarySyntaxNode');
  assert.equal(binaryNode.leftOperand instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
  assert.equal(binaryNode.rightOperand instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
  return binaryNode;
}

function assertListDeconstruction(statements: ISyntaxNode[]): ListDestructureSyntaxNode {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let assignmentNode = <DestructuringAssignmentSyntaxNode>exprNode.expression;
  assert.equal(assignmentNode instanceof DestructuringAssignmentSyntaxNode, true, 'DestructuringAssignmentSyntaxNode');
  let list = <ListDestructureSyntaxNode>assignmentNode.unpackedList;
  assert.equal(list instanceof ListDestructureSyntaxNode, true);
  return list;
}

describe('PhpParser', function() {

  describe('binary expressions', function() {

    describe('left associative operators', function() {
      let syntaxTests = [
        new ParserTestArgs('1 + $a + 2;', 'add', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 & $a & 2;', 'bitwise and', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 | $a | 2;', 'bitwise or', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 ^ $a ^ 2;', 'bitwise xor', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('"1" . $a . "2";', 'concatenate', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 / $a / 2;', 'divide', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 && $a && 2;', 'logical and', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 and $a and 2;', 'logical and (alternate syntax)', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 || $a || 2;', 'logical or', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 or $a or 2;', 'logical or (alternate syntax)', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 xor $a xor 2;', 'logical xor', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 % $a % 2;', 'modulus', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 * $a * 2;', 'multiply', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 << $a << 2;', 'shift left', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 >> $a >> 2;', 'shift right', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        new ParserTestArgs('1 - $a - 2;', 'subtract', (statements) => {
          assertBinaryAssociativity(statements);
        }),
        // See also: https://bugs.php.net/bug.php?id=61915
        // Left: ($a ? $b : $c) ? 1 : 2
        // Right: $a ? $b : ($c ? 1 : 2)
        new ParserTestArgs('$a ? $b : $c ? 1 : 2;', 'ternary', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementNode');
          let parentExpr = <ConditionalSyntaxNode>exprNode.expression;
          assert.equal(parentExpr instanceof ConditionalSyntaxNode, true, 'ConditionalSyntaxNode');
          assert.equal(parentExpr.trueExpr instanceof LiteralSyntaxNode, true, 'parent.trueExpr');
          assert.equal(parentExpr.falseExpr instanceof LiteralSyntaxNode, true, 'parent.falseExpr');
          let childExpr = <ConditionalSyntaxNode>parentExpr.condition;
          assert.equal(childExpr.condition instanceof LocalVariableSyntaxNode, true);
          assert.equal(childExpr.trueExpr instanceof LocalVariableSyntaxNode, true, 'child.trueExpr');
          assert.equal(childExpr.falseExpr instanceof LocalVariableSyntaxNode, true, 'child.falseExpr');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('right associative operators', function() {
      let syntaxTests = [
        new ParserTestArgs('1 ?? $a ?? 2;', 'coalesce', (statements) => {
          assertBinaryAssociativity(statements, true);
        }),
        new ParserTestArgs('1 ** $a ** 2;', 'pow', (statements) => {
          assertBinaryAssociativity(statements, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('right associative operators (assignment)', function() {
      let syntaxTests = [
        new ParserTestArgs('$a = $b = 1;', 'equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a &= $b &= 1;', 'and equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a .= $b .= "1";', 'concat equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a /= $b /= 1;', 'divide equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a -= $b -= 1;', 'minus equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a %= $b %= 1;', 'mod equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a *= $b *= 1;', 'multiply equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a |= $b |= 1;', 'or equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a += $b += 1;', 'plus equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a **= $b **= 1;', 'pow equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a <<= $b <<= 1;', 'shift left equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a >>= $b >>= 1;', 'shift right equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
        new ParserTestArgs('$a ^= $b ^= 1;', 'xor equal', (statements) => {
          assertAssignmentAssociativity(statements);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('non-associative operators', function() {
      let diagnosticTests = [
        // Comparison operators.
        new DiagnosticTestArgs('1 < $a < 2;', 'less than', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [6, 7]),
        new DiagnosticTestArgs('1 <= $a <= 2;', 'less than or equal', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [7, 8]),
        new DiagnosticTestArgs('1 > $a > 2;', 'greater than', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [6, 7]),
        new DiagnosticTestArgs('1 >= $a >= 2;', 'greater than or equal', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [7, 8]),
        // Equality operators.
        new DiagnosticTestArgs('1 == $a == 2;', 'is equal', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [7, 8]),
        new DiagnosticTestArgs('1 != $a != 2;', 'is not equal', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [7, 8]),
        new DiagnosticTestArgs('1 === $a === 2;', 'is identical', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [8, 9]),
        new DiagnosticTestArgs('1 !== $a !== 2;', 'is not identical', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [8, 9]),
        new DiagnosticTestArgs('1 <=> $a <=> 2;', 'spaceship', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [8, 9]),
        // The `instanceof` operator.
        // @todo Report PHP bug: `instanceof` operator should be non-associative.
        new DiagnosticTestArgs('$a instanceof A instanceof B;', 'instanceof', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [15, 16]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('instanceof-expression', function() {
      // See `object-creation-expression` for full tests of `class-name-reference`.
      let syntaxTests = [
        new ParserTestArgs('$a instanceof A;', 'should parse an instanceof expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let binaryNode = <InstanceOfSyntaxNode>exprNode.expression;
          assert.equal(binaryNode instanceof InstanceOfSyntaxNode, true, 'BinarySyntaxNode');
          assert.equal(binaryNode.operand instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
          Test.assertSyntaxToken(binaryNode.instanceOfKeyword, text, TokenKind.InstanceOf, 'instanceof');
          assert.equal(binaryNode.classNameOrReference instanceof PartiallyQualifiedNameSyntaxNode, true, 'PartiallyQualifiedNameSyntaxNode');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('$a instanceof', 'missing name or reference', [ErrorCode.ERR_ClassNameOrReferenceExpected], [13]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('multiplicative-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a * 2;', 'should parse a multiply expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.Asterisk, '*');
        }),
        new ParserTestArgs('$a / 2;', 'should parse a divide expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.Slash, '/');
        }),
        new ParserTestArgs('$a % 2;', 'should parse a modulus expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.Percent, '%');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('additive-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a + 1;', 'should parse a add expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.Plus, '+');
        }),
        new ParserTestArgs('$a - 1;', 'should parse a subtract expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.Minus, '-');
        }),
        new ParserTestArgs('$a . "";', 'should parse a concatenation expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.Period, '.');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('shift-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a << 1;', 'should parse a left shift expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.ShiftLeft, '<<');
        }),
        new ParserTestArgs('$a >> 1;', 'should parse a right shift expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.ShiftRight, '>>');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('relational-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a < 1;', 'should parse a less than expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.LessThan, '<');
        }),
        new ParserTestArgs('$a > 1;', 'should parse a greater than expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.GreaterThan, '>');
        }),
        new ParserTestArgs('$a <= 1;', 'should parse a less than or equal expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.IsLessThanOrEqual, '<=');
        }),
        new ParserTestArgs('$a >= 1;', 'should parse a greater than or equal expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.IsGreaterThanOrEqual, '>=');
        }),
        new ParserTestArgs('$a <=> 1;', 'should parse a spaceship expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.Spaceship, '<=>');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('equality-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a == 1;', 'should parse an is equal expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.IsEqual, '==');
        }),
        new ParserTestArgs('$a != 1;', 'should parse an is not equal expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.IsNotEqual, '!=');
        }),
        new ParserTestArgs('$a <> 1;', 'should parse an is not equal expression (alternate syntax)', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.Inequality, '<>');
        }),
        new ParserTestArgs('$a === 1;', 'should parse an is strict equal expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.IsIdentical, '===');
        }),
        new ParserTestArgs('$a !== 1;', 'should parse an is not strict equal expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.IsNotIdentical, '!==');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('bitwise-*-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a & 1;', 'should parse a bitwise and expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.Ampersand, '&');
        }),
        new ParserTestArgs('$a ^ 1;', 'should parse a bitwise xor expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.Caret, '^');
        }),
        new ParserTestArgs('$a | 1;', 'should parse a bitwise or expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.VerticalBar, '|');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('logical-*-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a && 1;', 'should parse a logical and expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.BooleanAnd, '&&');
        }),
        new ParserTestArgs('$a || 1;', 'should parse a logical or expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.BooleanOr, '||');
        }),
        new ParserTestArgs('$a and 1;', 'should parse a logical and expression (alternate syntax)', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.LogicalAnd, 'and');
        }),
        new ParserTestArgs('$a or 1;', 'should parse a logical or expression (alternate syntax)', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.LogicalOr, 'or');
        }),
        new ParserTestArgs('$a xor 1;', 'should parse a logical xor expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.LogicalXor, 'xor');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('conditional-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a ? 1 : 2;', 'should parse a conditional expression', (statement) => {
          let exprNode = <ExpressionStatementSyntaxNode>statement[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let conditional = <ConditionalSyntaxNode>exprNode.expression;
          assert.equal(conditional instanceof ConditionalSyntaxNode, true);
          assert.equal(conditional.condition instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
          assert.equal(conditional.trueExpr instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
          assert.equal(conditional.falseExpr instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('$a ?: 1;', 'should parse a conditional expression without true expression', (statement) => {
          let exprNode = <ExpressionStatementSyntaxNode>statement[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let conditional = <ConditionalSyntaxNode>exprNode.expression;
          assert.equal(conditional instanceof ConditionalSyntaxNode, true);
          assert.equal(conditional.condition instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
          assert.strictEqual(conditional.trueExpr, null);
          assert.equal(conditional.falseExpr instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('$a ?', 'missing expression or colon', [ErrorCode.ERR_ExpressionOrColonExpected], [4]),
        new DiagnosticTestArgs('$a ? $b', 'missing colon', [ErrorCode.ERR_Syntax], [7]),
        new DiagnosticTestArgs('$a ? $b :', 'missing false expression', [ErrorCode.ERR_ExpressionExpectedEOF], [9]),
        new DiagnosticTestArgs('$a ?:', 'missing false expression (without true expression)', [ErrorCode.ERR_ExpressionExpectedEOF], [5]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('coalesce-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a ?? 1;', 'should parse a coalesce expression', (statements, text) => {
          let binaryExpr = assertBinaryNode(statements);
          Test.assertSyntaxToken(binaryExpr.operator, text, TokenKind.Coalesce, '??');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('assignment-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a = 1;', 'should parse an assignment expression', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let assignmentNode = <AssignmentSyntaxNode>exprNode.expression;
          assert.equal(assignmentNode instanceof AssignmentSyntaxNode, true);
          assert.equal(assignmentNode.leftOperand instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(assignmentNode.ampersand, null);
          assert.equal(assignmentNode.rightOperand instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('$a =& $b;', 'should parse a byref assignment expression', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let assignmentNode = <AssignmentSyntaxNode>exprNode.expression;
          assert.equal(assignmentNode instanceof AssignmentSyntaxNode, true);
          assert.equal(assignmentNode.leftOperand instanceof LocalVariableSyntaxNode, true);
          assert.notStrictEqual(assignmentNode.ampersand, null);
          assert.equal(assignmentNode.rightOperand instanceof LocalVariableSyntaxNode, true);
        }),
        // Expected: !($a = 1)
        new ParserTestArgs('!$a = 1;', 'should parse lhs of assignment as explicit expression (unary)', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let parentNode = <UnarySyntaxNode>exprNode.expression;
          assert.equal(parentNode instanceof UnarySyntaxNode, true, 'UnarySyntaxNode');
          let childNode = <AssignmentSyntaxNode>parentNode.operand;
          assert.equal(childNode instanceof AssignmentSyntaxNode, true, 'AssignmentSyntaxNode');
          assert.equal(childNode.leftOperand instanceof LocalVariableSyntaxNode, true);
        }),
        // Expected: $a == ($b = 1)
        new ParserTestArgs('$a == $b = 1;', 'should parse lhs of assignment as explicit expression (binary)', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let binaryNode = <BinarySyntaxNode>exprNode.expression;
          assert.equal(binaryNode instanceof BinarySyntaxNode, true, 'BinarySyntaxNode');
          let assignmentNode = <AssignmentSyntaxNode>binaryNode.rightOperand;
          assert.equal(assignmentNode instanceof AssignmentSyntaxNode, true, 'AssignmentSyntaxNode');
          assert.equal(assignmentNode.leftOperand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('$a =& $b + $c;', 'should parse rhs of byref assignment as explicit expression', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let binaryNode = <BinarySyntaxNode>exprNode.expression;
          assert.equal(binaryNode instanceof BinarySyntaxNode, true, 'BinarySyntaxNode');
          assert.equal(binaryNode.rightOperand instanceof LocalVariableSyntaxNode, true);
          let assignmentNode = <AssignmentSyntaxNode>binaryNode.leftOperand;
          assert.equal(assignmentNode instanceof AssignmentSyntaxNode, true, 'AssignmentSyntaxNode');
          assert.equal(assignmentNode.leftOperand instanceof LocalVariableSyntaxNode, true);
          assert.equal(assignmentNode.rightOperand instanceof LocalVariableSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('$a =& 1;', 'should expect explicit expression in rhs of byref assignment', [ErrorCode.ERR_ExpressionNotAddressable], [6]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('destructuring-assignment-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('list($a) = $b;', 'should parse a destructuring assignment', (statements) => {
          let list = assertListDeconstruction(statements);
          let elements = list.variables ? list.variables.childNodes() : [];
          assert.equal(elements.length, 1);
          let element = <ListDestructureElementSyntaxNode>elements[0];
          assert.equal(element instanceof ListDestructureElementSyntaxNode, true);
          assert.strictEqual(element.key, null);
          assert.strictEqual(element.ampersand, null);
          assert.equal(element.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('list(&$a) = $b;', 'should parse a destructuring assignment with byref value', (statements) => {
          let list = assertListDeconstruction(statements);
          let elements = list.variables ? list.variables.childNodes() : [];
          assert.equal(elements.length, 1);
          let element = <ListDestructureElementSyntaxNode>elements[0];
          assert.equal(element instanceof ListDestructureElementSyntaxNode, true);
          assert.strictEqual(element.key, null);
          assert.notStrictEqual(element.ampersand, null);
          assert.equal(element.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('list($a, $b) = $c;', 'should parse a destructuring assignment with multiple elements', (statements) => {
          let list = assertListDeconstruction(statements);
          let elements = list.variables ? list.variables.childNodes() : [];
          assert.equal(elements.length, 2);
          let firstElement = <ListDestructureElementSyntaxNode>elements[0];
          assert.equal(firstElement instanceof ListDestructureElementSyntaxNode, true);
          assert.strictEqual(firstElement.key, null);
          assert.equal(firstElement.value instanceof LocalVariableSyntaxNode, true);
          let secondElement = <ListDestructureElementSyntaxNode>elements[1];
          assert.equal(secondElement instanceof ListDestructureElementSyntaxNode, true);
          assert.strictEqual(secondElement.key, null);
          assert.equal(secondElement.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('list($a,) = $c;', 'should parse a destructuring assignment with trailing comma', (statements) => {
          let list = assertListDeconstruction(statements);
          let elements = list.variables ? list.variables.childNodes() : [];
          assert.equal(elements.length, 1);
          let element = <ListDestructureElementSyntaxNode>elements[0];
          assert.equal(element instanceof ListDestructureElementSyntaxNode, true);
          assert.strictEqual(element.key, null);
          assert.equal(element.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('list(,,$a) = $b;', 'should parse a destructuring assignment with empty leading elements', (statements) => {
          let list = assertListDeconstruction(statements);
          let elements = list.variables ? list.variables.childNodes() : [];
          assert.equal(elements.length, 1);
          let element = <ListDestructureElementSyntaxNode>elements[0];
          assert.equal(element instanceof ListDestructureElementSyntaxNode, true);
          assert.strictEqual(element.key, null);
          assert.equal(element.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('list($a,,) = $b;', 'should parse a destructuring assignment with empty trailing elements', (statements) => {
          let list = assertListDeconstruction(statements);
          let elements = list.variables ? list.variables.childNodes() : [];
          assert.equal(elements.length, 1);
          let element = <ListDestructureElementSyntaxNode>elements[0];
          assert.equal(element instanceof ListDestructureElementSyntaxNode, true);
          assert.strictEqual(element.key, null);
          assert.equal(element.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('list(list($a)) = $b;', 'should parse a destructuring assignment with nested deconstruction', (statements) => {
          let list = assertListDeconstruction(statements);
          let elements = list.variables ? list.variables.childNodes() : [];
          assert.equal(elements.length, 1);
          let element = <ListDestructureElementSyntaxNode>elements[0];
          assert.equal(element instanceof ListDestructureElementSyntaxNode, true);
          assert.strictEqual(element.key, null);
          assert.equal(element.value instanceof ListDestructureSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let syntaxTests7_1 = [
        new ParserTestArgs('list($a => $b) = $c;', 'should parse a destructuring assignment with a key-value pair', (statements) => {
          let list = assertListDeconstruction(statements);
          let elements = list.variables ? list.variables.childNodes() : [];
          assert.equal(elements.length, 1);
          let element = <ListDestructureElementSyntaxNode>elements[0];
          assert.equal(element instanceof ListDestructureElementSyntaxNode, true);
          assert.equal(element.key instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(element.ampersand, null);
          assert.equal(element.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('list($a => &$b) = $c;', 'should parse a destructuring assignment with a key-value pair (byref value)', (statements) => {
          let list = assertListDeconstruction(statements);
          let elements = list.variables ? list.variables.childNodes() : [];
          assert.equal(elements.length, 1);
          let element = <ListDestructureElementSyntaxNode>elements[0];
          assert.equal(element instanceof ListDestructureElementSyntaxNode, true);
          assert.equal(element.key instanceof LocalVariableSyntaxNode, true);
          assert.notStrictEqual(element.ampersand, null);
          assert.equal(element.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('list(1 => $a) = $b;', 'should parse a destructuring assignment with a key-value pair (implicit key)', (statements) => {
          let list = assertListDeconstruction(statements);
          let elements = list.variables ? list.variables.childNodes() : [];
          assert.equal(elements.length, 1);
          let element = <ListDestructureElementSyntaxNode>elements[0];
          assert.equal(element instanceof ListDestructureElementSyntaxNode, true);
          assert.equal(element.key instanceof LiteralSyntaxNode, true);
          assert.equal(element.value instanceof LocalVariableSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests7_1, PhpVersion.PHP7_1);

      let diagnosticTests = [
        new DiagnosticTestArgs('list', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [4]),
        new DiagnosticTestArgs('list(', 'missing expression', [ErrorCode.ERR_DeconstructVariableMissing], [5]),
        new DiagnosticTestArgs('list($a', 'missing comma or close paren', [ErrorCode.ERR_CommaOrCloseParenExpected], [7]),
        new DiagnosticTestArgs('list($a,', 'missing expression or close paren', [ErrorCode.ERR_ExpressionOrCloseParenExpected], [8]),
        new DiagnosticTestArgs('list($a)', 'missing equals', [ErrorCode.ERR_Syntax], [8]),
        new DiagnosticTestArgs('list($a) =', 'missing expression (operand)', [ErrorCode.ERR_ExpressionExpectedEOF], [10]),

        new DiagnosticTestArgs('list() = $a;', 'should not parse a deconstruction without a variable', [ErrorCode.ERR_DeconstructVariableMissing], [5]),
        new DiagnosticTestArgs('list(,) = $a;', 'should not parse a deconstruction without a variable (with comma)', [ErrorCode.ERR_DeconstructVariableMissing], [6]),
        new DiagnosticTestArgs('list([$a]) = $b;', 'should not parse a deconstruction using mixed syntax', [ErrorCode.ERR_ExpressionNotAddressable], [5]),
        new DiagnosticTestArgs('list(1) = $a;', 'should expect an explicit value', [ErrorCode.ERR_ExpressionNotAddressable], [5]),
        new DiagnosticTestArgs('list(&$a => $b) = $c;', 'should not parse deconstruction with byref key', [ErrorCode.ERR_CommaOrCloseParenExpected], [8]),
      ];
      Test.assertDiagnostics(diagnosticTests);

      let diagnosticTestsKeys = [
        new DiagnosticTestArgs('list($a => 1) = $b;', 'should expect an explicit value (key-value pair)', [ErrorCode.ERR_FeatureListDeconstructionKeys, ErrorCode.ERR_ExpressionNotAddressable], [8, 11]),
      ];
      Test.assertDiagnostics(diagnosticTestsKeys, PhpVersion.PHP7_0, PhpVersion.PHP7_0);
    });

    describe('destructuring-assignment-expression (short-syntax)', function() {
      // Since the LHS of this expression is parsed as an array initializer,
      // tests for array elements is handled there.
      let syntaxTests = [
        new ParserTestArgs('[$a] = $b;', 'should parse a destructuring assignment', (statements) => {
          let array = assertArrayDeconstruction(statements);
          let elements = array.initializerList ? array.initializerList.childNodes() : [];
          assert.equal(elements.length, 1);
          assert.equal(elements[0] instanceof ArrayElementSyntaxNode, true);
        }),
        new ParserTestArgs('[&$a] = $b;', 'should parse a destructuring assignment with byref value', (statements) => {
          let array = assertArrayDeconstruction(statements);
          let elements = array.initializerList ? array.initializerList.childNodes() : [];
          assert.equal(elements.length, 1);
          assert.equal(elements[0] instanceof ArrayElementSyntaxNode, true);
        }),
        new ParserTestArgs('[$a, $b] = $c;', 'should parse a destructuring assignment with multiple elements', (statements) => {
          let array = assertArrayDeconstruction(statements);
          let elements = array.initializerList ? array.initializerList.childNodes() : [];
          assert.equal(elements.length, 2);
          assert.equal(elements[0] instanceof ArrayElementSyntaxNode, true);
          assert.equal(elements[1] instanceof ArrayElementSyntaxNode, true);
        }),
        new ParserTestArgs('[,$a] = $c;', 'should parse a destructuring assignment with leading comma', (statements) => {
          let array = assertArrayDeconstruction(statements);
          let elements = array.initializerList ? array.initializerList.childNodes() : [];
          assert.equal(elements.length, 1);
          assert.equal(elements[0] instanceof ArrayElementSyntaxNode, true);
        }),
        new ParserTestArgs('[$a,] = $c;', 'should parse a destructuring assignment with trailing comma', (statements) => {
          let array = assertArrayDeconstruction(statements);
          let elements = array.initializerList ? array.initializerList.childNodes() : [];
          assert.equal(elements.length, 1);
          assert.equal(elements[0] instanceof ArrayElementSyntaxNode, true);
        }),
        new ParserTestArgs('[,,$a] = $b;', 'should parse a destructuring assignment with empty leading elements', (statements) => {
          let array = assertArrayDeconstruction(statements);
          let elements = array.initializerList ? array.initializerList.childNodes() : [];
          assert.equal(elements.length, 1);
          assert.equal(elements[0] instanceof ArrayElementSyntaxNode, true);
        }),
        new ParserTestArgs('[$a,,] = $b;', 'should parse a destructuring assignment with empty trailing elements', (statements) => {
          let array = assertArrayDeconstruction(statements);
          let elements = array.initializerList ? array.initializerList.childNodes() : [];
          assert.equal(elements.length, 1);
          assert.equal(elements[0] instanceof ArrayElementSyntaxNode, true);
        }),
        new ParserTestArgs('[[$a]] = $b;', 'should parse a destructuring assignment with nested deconstruction', (statements) => {
          let array = assertArrayDeconstruction(statements);
          let elements = array.initializerList ? array.initializerList.childNodes() : [];
          assert.equal(elements.length, 1);
          assert.equal(elements[0] instanceof ArrayElementSyntaxNode, true);
        }),
        new ParserTestArgs('[$a => $b] = $c;', 'should parse a destructuring assignment with a key-value pair', (statements) => {
          let array = assertArrayDeconstruction(statements);
          let elements = array.initializerList ? array.initializerList.childNodes() : [];
          assert.equal(elements.length, 1);
          assert.equal(elements[0] instanceof ArrayElementSyntaxNode, true);
        }),
        new ParserTestArgs('[$a => &$b] = $c;', 'should parse a destructuring assignment with a key-value pair (byref value)', (statements) => {
          let array = assertArrayDeconstruction(statements);
          let elements = array.initializerList ? array.initializerList.childNodes() : [];
          assert.equal(elements.length, 1);
          assert.equal(elements[0] instanceof ArrayElementSyntaxNode, true);
        }),
        new ParserTestArgs('[1 => $a] = $b;', 'should parse a destructuring assignment with a key-value pair (implicit key)', (statements) => {
          let array = assertArrayDeconstruction(statements);
          let elements = array.initializerList ? array.initializerList.childNodes() : [];
          assert.equal(elements.length, 1);
          assert.equal(elements[0] instanceof ArrayElementSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('compound-assignment-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a **= 2;', 'should parse a pow equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.PowEqual, '**=');
        }),
        new ParserTestArgs('$a *= 2;', 'should parse a multiply equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.MultiplyEqual, '*=');
        }),
        new ParserTestArgs('$a /= 2;', 'should parse a divide equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.DivideEqual, '/=');
        }),
        new ParserTestArgs('$a %= 2;', 'should parse a modulus equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.ModEqual, '%=');
        }),
        new ParserTestArgs('$a += 2;', 'should parse a plus equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.PlusEqual, '+=');
        }),
        new ParserTestArgs('$a -= 2;', 'should parse a subtract equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.MinusEqual, '-=');
        }),
        new ParserTestArgs('$a .= "";', 'should parse a concat equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.ConcatEqual, '.=');
        }),
        new ParserTestArgs('$a <<= 2;', 'should parse a shift left equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.ShiftLeftEqual, '<<=');
        }),
        new ParserTestArgs('$a >>= 2;', 'should parse a shift right equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.ShiftRightEqual, '>>=');
        }),
        new ParserTestArgs('$a &= 2;', 'should parse a bitwise and equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.AndEqual, '&=');
        }),
        new ParserTestArgs('$a ^= 2;', 'should parse a bitwise xor equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.XorEqual, '^=');
        }),
        new ParserTestArgs('$a |= 2;', 'should parse a bitwise or equals expression', (statements, text) => {
          let assignment = assertAssignmentNode(statements);
          Test.assertSyntaxToken(assignment.operator, text, TokenKind.OrEqual, '|=');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

  });

});
