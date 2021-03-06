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
  AnonymousClassSyntaxNode,
  AnonymousFunctionSyntaxNode,
  AnonymousObjectCreationSyntaxNode,
  ArrayElementSyntaxNode,
  ArraySyntaxNode,
  ArrowFunctionSyntaxNode,
  AssignmentSyntaxNode,
  BinarySyntaxNode,
  CloneSyntaxNode,
  ClosureUseSyntaxNode,
  ConditionalSyntaxNode,
  EmptyIntrinsicSyntaxNode,
  ErrorControlSyntaxNode,
  EvalIntrinsicSyntaxNode,
  ExitIntrinsicSyntaxNode,
  ExpressionStatementSyntaxNode,
  FullyQualifiedNameSyntaxNode,
  IndirectObjectCreationSyntaxNode,
  InstanceOfSyntaxNode,
  IsSetIntrinsicSyntaxNode,
  LexicalVariableSyntaxNode,
  LiteralSyntaxNode,
  LocalVariableSyntaxNode,
  NamedObjectCreationSyntaxNode,
  NamedTypeSyntaxNode,
  PartiallyQualifiedNameSyntaxNode,
  PrintIntrinsicSyntaxNode,
  RelativeNameSyntaxNode,
  ScriptInclusionSyntaxNode,
  UnarySyntaxNode,
  YieldFromSyntaxNode,
  YieldSyntaxNode,
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { ISyntaxNode } from '../../../src/language/syntax/ISyntaxNode';
import { PhpVersion } from '../../../src/parser/PhpVersion';
import { TokenKind } from '../../../src/language/TokenKind';

function assertAnonymousClassDeclaration(statements: ISyntaxNode[], hasArgumentList: boolean, hasBaseType: boolean): AnonymousClassSyntaxNode {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let newNode = <AnonymousObjectCreationSyntaxNode>exprNode.expression;
  assert.strictEqual(newNode instanceof AnonymousObjectCreationSyntaxNode, true, 'AnonymousObjectCreationSyntaxNode');

  let classDecl = <AnonymousClassSyntaxNode>newNode.anonymousClass;
  assert.strictEqual(classDecl instanceof AnonymousClassSyntaxNode, true, 'AnonymousClassSyntaxNode');
  if (hasArgumentList) {
    assert.notStrictEqual(classDecl.openParen, null);
    assert.notStrictEqual(classDecl.closeParen, null);
  }
  else {
    assert.strictEqual(classDecl.openParen, null);
    assert.strictEqual(classDecl.argumentList, null);
    assert.strictEqual(classDecl.closeParen, null);
  }
  if (hasBaseType) {
    assert.strictEqual(classDecl.baseType instanceof PartiallyQualifiedNameSyntaxNode, true, 'PartiallyQualifiedNameSyntaxNode');
  }
  else {
    assert.strictEqual(classDecl.baseType, null);
  }

  return classDecl;
}

function assertArrayElement(node: ISyntaxNode, hasKey: boolean, operator: TokenKind | null): void {
  let element = <ArrayElementSyntaxNode>node;
  assert.strictEqual(element instanceof ArrayElementSyntaxNode, true, 'ArrayElementSyntaxNode');
  if (hasKey) {
    assert.strictEqual(element.key instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
  }
  else {
    assert.strictEqual(element.key, null);
  }
  if (operator !== null) {
    assert.notStrictEqual(element.valueOperator, null);
    assert.strictEqual(element.valueOperator ? element.valueOperator.kind : false, operator);
  }
  else {
    assert.strictEqual(element.valueOperator, null);
  }
  assert.strictEqual(element.value instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
}

function assertPrecedence(statements: ISyntaxNode[], text: string, kind: TokenKind, operator: string, rightKind: TokenKind, rightOperator: string): void {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let binaryNode = <BinarySyntaxNode>exprNode.expression;
  assert.strictEqual(binaryNode instanceof BinarySyntaxNode, true, 'BinarySyntaxNode');
  Test.assertSyntaxToken(binaryNode.operator, text, kind, operator);
  let rhs = <BinarySyntaxNode>binaryNode.rightOperand;
  assert.strictEqual(rhs instanceof BinarySyntaxNode, true, 'BinarySyntaxNode');
  Test.assertSyntaxToken(rhs.operator, text, rightKind, rightOperator);
}

describe('PhpParser', function() {

  describe('precedence', function() {
    let syntaxTests = [
      // Negation is equivalent to subtraction (0 - x) or multiplication
      // (-1 * x). In both cases, the operators should have a lower precedence
      // than exponentiation, so the result of -3^2 should be -(3^2) = -9.
      new ParserTestArgs('-$a ** $b;', 'unary < pow', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let unaryNode = <UnarySyntaxNode>exprNode.expression;
        assert.strictEqual(unaryNode instanceof UnarySyntaxNode, true, 'UnarySyntaxNode');
        let binaryNode = <BinarySyntaxNode>unaryNode.operand;
        assert.strictEqual(binaryNode instanceof BinarySyntaxNode, true, 'BinarySyntaxNode');
      }),
      // Expected: ((object) $a) instanceof $b
      new ParserTestArgs('(object) $a instanceof $b;', 'instanceof < unary', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let parentNode = <InstanceOfSyntaxNode>exprNode.expression;
        assert.strictEqual(parentNode instanceof InstanceOfSyntaxNode, true, 'InstanceOfSyntaxNode');
        assert.strictEqual(parentNode.operand instanceof UnarySyntaxNode, true, 'UnarySyntaxNode');
        assert.strictEqual(parentNode.classNameOrReference instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
      }),
      // Expected: !($a instanceof $b)
      new ParserTestArgs('!$a instanceof $b;', 'logical not < instanceof', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let unaryNode = <UnarySyntaxNode>exprNode.expression;
        assert.strictEqual(unaryNode instanceof UnarySyntaxNode, true, 'UnarySyntaxNode');
        assert.strictEqual(unaryNode.operand instanceof InstanceOfSyntaxNode, true, 'InstanceOfSyntaxNode');
      }),
      // Expected: (!$a) * $b
      new ParserTestArgs('!$a * $b;', 'multiply < logical not', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let binaryNode = <BinarySyntaxNode>exprNode.expression;
        assert.strictEqual(binaryNode instanceof BinarySyntaxNode, true, 'BinarySyntaxNode');
        assert.strictEqual(binaryNode.leftOperand instanceof UnarySyntaxNode, true, 'UnarySyntaxNode');
        assert.strictEqual(binaryNode.rightOperand instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
      }),
      new ParserTestArgs('$a + $b * $c;', 'add < multiply', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.Plus, '+', TokenKind.Asterisk, '*');
      }),
      new ParserTestArgs('$a << $b + $c;', 'shift < add', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.ShiftLeft, '<<', TokenKind.Plus, '+');
      }),
      new ParserTestArgs('$a < $b << $c;', 'relational < shift', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.LessThan, '<', TokenKind.ShiftLeft, '<<');
      }),
      new ParserTestArgs('$a == $b < $c;', 'equality < relational', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.IsEqual, '==', TokenKind.LessThan, '<');
      }),
      new ParserTestArgs('$a & $b == $c;', 'bitwise and < equality', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.Ampersand, '&', TokenKind.IsEqual, '==');
      }),
      new ParserTestArgs('$a ^ $b & $c;', 'bitwise xor < bitwise and', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.Caret, '^', TokenKind.Ampersand, '&');
      }),
      new ParserTestArgs('$a | $b ^ $c;', 'bitwise or < bitwise xor', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.VerticalBar, '|', TokenKind.Caret, '^');
      }),
      new ParserTestArgs('$a && $b | $c;', 'boolean and < bitwise or', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.BooleanAnd, '&&', TokenKind.VerticalBar, '|');
      }),
      new ParserTestArgs('$a || $b && $c;', 'boolean or < boolean and', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.BooleanOr, '||', TokenKind.BooleanAnd, '&&');
      }),
      new ParserTestArgs('$a ?? $b || $c;', 'coalesce < boolean or', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.Coalesce, '??', TokenKind.BooleanOr, '||');
      }),
      // Expected: $a ? $b : ($c ?? $d)
      new ParserTestArgs('$a ? $b : $c ?? $d;', 'ternary < coalesce', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let parentNode = <ConditionalSyntaxNode>exprNode.expression;
        assert.strictEqual(parentNode instanceof ConditionalSyntaxNode, true, 'ConditionalSyntaxNode');
        assert.strictEqual(parentNode.condition instanceof LocalVariableSyntaxNode, true);
        assert.strictEqual(parentNode.trueExpr instanceof LocalVariableSyntaxNode, true);
        let binaryNode = <BinarySyntaxNode>parentNode.falseExpr;
        assert.strictEqual(binaryNode instanceof BinarySyntaxNode, true, 'BinarySyntaxNode');
      }),
      // Expected: $a = ($b ? $c : $d)
      new ParserTestArgs('$a = $b ? $c : $d;', 'assignment < ternary', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let parentNode = <AssignmentSyntaxNode>exprNode.expression;
        assert.strictEqual(parentNode instanceof AssignmentSyntaxNode, true, 'AssignmentSyntaxNode');
        let rhs = <ConditionalSyntaxNode>parentNode.rightOperand;
        assert.strictEqual(rhs instanceof ConditionalSyntaxNode, true, 'ConditionalSyntaxNode');
      }),
      // Expected: $a and ($b = $c)
      new ParserTestArgs('$a and $b = $c;', 'logical and < assignment', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let binaryNode = <BinarySyntaxNode>exprNode.expression;
        assert.strictEqual(binaryNode instanceof BinarySyntaxNode, true, 'BinarySyntaxNode');
        let rhs = <AssignmentSyntaxNode>binaryNode.rightOperand;
        assert.strictEqual(rhs instanceof AssignmentSyntaxNode, true, 'AssignmentSyntaxNode');
      }),
      new ParserTestArgs('$a xor $b and $c;', 'logical xor < logical and', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.LogicalXor, 'xor', TokenKind.LogicalAnd, 'and');
      }),
      new ParserTestArgs('$a or $b xor $c;', 'logical or < logical xor', (statements, text) => {
        assertPrecedence(statements, text, TokenKind.LogicalOr, 'or', TokenKind.LogicalXor, 'xor');
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);
  });

  describe('literal', function() {
    let syntaxTests = [
      new ParserTestArgs('1;', 'integer literal', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('1.0;', 'double literal', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('"a";', 'double-quoted string literal', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('\'a\';', 'single-quoted string literal', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),

      // Magic constants.
      new ParserTestArgs('__CLASS__;', 'magic class', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('__DIR__;', 'magic directory', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('__FILE__;', 'magic file', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('__FUNCTION__;', 'magic function', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('__METHOD__;', 'magic method', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('__NAMESPACE__;', 'magic namespace', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('__LINE__;', 'magic line', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('__TRAIT__;', 'magic trait', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let literal = <LiteralSyntaxNode>exprNode.expression;
        assert.strictEqual(literal instanceof LiteralSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);
  });

  describe('intrinsic', function() {

    describe('empty-intrinsic', function() {
      let syntaxTests = [
        new ParserTestArgs('empty($a);', 'should parse an empty expression', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let emptyNode = <EmptyIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(emptyNode instanceof EmptyIntrinsicSyntaxNode, true);
          assert.strictEqual(emptyNode.expression instanceof LocalVariableSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('empty', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [5]),
        new DiagnosticTestArgs('empty(', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [6]),
        new DiagnosticTestArgs('empty($a', 'missing close paren', [ErrorCode.ERR_CloseParenExpected], [8]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    // eval-intrinsic (see script-inclusion-expression)

    describe('exit-intrinsic', function() {
      let syntaxTests = [
        new ParserTestArgs('exit;', 'should parse an exit expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let exitNode = <ExitIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(exitNode instanceof ExitIntrinsicSyntaxNode, true);
          Test.assertSyntaxToken(exitNode.exitOrDieKeyword, text, TokenKind.Exit, 'exit');
          assert.strictEqual(exitNode.expression, null);
        }),
        new ParserTestArgs('exit();', 'should parse an exit expression with parentheses', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let exitNode = <ExitIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(exitNode instanceof ExitIntrinsicSyntaxNode, true);
          Test.assertSyntaxToken(exitNode.exitOrDieKeyword, text, TokenKind.Exit, 'exit');
          assert.strictEqual(exitNode.expression, null);
        }),
        new ParserTestArgs('exit(1);', 'should parse an exit expression with parentheses and expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let exitNode = <ExitIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(exitNode instanceof ExitIntrinsicSyntaxNode, true);
          Test.assertSyntaxToken(exitNode.exitOrDieKeyword, text, TokenKind.Exit, 'exit');
          assert.strictEqual(exitNode.expression instanceof LiteralSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('exit', 'missing open paren or semicolon', [ErrorCode.ERR_SemicolonExpected], [4]),
        new DiagnosticTestArgs('exit(', 'missing expression or close paren', [ErrorCode.ERR_ExpressionOrCloseParenExpected], [5]),
        new DiagnosticTestArgs('exit(1', 'missing close paren', [ErrorCode.ERR_CloseParenExpected], [6]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('exit-intrinsic (die)', function() {
      let syntaxTests = [
        new ParserTestArgs('die;', 'should parse an exit expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let exitNode = <ExitIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(exitNode instanceof ExitIntrinsicSyntaxNode, true);
          Test.assertSyntaxToken(exitNode.exitOrDieKeyword, text, TokenKind.Die, 'die');
          assert.strictEqual(exitNode.expression, null);
        }),
        new ParserTestArgs('die();', 'should parse an exit expression with parentheses', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let exitNode = <ExitIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(exitNode instanceof ExitIntrinsicSyntaxNode, true);
          Test.assertSyntaxToken(exitNode.exitOrDieKeyword, text, TokenKind.Die, 'die');
          assert.strictEqual(exitNode.expression, null);
        }),
        new ParserTestArgs('die(1);', 'should parse an exit expression with parentheses and expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let exitNode = <ExitIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(exitNode instanceof ExitIntrinsicSyntaxNode, true);
          Test.assertSyntaxToken(exitNode.exitOrDieKeyword, text, TokenKind.Die, 'die');
          assert.strictEqual(exitNode.expression instanceof LiteralSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('die', 'missing open paren or semicolon', [ErrorCode.ERR_SemicolonExpected], [3]),
        new DiagnosticTestArgs('die(', 'missing expression or close paren', [ErrorCode.ERR_ExpressionOrCloseParenExpected], [4]),
        new DiagnosticTestArgs('die(1', 'missing close paren', [ErrorCode.ERR_CloseParenExpected], [5]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('isset-intrinsic', function() {
      let syntaxTests = [
        new ParserTestArgs('isset($a);', 'should parse an isset expression', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let isSetNode = <IsSetIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(isSetNode instanceof IsSetIntrinsicSyntaxNode, true);
          let expressions = isSetNode.expressions ? isSetNode.expressions.childNodes() : [];
          assert.strictEqual(expressions.length, 1);
          assert.strictEqual(expressions[0] instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('isset($a, $b);', 'should parse an isset expression with expression list', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let isSetNode = <IsSetIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(isSetNode instanceof IsSetIntrinsicSyntaxNode, true);
          let expressions = isSetNode.expressions ? isSetNode.expressions.childNodes() : [];
          assert.strictEqual(expressions.length, 2);
          assert.strictEqual(expressions[0] instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(expressions[1] instanceof LocalVariableSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let syntaxTests7_3 = [
        new ParserTestArgs('isset($a,);', 'should parse an isset expression with trailing comma', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let isSetNode = <IsSetIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(isSetNode instanceof IsSetIntrinsicSyntaxNode, true);
          let expressions = isSetNode.expressions.childNodes();
          assert.strictEqual(expressions.length, 1);
          assert.strictEqual(expressions[0] instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('isset($a, $b,);', 'should parse an isset expression with trailing comma after expression list', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let isSetNode = <IsSetIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(isSetNode instanceof IsSetIntrinsicSyntaxNode, true);
          let expressions = isSetNode.expressions.childNodes();
          assert.strictEqual(expressions.length, 2);
          assert.strictEqual(expressions[0] instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(expressions[1] instanceof LocalVariableSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests7_3, PhpVersion.PHP7_3);

      let diagnosticTests = [
        new DiagnosticTestArgs('isset', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [5]),
        new DiagnosticTestArgs('isset(', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [6]),
        new DiagnosticTestArgs('isset($a', 'missing comma or close paren', [ErrorCode.ERR_CommaOrCloseParenExpected], [8]),
        new DiagnosticTestArgs('isset($a, $b', 'missing comma or close paren (in list)', [ErrorCode.ERR_CommaOrCloseParenExpected], [12]),
        new DiagnosticTestArgs('isset(...$a);', 'should not parse an unpacked argument', [ErrorCode.ERR_ExpressionExpected], [6]),
      ];
      Test.assertDiagnostics(diagnosticTests);

      let diagnosticTests7_3 = [
        new DiagnosticTestArgs('isset($a,', 'missing expression or close paren', [ErrorCode.ERR_ExpressionOrCloseParenExpected], [9]),
        new DiagnosticTestArgs('isset($a, $b,', 'missing expression or close paren (in list)', [ErrorCode.ERR_ExpressionOrCloseParenExpected], [13]),
      ];
      Test.assertDiagnostics(diagnosticTests7_3, PhpVersion.PHP7_3);

      let featureTrailingCommas = [
        new DiagnosticTestArgs('isset($a,);', 'should not parse trailing comma in argument list', [ErrorCode.ERR_FeatureTrailingCommasInArgumentLists], [8]),
        new DiagnosticTestArgs('isset($a, $b,);', 'should not parse trailing comma in argument list (multiple arguments)', [ErrorCode.ERR_FeatureTrailingCommasInArgumentLists], [12]),
      ];
      Test.assertDiagnostics(featureTrailingCommas, PhpVersion.PHP7_0, PhpVersion.PHP7_2);
    });

    describe('print-intrinsic', function() {
      let syntaxTests = [
        new ParserTestArgs('print 1;', 'should parse a print expression', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let printNode = <PrintIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(printNode instanceof PrintIntrinsicSyntaxNode, true);
          assert.strictEqual(printNode.expression instanceof LiteralSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('print', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [5]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

  });

  describe('anonymous-function-creation (closure-declaration)', function() {
    // NOTE: See function-declaration for parameter list and return type tests.
    let syntaxTests = [
      new ParserTestArgs('function() {};', 'should parse a closure', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <AnonymousFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof AnonymousFunctionSyntaxNode, true);
        assert.strictEqual(closure.staticKeyword, null);
        assert.strictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        assert.strictEqual(closure.useClause, null);
        assert.strictEqual(closure.returnType, null);
      }),
      new ParserTestArgs('function(): A {};', 'should parse a closure with return type', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <AnonymousFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof AnonymousFunctionSyntaxNode, true);
        assert.strictEqual(closure.staticKeyword, null);
        assert.strictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        assert.strictEqual(closure.useClause, null);
        assert.notStrictEqual(closure.returnType, null);
      }),
      new ParserTestArgs('function() use($a) {};', 'should parse a closure with lexical variable', (statements, text) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <AnonymousFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof AnonymousFunctionSyntaxNode, true);
        assert.strictEqual(closure.staticKeyword, null);
        assert.strictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        let useClause = <ClosureUseSyntaxNode>closure.useClause;
        assert.strictEqual(useClause instanceof ClosureUseSyntaxNode, true);
        let variables = useClause.variables ? useClause.variables.childNodes() : [];
        assert.strictEqual(variables.length, 1);
        let firstVariable = <LexicalVariableSyntaxNode>variables[0];
        assert.strictEqual(firstVariable instanceof LexicalVariableSyntaxNode, true);
        assert.strictEqual(firstVariable.ampersand, null);
        Test.assertSyntaxToken(firstVariable.variable, text, TokenKind.Variable, '$a');
        assert.strictEqual(closure.returnType, null);
      }),
      new ParserTestArgs('function() use(&$a) {};', 'should parse a closure with lexical variable (by reference)', (statements, text) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <AnonymousFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof AnonymousFunctionSyntaxNode, true);
        assert.strictEqual(closure.staticKeyword, null);
        assert.strictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        let useClause = <ClosureUseSyntaxNode>closure.useClause;
        assert.strictEqual(useClause instanceof ClosureUseSyntaxNode, true);
        let variables = useClause.variables ? useClause.variables.childNodes() : [];
        assert.strictEqual(variables.length, 1);
        let firstVariable = <LexicalVariableSyntaxNode>variables[0];
        assert.strictEqual(firstVariable instanceof LexicalVariableSyntaxNode, true);
        assert.notStrictEqual(firstVariable.ampersand, null);
        Test.assertSyntaxToken(firstVariable.variable, text, TokenKind.Variable, '$a');
        assert.strictEqual(closure.returnType, null);
      }),
      new ParserTestArgs('function() use($a, $b) {};', 'should parse a closure with multiple lexical variables', (statements, text) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <AnonymousFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof AnonymousFunctionSyntaxNode, true);
        assert.strictEqual(closure.staticKeyword, null);
        assert.strictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        let useClause = <ClosureUseSyntaxNode>closure.useClause;
        assert.strictEqual(useClause instanceof ClosureUseSyntaxNode, true);
        let variables = useClause.variables ? useClause.variables.childNodes() : [];
        assert.strictEqual(variables.length, 2);
        let firstVariable = <LexicalVariableSyntaxNode>variables[0];
        assert.strictEqual(firstVariable instanceof LexicalVariableSyntaxNode, true);
        Test.assertSyntaxToken(firstVariable.variable, text, TokenKind.Variable, '$a');
        let secondVariable = <LexicalVariableSyntaxNode>variables[1];
        assert.strictEqual(secondVariable instanceof LexicalVariableSyntaxNode, true);
        Test.assertSyntaxToken(secondVariable.variable, text, TokenKind.Variable, '$b');
        assert.strictEqual(closure.returnType, null);
      }),
      new ParserTestArgs('function() use($a): A {};', 'should parse a closure with lexical variable and return type', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <AnonymousFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof AnonymousFunctionSyntaxNode, true);
        assert.strictEqual(closure.staticKeyword, null);
        assert.strictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        let useClause = <ClosureUseSyntaxNode>closure.useClause;
        assert.strictEqual(useClause instanceof ClosureUseSyntaxNode, true);
        let variables = useClause.variables ? useClause.variables.childNodes() : [];
        assert.strictEqual(variables.length, 1);
        assert.strictEqual(variables[0] instanceof LexicalVariableSyntaxNode, true);
        assert.notStrictEqual(closure.returnType, null);
      }),
      new ParserTestArgs('function &() {};', 'should parse a byref closure', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <AnonymousFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof AnonymousFunctionSyntaxNode, true);
        assert.strictEqual(closure.staticKeyword, null);
        assert.notStrictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        assert.strictEqual(closure.useClause, null);
        assert.strictEqual(closure.returnType, null);
      }),
      new ParserTestArgs('static function() {};', 'should parse a static closure', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <AnonymousFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof AnonymousFunctionSyntaxNode, true);
        assert.notStrictEqual(closure.staticKeyword, null);
        assert.strictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        assert.strictEqual(closure.useClause, null);
        assert.strictEqual(closure.returnType, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let syntaxTests7_1 = [
      new ParserTestArgs('function(): ? A {};', 'should parse a closure with nullable return type', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <AnonymousFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof AnonymousFunctionSyntaxNode, true);
        assert.strictEqual(closure.staticKeyword, null);
        assert.strictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        assert.strictEqual(closure.useClause, null);
        let returnType = <NamedTypeSyntaxNode>closure.returnType;
        assert.strictEqual(returnType instanceof NamedTypeSyntaxNode, true, 'NamedTypeSyntaxNode');
        assert.notStrictEqual(returnType.question, null);
        assert.strictEqual(returnType.typeName instanceof PartiallyQualifiedNameSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests7_1, PhpVersion.PHP7_1);

    // NOTE: See function-declaration for 'function' and 'function &' diagnostics.
    // NOTE: See static-declaration for 'static' diagnostics.
    let diagnosticTests = [
      new DiagnosticTestArgs('function()', 'missing colon, open brace, or use', [ErrorCode.ERR_IncompleteClosure], [10]),
      new DiagnosticTestArgs('function():', 'missing type', [ErrorCode.ERR_TypeExpected], [11]),
      new DiagnosticTestArgs('function() use', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [14]),
      new DiagnosticTestArgs('function() use(', 'missing ampersand or variable', [ErrorCode.ERR_VariableOrAmpersandExpected], [15]),
      new DiagnosticTestArgs('function() use($', 'missing variable name', [ErrorCode.ERR_VariableNameExpected], [15]),
      new DiagnosticTestArgs('function() use(&', 'missing variable', [ErrorCode.ERR_VariableExpected], [16]),
      new DiagnosticTestArgs('function() use($a', 'missing comma or close paren', [ErrorCode.ERR_CommaOrCloseParenExpected], [17]),
      new DiagnosticTestArgs('function() use($a)', 'missing colon or open brace', [ErrorCode.ERR_OpenBraceOrColonExpected], [18]),
      new DiagnosticTestArgs('function() use($a):', 'missing type (after lexical variables)', [ErrorCode.ERR_TypeExpected], [19]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('arrow-function-creation', function() {
    let syntaxTests = [
      new ParserTestArgs('fn() => $a;', 'should parse an arrow function', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <ArrowFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof ArrowFunctionSyntaxNode, true);
        assert.strictEqual(closure.staticKeyword, null);
        assert.strictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        assert.strictEqual(closure.returnType, null);
        assert.strictEqual(closure.expression instanceof LocalVariableSyntaxNode, true);
      }),
      new ParserTestArgs('fn(): A => $a;', 'should parse an arrow function with return type', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <ArrowFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof ArrowFunctionSyntaxNode, true);
        assert.strictEqual(closure.staticKeyword, null);
        assert.strictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        assert.notStrictEqual(closure.returnType, null);
        assert.strictEqual(closure.expression instanceof LocalVariableSyntaxNode, true);
      }),
      new ParserTestArgs('fn &() => $a;', 'should parse a byref arrow function', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <ArrowFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof ArrowFunctionSyntaxNode, true);
        assert.strictEqual(closure.staticKeyword, null);
        assert.notStrictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        assert.strictEqual(closure.returnType, null);
        assert.strictEqual(closure.expression instanceof LocalVariableSyntaxNode, true);
      }),
      new ParserTestArgs('static fn() => $a;', 'should parse a static arrow function', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let closure = <ArrowFunctionSyntaxNode>exprNode.expression;
        assert.strictEqual(closure instanceof ArrowFunctionSyntaxNode, true);
        assert.notStrictEqual(closure.staticKeyword, null);
        assert.strictEqual(closure.ampersand, null);
        assert.strictEqual(closure.parameters, null);
        assert.strictEqual(closure.returnType, null);
        assert.strictEqual(closure.expression instanceof LocalVariableSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests, PhpVersion.PHP7_4);

    let diagnosticTests = [
      new DiagnosticTestArgs('fn', 'missing ampersand or open paren', [ErrorCode.ERR_IncompleteArrowFunction], [2]),
      new DiagnosticTestArgs('fn()', 'missing colon or double arrow', [ErrorCode.ERR_ColonOrDoubleArrowExpected], [4]),
      new DiagnosticTestArgs('fn() =>', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [7]),
      new DiagnosticTestArgs('fn():', 'missing type', [ErrorCode.ERR_TypeExpected], [5]),
      new DiagnosticTestArgs('fn(): A', 'missing double arrow', [ErrorCode.ERR_Syntax], [7]),
      new DiagnosticTestArgs('fn(): A =>', 'missing expression (after type)', [ErrorCode.ERR_ExpressionExpectedEOF], [10]),
    ];
    Test.assertDiagnostics(diagnosticTests, PhpVersion.PHP7_4);
  });

  describe('object-creation-expression (new-expression)', function() {
    let syntaxTests = [
      // class-name-reference (name, static, or new-variable)
      new ParserTestArgs('new A;', 'should parse an object creation expression', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let newNode = <NamedObjectCreationSyntaxNode>exprNode.expression;
        assert.strictEqual(newNode instanceof NamedObjectCreationSyntaxNode, true);
        assert.strictEqual(newNode.className instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(newNode.argumentList, null);
      }),
      new ParserTestArgs('new \\A;', 'should parse an object creation expression with a fully qualified name', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let newNode = <NamedObjectCreationSyntaxNode>exprNode.expression;
        assert.strictEqual(newNode instanceof NamedObjectCreationSyntaxNode, true);
        assert.strictEqual(newNode.className instanceof FullyQualifiedNameSyntaxNode, true);
        assert.strictEqual(newNode.argumentList, null);
      }),
      new ParserTestArgs('new namespace\\A;', 'should parse an object creation expression with a relative name', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let newNode = <NamedObjectCreationSyntaxNode>exprNode.expression;
        assert.strictEqual(newNode instanceof NamedObjectCreationSyntaxNode, true);
        assert.strictEqual(newNode.className instanceof RelativeNameSyntaxNode, true);
        assert.strictEqual(newNode.argumentList, null);
      }),
      new ParserTestArgs('new static;', 'should parse an object creation expression with a static binding', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let newNode = <NamedObjectCreationSyntaxNode>exprNode.expression;
        assert.strictEqual(newNode instanceof NamedObjectCreationSyntaxNode, true);
        assert.strictEqual(newNode.className instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(newNode.argumentList, null);
      }),
      new ParserTestArgs('new $a;', 'should parse an object creation expression with a class name reference', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let newNode = <IndirectObjectCreationSyntaxNode>exprNode.expression;
        assert.strictEqual(newNode instanceof IndirectObjectCreationSyntaxNode, true);
        assert.strictEqual(newNode.classNameReference instanceof LocalVariableSyntaxNode, true);
        assert.strictEqual(newNode.argumentList, null);
      }),

      new ParserTestArgs('new A();', 'should parse an object creation expression with an arguments', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let newNode = <NamedObjectCreationSyntaxNode>exprNode.expression;
        assert.strictEqual(newNode instanceof NamedObjectCreationSyntaxNode, true);
        assert.strictEqual(newNode.className instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(newNode.argumentList, null);
      }),
      new ParserTestArgs('new \\A();', 'should parse an object creation expression with a fully qualified name and arguments', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let newNode = <NamedObjectCreationSyntaxNode>exprNode.expression;
        assert.strictEqual(newNode instanceof NamedObjectCreationSyntaxNode, true);
        assert.strictEqual(newNode.className instanceof FullyQualifiedNameSyntaxNode, true);
        assert.strictEqual(newNode.argumentList, null);
      }),
      new ParserTestArgs('new namespace\\A();', 'should parse an object creation expression with a relative name and arguments', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let newNode = <NamedObjectCreationSyntaxNode>exprNode.expression;
        assert.strictEqual(newNode instanceof NamedObjectCreationSyntaxNode, true);
        assert.strictEqual(newNode.className instanceof RelativeNameSyntaxNode, true);
        assert.strictEqual(newNode.argumentList, null);
      }),
      new ParserTestArgs('new static();', 'should parse an object creation expression with a static binding and arguments', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let newNode = <NamedObjectCreationSyntaxNode>exprNode.expression;
        assert.strictEqual(newNode instanceof NamedObjectCreationSyntaxNode, true);
        assert.strictEqual(newNode.className instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(newNode.argumentList, null);
      }),
      new ParserTestArgs('new $a();', 'should parse an object creation expression with a class name reference and arguments', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let newNode = <IndirectObjectCreationSyntaxNode>exprNode.expression;
        assert.strictEqual(newNode instanceof IndirectObjectCreationSyntaxNode, true);
        assert.strictEqual(newNode.classNameReference instanceof LocalVariableSyntaxNode, true);
        assert.strictEqual(newNode.argumentList, null);
      }),

      // anonymous-class
      new ParserTestArgs('new class {};', 'should parse a new object expression using an anonymous class', (statements) => {
        let classDecl = assertAnonymousClassDeclaration(statements, false, false);
        assert.strictEqual(classDecl.interfaces, null);
        assert.strictEqual(classDecl.members, null);
      }),
      new ParserTestArgs('new class extends A {};', 'should parse a new object expression using an anonymous class with a base clause', (statements) => {
        let classDecl = assertAnonymousClassDeclaration(statements, false, true);
        assert.strictEqual(classDecl.interfaces, null);
        assert.strictEqual(classDecl.members, null);
      }),
      new ParserTestArgs('new class extends A implements B {};', 'should parse a new object expression using an anonymous class with a base clause and interface', (statements) => {
        let classDecl = assertAnonymousClassDeclaration(statements, false, true);
        let interfaces = classDecl.interfaces ? classDecl.interfaces.childNodes() : [];
        assert.strictEqual(interfaces.length, 1);
        assert.strictEqual(interfaces[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(classDecl.members, null);
      }),
      new ParserTestArgs('new class implements A {};', 'should parse a new object expression using an anonymous class with an interface', (statements) => {
        let classDecl = assertAnonymousClassDeclaration(statements, false, false);
        let interfaces = classDecl.interfaces ? classDecl.interfaces.childNodes() : [];
        assert.strictEqual(interfaces.length, 1);
        assert.strictEqual(interfaces[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(classDecl.members, null);
      }),
      new ParserTestArgs('new class implements A, B {};', 'should parse a new object expression using an anonymous class with multiple interfaces', (statements) => {
        let classDecl = assertAnonymousClassDeclaration(statements, false, false);
        let interfaces = classDecl.interfaces ? classDecl.interfaces.childNodes() : [];
        assert.strictEqual(interfaces.length, 2);
        assert.strictEqual(interfaces[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(interfaces[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(classDecl.members, null);
      }),

      new ParserTestArgs('new class() {};', 'should parse a new object expression using an anonymous class with arguments', (statements) => {
        let classDecl = assertAnonymousClassDeclaration(statements, true, false);
        assert.strictEqual(classDecl.interfaces, null);
        assert.strictEqual(classDecl.members, null);
      }),
      new ParserTestArgs('new class() extends A {};', 'should parse a new object expression using an anonymous class with arguments and a base clause', (statements) => {
        let classDecl = assertAnonymousClassDeclaration(statements, true, true);
        assert.strictEqual(classDecl.interfaces, null);
        assert.strictEqual(classDecl.members, null);
      }),
      new ParserTestArgs('new class() extends A implements B {};', 'should parse a new object expression using an anonymous class with arguments, a base clause, and interface', (statements) => {
        let classDecl = assertAnonymousClassDeclaration(statements, true, true);
        let interfaces = classDecl.interfaces ? classDecl.interfaces.childNodes() : [];
        assert.strictEqual(interfaces.length, 1);
        assert.strictEqual(interfaces[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(classDecl.members, null);
      }),
      new ParserTestArgs('new class() implements A {};', 'should parse a new object expression using an anonymous class with arguments and an interface', (statements) => {
        let classDecl = assertAnonymousClassDeclaration(statements, true, false);
        let interfaces = classDecl.interfaces ? classDecl.interfaces.childNodes() : [];
        assert.strictEqual(interfaces.length, 1);
        assert.strictEqual(interfaces[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(classDecl.members, null);
      }),
      new ParserTestArgs('new class() implements A, B {};', 'should parse a new object expression using an anonymous class with arguments and multiple interfaces', (statements) => {
        let classDecl = assertAnonymousClassDeclaration(statements, true, false);
        let interfaces = classDecl.interfaces ? classDecl.interfaces.childNodes() : [];
        assert.strictEqual(interfaces.length, 2);
        assert.strictEqual(interfaces[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(interfaces[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(classDecl.members, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('new', 'missing class, name, static, or simple-variable', [ErrorCode.ERR_ClassNameOrReferenceExpected], [3]),
      // NOTE: This expression is valid, an improved message is optional.
      new DiagnosticTestArgs('new A', 'missing open paren or semicolon', [ErrorCode.ERR_SemicolonExpected], [5]),
      new DiagnosticTestArgs('new class', 'missing extends, implements, open paren, or open brace', [ErrorCode.ERR_IncompleteAnonymousClassDeclaration], [9]),
      new DiagnosticTestArgs('new class {', 'missing close brace or class member', [ErrorCode.ERR_CloseBraceExpected], [11]),
      new DiagnosticTestArgs('new class extends', 'missing name', [ErrorCode.ERR_TypeExpected], [17]),
      new DiagnosticTestArgs('new class implements', 'missing name', [ErrorCode.ERR_TypeExpected], [20]),
      new DiagnosticTestArgs('new class (', 'missing argument or close paren', [ErrorCode.ERR_ExpressionOrCloseParenExpected], [11]),
      new DiagnosticTestArgs('new class ()', 'missing extends, implements, or open brace', [ErrorCode.ERR_IncompleteClassDeclaration], [12]),
    ];
    Test.assertDiagnostics(diagnosticTests);

    let deprecatedBraceSyntax = [
      new DiagnosticTestArgs('new $a{0};', 'should warn if brace syntax is used for class name reference', [ErrorCode.WRN_ElementAccessBraceSyntax], [6]),
    ];
    Test.assertDiagnostics(deprecatedBraceSyntax, PhpVersion.PHP7_0, PhpVersion.PHP7_4);
  });

  describe('array-creation-expression', function() {
    let syntaxTests = [
      new ParserTestArgs('array();', 'should parse an array creation expression', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        assert.strictEqual(arrayNode.initializerList, null);
      }),

      // Values only.
      new ParserTestArgs('array($a);', 'should parse an array creation expression with value', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], false, null);
      }),
      new ParserTestArgs('array(&$a);', 'should parse an array creation expression with value (byref)', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], false, TokenKind.Ampersand);
      }),
      new ParserTestArgs('array($a, $b);', 'should parse an array creation expression with multiple values', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 2);
        assertArrayElement(elements[0], false, null);
        assertArrayElement(elements[1], false, null);
      }),
      new ParserTestArgs('array($a,);', 'should parse an array creation expression with trailing comma', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], false, null);
      }),

      // Key-value pairs.
      new ParserTestArgs('array(1 => $a);', 'should parse an array creation expression with key-value pair', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], true, null);
      }),
      new ParserTestArgs('array(1 => &$a);', 'should parse an array creation expression with key-value pair (byref value)', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], true, TokenKind.Ampersand);
      }),
      new ParserTestArgs('array(1 => $a, 2 => $b);', 'should parse an array creation expression with multiple key-value pairs', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 2);
        assertArrayElement(elements[0], true, null);
        assertArrayElement(elements[1], true, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let syntaxTests7_4 = [
      new ParserTestArgs('array(...$a);', 'should parse an array creation expression with spread value', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], false, TokenKind.Ellipsis);
      }),
      new ParserTestArgs('array(...$a, ...$b);', 'should parse an array creation expression with multiple spread values', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 2);
        assertArrayElement(elements[0], false, TokenKind.Ellipsis);
        assertArrayElement(elements[1], false, TokenKind.Ellipsis);
      }),
      new ParserTestArgs('array(...$a, $b);', 'should parse an array creation expression with value after spread value', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 2);
        assertArrayElement(elements[0], false, TokenKind.Ellipsis);
        assertArrayElement(elements[1], false, null);
      }),
      new ParserTestArgs('array($a, ...$b);', 'should parse an array creation expression with value before spread value', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 2);
        assertArrayElement(elements[0], false, null);
        assertArrayElement(elements[1], false, TokenKind.Ellipsis);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests7_4, PhpVersion.PHP7_4);

    let diagnosticTests = [
      new DiagnosticTestArgs('array', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [5]),
      new DiagnosticTestArgs('array(', 'missing expression or close paren', [ErrorCode.ERR_ExpressionOrCloseParenExpected], [6]),
      new DiagnosticTestArgs('array(1', 'missing comma, close paren, or double arrow', [ErrorCode.ERR_CloseParenExpected], [7]),  // Exempt.
      new DiagnosticTestArgs('array(1,', 'missing expression or close paren (in list)', [ErrorCode.ERR_ExpressionOrCloseParenExpected], [8]),
      new DiagnosticTestArgs('array(&1);', 'should expect explicit byref value', [ErrorCode.ERR_ExpressionNotAddressable], [7]),

      // @todo Recovery tests.
      new DiagnosticTestArgs('array(&$a => $b);', 'should not parse an array with byref key', [ErrorCode.ERR_Syntax, ErrorCode.ERR_UnexpectedToken], [12, 10]),
      // @todo Disabled. Allowed for list destructuring (uses same code as []-syntax).
      // new DiagnosticTestArgs('array(,$a);', 'should not parse an array with missing element', [ErrorCode.ERR_ExpressionExpected], [6]),
    ];
    Test.assertDiagnostics(diagnosticTests);

    let diagnosticTests7_4 = [
      new DiagnosticTestArgs('array(...', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [9]),
    ];
    Test.assertDiagnostics(diagnosticTests7_4, PhpVersion.PHP7_4);

    let featureSpreadOperator = [
      new DiagnosticTestArgs('array(...$a);', 'should not parse an array with unpacked value', [ErrorCode.ERR_FeatureSpreadOperatorInArrays], [6]),
    ];
    Test.assertDiagnostics(featureSpreadOperator, PhpVersion.PHP7_0, PhpVersion.PHP7_3);
  });

  describe('array-creation-expression (short-syntax)', function() {
    let syntaxTests = [
      new ParserTestArgs('[];', 'should parse an array creation expression', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        assert.strictEqual(arrayNode.initializerList, null);
      }),

      // Values only.
      new ParserTestArgs('[$a];', 'should parse an array creation expression with value', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], false, null);
      }),
      new ParserTestArgs('[&$a];', 'should parse an array creation expression with value (byref)', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], false, TokenKind.Ampersand);
      }),
      new ParserTestArgs('[$a, $b];', 'should parse an array creation expression with multiple values', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 2);
        assertArrayElement(elements[0], false, null);
        assertArrayElement(elements[1], false, null);
      }),
      new ParserTestArgs('[$a,];', 'should parse an array creation expression with trailing comma', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], false, null);
      }),

      // Key-value pairs.
      new ParserTestArgs('[1 => $a];', 'should parse an array creation expression with key-value pair', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], true, null);
      }),
      new ParserTestArgs('[1 => &$a];', 'should parse an array creation expression with key-value pair (byref)', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], true, TokenKind.Ampersand);
      }),
      new ParserTestArgs('[1 => $a, 2 => $b];', 'should parse an array creation expression with multiple key-value pairs', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 2);
        assertArrayElement(elements[0], true, null);
        assertArrayElement(elements[1], true, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let syntaxTests7_4 = [
      new ParserTestArgs('[...$a];', 'should parse an array creation expression with spread value', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 1);
        assertArrayElement(elements[0], false, TokenKind.Ellipsis);
      }),
      new ParserTestArgs('[...$a, ...$b];', 'should parse an array creation expression with multiple spread values', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 2);
        assertArrayElement(elements[0], false, TokenKind.Ellipsis);
        assertArrayElement(elements[1], false, TokenKind.Ellipsis);
      }),
      new ParserTestArgs('[...$a, $b];', 'should parse an array creation expression with value after spread value', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 2);
        assertArrayElement(elements[0], false, TokenKind.Ellipsis);
        assertArrayElement(elements[1], false, null);
      }),
      new ParserTestArgs('[$a, ...$b];', 'should parse an array creation expression with value before spread value', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let arrayNode = <ArraySyntaxNode>exprNode.expression;
        assert.strictEqual(arrayNode instanceof ArraySyntaxNode, true);
        let elements = arrayNode.initializerList ? arrayNode.initializerList.childNodes() : [];
        assert.strictEqual(elements.length, 2);
        assertArrayElement(elements[0], false, null);
        assertArrayElement(elements[1], false, TokenKind.Ellipsis);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests7_4, PhpVersion.PHP7_4);

    // NOTE: See array-creation-expression for array element tests.
    let diagnosticTests = [
      new DiagnosticTestArgs('[', 'missing list deconstruction element, expression, or close bracket', [ErrorCode.ERR_IncompleteArrayOrDestructure], [1]),
      new DiagnosticTestArgs('[1', 'missing comma, close bracket, or double arrow', [ErrorCode.ERR_CloseBracketExpected], [2]), // Exempt.
      new DiagnosticTestArgs('[1,', 'missing list deconstruction element, expression, or close bracket (in list)', [ErrorCode.ERR_IncompleteArrayOrDestructure], [3]),

      // This could be a bad array initializer or a good destructuring
      // assignment. There is no way to tell until a ']' is parsed, so don't
      // jump to any conclusions by adding `ERR_DeconstructVariableMissing`.
      new DiagnosticTestArgs('[,', 'should not parse as a destructuring assignment if expression is missing', [ErrorCode.ERR_IncompleteArrayOrDestructure], [2]),
    ];
    Test.assertDiagnostics(diagnosticTests);

    let diagnosticTests7_4 = [
      new DiagnosticTestArgs('[...', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [4]),
    ];
    Test.assertDiagnostics(diagnosticTests7_4, PhpVersion.PHP7_4);

    let featureSpreadOperator = [
      new DiagnosticTestArgs('[...$a];', 'should not parse an array with unpacked value', [ErrorCode.ERR_FeatureSpreadOperatorInArrays], [1]),
    ];
    Test.assertDiagnostics(featureSpreadOperator, PhpVersion.PHP7_0, PhpVersion.PHP7_3);
  });

  describe('unary-expression', function() {

    describe('prefix-decrement / prefix-increment', function() {
      let syntaxTests = [
        new ParserTestArgs('--$i;', 'should parse a prefix decrement expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let unaryNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(unaryNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(unaryNode.operator, text, TokenKind.Decrement, '--');
        }),
        new ParserTestArgs('++$i;', 'should parse a prefix increment expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let unaryNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(unaryNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(unaryNode.operator, text, TokenKind.Increment, '++');
        })
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('--', 'missing expression (decrement)', [ErrorCode.ERR_ExpressionExpectedEOF], [2]),
        new DiagnosticTestArgs('++', 'missing expression (increment)', [ErrorCode.ERR_ExpressionExpectedEOF], [2]),

        // @todo Recovery tests.
        new DiagnosticTestArgs('----$a;', 'should parse an explicit operand (prefix-decrement)', [ErrorCode.ERR_ExpressionExpected, ErrorCode.ERR_SemicolonExpected], [2, 2]),
        new DiagnosticTestArgs('++++$a;', 'should parse an explicit operand (prefix-increment)', [ErrorCode.ERR_ExpressionExpected, ErrorCode.ERR_SemicolonExpected], [2, 2]),
        new DiagnosticTestArgs('--$a--;', 'should parse an explicit operand (postfix-decrement)', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_ExpressionExpected], [4, 6]),
        new DiagnosticTestArgs('++$a++;', 'should parse an explicit operand (postfix-increment)', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_ExpressionExpected], [4, 6]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('unary-arithmetic-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('-$a;', 'should parse a unary minus expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let unaryNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(unaryNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(unaryNode.operator, text, TokenKind.Minus, '-');
        }),
        new ParserTestArgs('+$a;', 'should parse a unary plus expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let unaryNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(unaryNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(unaryNode.operator, text, TokenKind.Plus, '+');
        }),
        new ParserTestArgs('~$a;', 'should parse a bitwise not expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let unaryNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(unaryNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(unaryNode.operator, text, TokenKind.Tilde, '~');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('-', 'missing expression (unary minus)', [ErrorCode.ERR_ExpressionExpectedEOF], [1]),
        new DiagnosticTestArgs('+', 'missing expression (unary plus)', [ErrorCode.ERR_ExpressionExpectedEOF], [1]),
        new DiagnosticTestArgs('~', 'missing expression (bitwise not)', [ErrorCode.ERR_ExpressionExpectedEOF], [1]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('error-control-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('@require("a");', 'should parse an error control expression', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let errorControl = <ErrorControlSyntaxNode>exprNode.expression;
          assert.strictEqual(errorControl instanceof ErrorControlSyntaxNode, true);
          assert.strictEqual(errorControl.expression instanceof ScriptInclusionSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('@', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [1]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('cast-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('(array)$a;', 'should parse an array cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.ArrayCast, '(array)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('(binary)$a;', 'should parse a binary cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.BinaryCast, '(binary)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('(bool)$a;', 'should parse a bool cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.BoolCast, '(bool)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('(boolean)$a;', 'should parse a boolean cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.BooleanCast, '(boolean)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('(double)$a;', 'should parse a double cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.DoubleCast, '(double)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('(float)$a;', 'should parse a float cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.FloatCast, '(float)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('(int)$a;', 'should parse an int cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.IntCast, '(int)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('(integer)$a;', 'should parse an integer cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.IntegerCast, '(integer)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('(object)$a;', 'should parse an object cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.ObjectCast, '(object)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('(real)$a;', 'should parse a real cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.RealCast, '(real)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('(string)$a;', 'should parse a string cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.StringCast, '(string)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('(unset)$a;', 'should parse an unset cast', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let castNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(castNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(castNode.operator, text, TokenKind.UnsetCast, '(unset)');
          assert.strictEqual(castNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('(array)', 'missing expression (array)', [ErrorCode.ERR_ExpressionExpectedEOF], [7]),
        new DiagnosticTestArgs('(binary)', 'missing expression (binary)', [ErrorCode.ERR_ExpressionExpectedEOF], [8]),
        new DiagnosticTestArgs('(bool)', 'missing expression (bool)', [ErrorCode.ERR_ExpressionExpectedEOF], [6]),
        new DiagnosticTestArgs('(boolean)', 'missing expression (boolean)', [ErrorCode.ERR_ExpressionExpectedEOF], [9]),
        new DiagnosticTestArgs('(double)', 'missing expression (double)', [ErrorCode.ERR_ExpressionExpectedEOF], [8]),
        new DiagnosticTestArgs('(float)', 'missing expression (float)', [ErrorCode.ERR_ExpressionExpectedEOF], [7]),
        new DiagnosticTestArgs('(int)', 'missing expression (int)', [ErrorCode.ERR_ExpressionExpectedEOF], [5]),
        new DiagnosticTestArgs('(integer)', 'missing expression (integer)', [ErrorCode.ERR_ExpressionExpectedEOF], [9]),
        new DiagnosticTestArgs('(object)', 'missing expression (object)', [ErrorCode.ERR_ExpressionExpectedEOF], [8]),
        new DiagnosticTestArgs('(real)', 'missing expression (real)', [ErrorCode.WRN_RealCast, ErrorCode.ERR_ExpressionExpectedEOF], [0, 6]),
        new DiagnosticTestArgs('(string)', 'missing expression (string)', [ErrorCode.ERR_ExpressionExpectedEOF], [8]),
        new DiagnosticTestArgs('(unset)', 'missing expression (unset)', [ErrorCode.WRN_UnsetCast, ErrorCode.ERR_ExpressionExpectedEOF], [0, 7]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('logical-not-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('!$a;', 'should parse a logical not expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let unaryNode = <UnarySyntaxNode>exprNode.expression;
          assert.strictEqual(unaryNode instanceof UnarySyntaxNode, true);
          Test.assertSyntaxToken(unaryNode.operator, text, TokenKind.Exclamation, '!');
          assert.strictEqual(unaryNode.operand instanceof LocalVariableSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('!', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [1]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

  });

  describe('clone-expression', function() {
    let syntaxTests = [
      new ParserTestArgs('clone $a;', 'should parse a clone expression', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let cloneNode = <CloneSyntaxNode>exprNode.expression;
        assert.strictEqual(cloneNode instanceof CloneSyntaxNode, true);
        assert.strictEqual(cloneNode.expression instanceof LocalVariableSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('clone', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [5]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('yield-expression', function() {
    let syntaxTests = [
      new ParserTestArgs('yield;', 'should parse a yield expression', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let yieldNode = <YieldSyntaxNode>exprNode.expression;
        assert.strictEqual(yieldNode instanceof YieldSyntaxNode, true);
        assert.strictEqual(yieldNode.key, null);
        assert.strictEqual(yieldNode.value, null);
      }),
      new ParserTestArgs('yield 1;', 'should parse a yield expression with a value', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let yieldNode = <YieldSyntaxNode>exprNode.expression;
        assert.strictEqual(yieldNode instanceof YieldSyntaxNode, true);
        assert.strictEqual(yieldNode.key, null);
        assert.strictEqual(yieldNode.value instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('yield $a => 1;', 'should parse a yield expression with key and value', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let yieldNode = <YieldSyntaxNode>exprNode.expression;
        assert.strictEqual(yieldNode instanceof YieldSyntaxNode, true);
        assert.strictEqual(yieldNode.key instanceof LocalVariableSyntaxNode, true);
        assert.strictEqual(yieldNode.value instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('yield from $a;', 'should parse a yield from expression', (statements) => {
        let exprNode = <ExpressionStatementSyntaxNode>statements[0];
        assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
        let yieldFromNode = <YieldFromSyntaxNode>exprNode.expression;
        assert.strictEqual(yieldFromNode instanceof YieldFromSyntaxNode, true);
        assert.strictEqual(yieldFromNode.delegate instanceof LocalVariableSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('yield', 'missing expression or semicolon', [ErrorCode.ERR_SemicolonExpected], [5]),
      // NOTE: This expression is valid, an improved message is optional.
      new DiagnosticTestArgs('yield $a', 'missing double arrow or semicolon', [ErrorCode.ERR_SemicolonExpected], [8]),
      new DiagnosticTestArgs('yield $a =>', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [11]),
      new DiagnosticTestArgs('yield $a => 1', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [13]),
      new DiagnosticTestArgs('yield from', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [10]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('script-inclusion-expression', function() {

    describe('include / include_once', function() {
      let syntaxTests = [
        new ParserTestArgs('include "a";', 'should parse an include expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let inclusion = <ScriptInclusionSyntaxNode>exprNode.expression;
          Test.assertSyntaxToken(inclusion.inclusionKeyword, text, TokenKind.Include, 'include');
          assert.strictEqual(inclusion.expression instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('include_once "a";', 'should parse an include_once expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let inclusion = <ScriptInclusionSyntaxNode>exprNode.expression;
          Test.assertSyntaxToken(inclusion.inclusionKeyword, text, TokenKind.IncludeOnce, 'include_once');
          assert.strictEqual(inclusion.expression instanceof LiteralSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('include', 'missing expression (include)', [ErrorCode.ERR_ExpressionExpectedEOF], [7]),
        new DiagnosticTestArgs('include_once', 'missing expression (include_once)', [ErrorCode.ERR_ExpressionExpectedEOF], [12]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('require / require_once', function() {
      let syntaxTests = [
        new ParserTestArgs('require "a";', 'should parse a require expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let inclusion = <ScriptInclusionSyntaxNode>exprNode.expression;
          Test.assertSyntaxToken(inclusion.inclusionKeyword, text, TokenKind.Require, 'require');
          assert.strictEqual(inclusion.expression instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('require_once "a";', 'should parse a require_once expression', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let inclusion = <ScriptInclusionSyntaxNode>exprNode.expression;
          Test.assertSyntaxToken(inclusion.inclusionKeyword, text, TokenKind.RequireOnce, 'require_once');
          assert.strictEqual(inclusion.expression instanceof LiteralSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('require', 'missing expression (require)', [ErrorCode.ERR_ExpressionExpectedEOF], [7]),
        new DiagnosticTestArgs('require_once', 'missing expression (require_once)', [ErrorCode.ERR_ExpressionExpectedEOF], [12]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('eval', function() {
      let syntaxTests = [
        new ParserTestArgs('eval("exit;");', 'should parse an eval expression', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.strictEqual(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let evalNode = <EvalIntrinsicSyntaxNode>exprNode.expression;
          assert.strictEqual(evalNode instanceof EvalIntrinsicSyntaxNode, true);
          assert.strictEqual(evalNode.expression instanceof LiteralSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('eval', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [4]),
        new DiagnosticTestArgs('eval(', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [5]),
        new DiagnosticTestArgs('eval($a', 'missing close paren', [ErrorCode.ERR_CloseParenExpected], [7]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

  });

});
