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
  ArraySyntaxNode,
  ClassConstantSyntaxNode,
  ConstantSyntaxNode,
  ElementAccessSyntaxNode,
  ExpressionGroupSyntaxNode,
  ExpressionStatementSyntaxNode,
  FunctionInvocationSyntaxNode,
  IndirectMemberAccessSyntaxNode,
  IndirectScopedInvocationSyntaxNode,
  IndirectVariableSyntaxNode,
  LiteralSyntaxNode,
  LocalVariableSyntaxNode,
  NamedMemberAccessSyntaxNode,
  NamedMethodInvocationSyntaxNode,
  NamedScopedInvocationSyntaxNode,
  PartiallyQualifiedNameSyntaxNode,
  PostfixUnarySyntaxNode,
  StaticPropertySyntaxNode,
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { ISyntaxNode } from '../../../src/language/syntax/ISyntaxNode';
import { TokenKind } from '../../../src/language/TokenKind';

function assertClassConstant(statements: ISyntaxNode[], text: string, name: string): ClassConstantSyntaxNode {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let scopedAccess = <ClassConstantSyntaxNode>exprNode.expression;
  assert.equal(scopedAccess instanceof ClassConstantSyntaxNode, true, 'ClassConstantSyntaxNode');
  Test.assertSyntaxToken(scopedAccess.identifier, text, TokenKind.Identifier, name);
  return scopedAccess;
}

function assertElementAccess(statements: ISyntaxNode[], hasOffset: boolean): ElementAccessSyntaxNode {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let elementAccess = <ElementAccessSyntaxNode>exprNode.expression;
  assert.equal(elementAccess instanceof ElementAccessSyntaxNode, true, 'ElementAccessSyntaxNode');
  if (hasOffset) {
    assert.equal(elementAccess.index instanceof LiteralSyntaxNode, true, 'LiteralSyntaxNode');
  }
  else {
    assert.strictEqual(elementAccess.index, null);
  }
  return elementAccess;
}

function assertFunctionInvocation(statements: ISyntaxNode[]): FunctionInvocationSyntaxNode {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let invocation = <FunctionInvocationSyntaxNode>exprNode.expression;
  assert.equal(invocation instanceof FunctionInvocationSyntaxNode, true, 'FunctionInvocationSyntaxNode');
  return invocation;
}

function assertIndirectMemberAccess(statements: ISyntaxNode[]): IndirectMemberAccessSyntaxNode {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let memberAccess = <IndirectMemberAccessSyntaxNode>exprNode.expression;
  assert.equal(memberAccess instanceof IndirectMemberAccessSyntaxNode, true, 'IndirectMemberAccessSyntaxNode');
  assert.equal(memberAccess.member instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
  return memberAccess;
}

function assertNamedMemberAccess(statements: ISyntaxNode[], text: string, name: string): NamedMemberAccessSyntaxNode {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let memberAccess = <NamedMemberAccessSyntaxNode>exprNode.expression;
  assert.equal(memberAccess instanceof NamedMemberAccessSyntaxNode, true, 'NamedMemberAccessSyntaxNode');
  Test.assertSyntaxToken(memberAccess.member, text, TokenKind.Identifier, name);
  return memberAccess;
}

function assertStaticProperty(statements: ISyntaxNode[]): StaticPropertySyntaxNode {
  let exprNode = <ExpressionStatementSyntaxNode>statements[0];
  assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
  let scopedAccess = <StaticPropertySyntaxNode>exprNode.expression;
  assert.equal(scopedAccess instanceof StaticPropertySyntaxNode, true, 'StaticPropertySyntaxNode');
  assert.equal(scopedAccess.member instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
  return scopedAccess;
}

// @todo Add partially qualfied and relative name tests.

describe('PhpParser', function() {

  describe('postfix-expression', function() {

    describe('postfix-decrement / postfix-increment', function() {
      let syntaxTests = [
        new ParserTestArgs('$i--;', 'postfix decrement', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let unary = <PostfixUnarySyntaxNode>exprNode.expression;
          assert.equal(unary instanceof PostfixUnarySyntaxNode, true, 'PostfixUnarySyntaxNode');
          assert.equal(unary.operand instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
          Test.assertSyntaxToken(unary.operator, text, TokenKind.Decrement, '--');
        }),
        new ParserTestArgs('$i++;', 'postfix increment', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let unary = <PostfixUnarySyntaxNode>exprNode.expression;
          assert.equal(unary instanceof PostfixUnarySyntaxNode, true, 'PostfixUnarySyntaxNode');
          assert.equal(unary.operand instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
          Test.assertSyntaxToken(unary.operator, text, TokenKind.Increment, '++');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      // let diagnosticsTests = [
      //   new DiagnosticTestArgs('$i----;', 'should expect explicit operand (decrement)', [ErrorCode.ERR_ExpressionNotAddressable], [0]),
      //   new DiagnosticTestArgs('$i++++;', 'should expect explicit operand (increment)', [ErrorCode.ERR_ExpressionNotAddressable], [0]),
      // ];
      // Test.assertDiagnostics(diagnosticsTests);
    });

    describe('element-access-expression', function() {
      let syntaxTests = [
        // Variables.
        new ParserTestArgs('$a[0];', 'element access of a variable', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('$$a[0];', 'element access of a variable with variable name', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof IndirectVariableSyntaxNode, true);
        }),
        new ParserTestArgs('${A}[0];', 'element access of a variable with expression name', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof IndirectVariableSyntaxNode, true);
        }),
        // Arrays and strings (dereferenceable-scalar).
        // NOTE: An index expression is required.
        new ParserTestArgs('array("a","b")[0];', 'element access of an array literal', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof ArraySyntaxNode, true);
        }),
        new ParserTestArgs('["a","b"][0];', 'element access of an array literal (short syntax)', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof ArraySyntaxNode, true);
        }),
        new ParserTestArgs('"ab"[0];', 'element access of a string literal', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof LiteralSyntaxNode, true);
        }),
        // Expression group.
        new ParserTestArgs('($a)[0];', 'element access of an expression group', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof ExpressionGroupSyntaxNode, true);
        }),
        // Invocation.
        new ParserTestArgs('a()[0];', 'element access of a function invocation', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof FunctionInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('A::b()[0];', 'element access of a static method invocation', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a::b()[0];', 'element access of a static method invocation with class name reference', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a->b()[0];', 'element access of a method invocation', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof NamedMethodInvocationSyntaxNode, true);
        }),
        // Name.
        new ParserTestArgs('A[0];', 'element access of a constant', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof ConstantSyntaxNode, true);
        }),
        // Object access.
        new ParserTestArgs('$a->b[0];', 'element access of a property', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof NamedMemberAccessSyntaxNode, true);
        }),
        // Scoped access.
        new ParserTestArgs('A::$b[0];', 'element access of a static property', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof StaticPropertySyntaxNode, true);
        }),
        new ParserTestArgs('A::B[0];', 'element access of a class constant', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof ClassConstantSyntaxNode, true);
        }),
        // Self.
        new ParserTestArgs('$a[0][0];', 'element access of an element access expression', (statements) => {
          let accessNode = assertElementAccess(statements, true);
          assert.equal(accessNode.dereferencable instanceof ElementAccessSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticsTests = [
        new DiagnosticTestArgs('<<<LABEL\nLABEL\n[0];', 'should not parse element access of heredoc template', [ErrorCode.ERR_SemicolonExpected], [14]),
        new DiagnosticTestArgs('`$a`[0];', 'should not parse element access of shell command template', [ErrorCode.ERR_SemicolonExpected], [4]),
        new DiagnosticTestArgs('"$a"[0];', 'should not parse element access of string template', [ErrorCode.ERR_SemicolonExpected], [4]),
      ];
      Test.assertDiagnostics(diagnosticsTests);
    });

    describe('element-access-expression (without index)', function() {
      let syntaxTests = [
        // Variables.
        new ParserTestArgs('$a[];', 'element access of a variable', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
        }),
        new ParserTestArgs('$$a[];', 'element access of a variable with variable name', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof IndirectVariableSyntaxNode, true);
        }),
        new ParserTestArgs('${A}[];', 'element access of a variable with expression name', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof IndirectVariableSyntaxNode, true);
        }),
        new ParserTestArgs('array("a","b")[];', 'element access of an array literal', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof ArraySyntaxNode, true);
        }),
        new ParserTestArgs('["a","b"][];', 'element access of an array literal (short syntax)', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof ArraySyntaxNode, true);
        }),
        new ParserTestArgs('"ab"[];', 'element access of string literal', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof LiteralSyntaxNode, true);
        }),
        // Expression group.
        new ParserTestArgs('($a)[];', 'element access of an expression group', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof ExpressionGroupSyntaxNode, true);
        }),
        // Invocation
        new ParserTestArgs('a()[];', 'element access of a function invocation', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof FunctionInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('A::b()[];', 'element access of a static method invocation', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a::b()[];', 'element access of a static method invocation with class name reference', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a->b()[];', 'element access of a method invocation', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof NamedMethodInvocationSyntaxNode, true);
        }),
        // Name.
        new ParserTestArgs('A[];', 'element access of a constant', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof ConstantSyntaxNode, true);
        }),
        // Object access.
        new ParserTestArgs('$a->b[];', 'element access of a property', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof NamedMemberAccessSyntaxNode, true);
        }),
        // Scoped access.
        new ParserTestArgs('A::$b[];', 'element access of a static property', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof StaticPropertySyntaxNode, true);
        }),
        // Self.
        // NOTE: An expression like this must be used in a write context in
        // order to be semantically correct.
        new ParserTestArgs('$a[][];', 'element access of an element access expression', (statements) => {
          let accessNode = assertElementAccess(statements, false);
          assert.equal(accessNode.dereferencable instanceof ElementAccessSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('invocation-expression', function() {
      let syntaxTests = [
        new ParserTestArgs('$a();', 'invocation of a variable', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('$$a();', 'invocation of a variable with variable name', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof IndirectVariableSyntaxNode, true);
        }),
        new ParserTestArgs('${A}();', 'invocation of a variable with expression name', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof IndirectVariableSyntaxNode, true);
        }),
        new ParserTestArgs('array("a", "b")();', 'invocation of an array literal', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof ArraySyntaxNode, true);
        }),
        new ParserTestArgs('["a", "b"]();', 'invocation of an array literal (short syntax)', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof ArraySyntaxNode, true);
        }),
        new ParserTestArgs('"ab"();', 'invocation of a string literal', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof LiteralSyntaxNode, true);
        }),
        // Expression group.
        new ParserTestArgs('($a)();', 'invocation of an expression group', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof ExpressionGroupSyntaxNode, true);
        }),
        // Name.
        new ParserTestArgs('A();', 'invocation of a function', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        // Object access.
        new ParserTestArgs('$a->b();', 'invocation of a method', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let invocation = <NamedMethodInvocationSyntaxNode>exprNode.expression;
          assert.equal(invocation instanceof NamedMethodInvocationSyntaxNode, true, 'NamedMethodInvocationSyntaxNode');
          assert.equal(invocation.dereferenceable instanceof LocalVariableSyntaxNode, true);
          Test.assertSyntaxToken(invocation.identifierOrKeyword, text, TokenKind.Identifier, 'b');
        }),
        // Static access.
        new ParserTestArgs('A::$b();', 'invocation of a static property', (statements) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let invocation = <IndirectScopedInvocationSyntaxNode>exprNode.expression;
          assert.equal(invocation instanceof IndirectScopedInvocationSyntaxNode, true, 'IndirectScopedInvocationSyntaxNode');
          assert.equal(invocation.qualifier instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.equal(invocation.member instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('A::b();', 'invocation of a static method', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let invocation = <NamedScopedInvocationSyntaxNode>exprNode.expression;
          assert.equal(invocation instanceof NamedScopedInvocationSyntaxNode, true, 'NamedScopedInvocationSyntaxNode');
          assert.equal(invocation.qualifier instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(invocation.member, text, TokenKind.Identifier, 'b');
        }),
        new ParserTestArgs('$a::b();', 'invocation of a static method with class name reference', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let invocation = <NamedScopedInvocationSyntaxNode>exprNode.expression;
          assert.equal(invocation instanceof NamedScopedInvocationSyntaxNode, true, 'NamedScopedInvocationSyntaxNode');
          assert.equal(invocation.qualifier instanceof LocalVariableSyntaxNode, true);
          Test.assertSyntaxToken(invocation.member, text, TokenKind.Identifier, 'b');
        }),
        // Self.
        new ParserTestArgs('a()();', 'invocation of a function invocation', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof FunctionInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('A::b()();', 'invocation of a static method invocation', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a::b()();', 'invocation of a static method invocation with class name reference', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a->b()();', 'invocation of a method invocation', (statements) => {
          let invocation = assertFunctionInvocation(statements);
          assert.equal(invocation.reference instanceof NamedMethodInvocationSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    describe('object-access-expression', function() {
      let syntaxTests = [
        // Variables.
        new ParserTestArgs('$a->b;', 'object access of a variable', (statements, text) => {
          let accessNode = assertNamedMemberAccess(statements, text, 'b');
          assert.equal(accessNode.dereferencable instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('$$a->b;', 'object access of a variable with variable name', (statements, text) => {
          let accessNode = assertNamedMemberAccess(statements, text, 'b');
          assert.equal(accessNode.dereferencable instanceof IndirectVariableSyntaxNode, true);
        }),
        new ParserTestArgs('${A}->b;', 'object access of a variable with expression name', (statements, text) => {
          let accessNode = assertNamedMemberAccess(statements, text, 'b');
          assert.equal(accessNode.dereferencable instanceof IndirectVariableSyntaxNode, true);
        }),
        // Expression group.
        new ParserTestArgs('($a)->b;', 'object access of an expression group', (statements, text) => {
          let accessNode = assertNamedMemberAccess(statements, text, 'b');
          assert.equal(accessNode.dereferencable instanceof ExpressionGroupSyntaxNode, true);
        }),
        // Invocation.
        new ParserTestArgs('a()->b;', 'object access of a function invocation', (statements, text) => {
          let accessNode = assertNamedMemberAccess(statements, text, 'b');
          assert.equal(accessNode.dereferencable instanceof FunctionInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('A::b()->c;', 'object access of a static method invocation', (statements, text) => {
          let accessNode = assertNamedMemberAccess(statements, text, 'c');
          assert.equal(accessNode.dereferencable instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a::b()->c;', 'object access of a static method invocation with class name reference', (statements, text) => {
          let accessNode = assertNamedMemberAccess(statements, text, 'c');
          assert.equal(accessNode.dereferencable instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a->b()->c;', 'object access of a method invocation', (statements, text) => {
          let accessNode = assertNamedMemberAccess(statements, text, 'c');
          assert.equal(accessNode.dereferencable instanceof NamedMethodInvocationSyntaxNode, true);
        }),
        // Scoped access.
        new ParserTestArgs('A::$b->c;', 'object access of a scoped access expression', (statements, text) => {
          let accessNode = assertNamedMemberAccess(statements, text, 'c');
          assert.equal(accessNode.dereferencable instanceof StaticPropertySyntaxNode, true);
        }),
        // Self.
        new ParserTestArgs('$a->b->c;', 'object access of an object access expression', (statements, text) => {
          let accessNode = assertNamedMemberAccess(statements, text, 'c');
          assert.equal(accessNode.dereferencable instanceof NamedMemberAccessSyntaxNode, true);
        }),

        new ParserTestArgs('$a->class;', 'object access with keyword (class)', (statements, text) => {
          let exprNode = <ExpressionStatementSyntaxNode>statements[0];
          assert.equal(exprNode instanceof ExpressionStatementSyntaxNode, true, 'ExpressionStatementSyntaxNode');
          let memberAccess = <NamedMemberAccessSyntaxNode>exprNode.expression;
          assert.equal(memberAccess instanceof NamedMemberAccessSyntaxNode, true, 'NamedMemberAccessSyntaxNode');
          Test.assertSyntaxToken(memberAccess.member, text, TokenKind.Class, 'class');
          assert.equal(memberAccess.dereferencable instanceof LocalVariableSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('array()->', 'should not parse object access of an array', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [7, 7]),
        new DiagnosticTestArgs('[]->', 'should not parse object access of an array (short syntax)', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [2, 2]),
        new DiagnosticTestArgs('"A"->', 'should not parse object access of a string literal', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [3, 3]),
        new DiagnosticTestArgs('A->', 'should not parse object access of a name', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [1, 1]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    // NOTE: Technically this should include "$a->{$b}" syntax as well.
    describe('object-access-expression (indirect)', function() {
      let syntaxTests = [
        new ParserTestArgs('$a->$b;', 'object access of a variable', (statements) => {
          let accessNode = assertIndirectMemberAccess(statements);
          assert.equal(accessNode.dereferencable instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('$$a->$b;', 'object access of a variable with variable name', (statements) => {
          let accessNode = assertIndirectMemberAccess(statements);
          assert.equal(accessNode.dereferencable instanceof IndirectVariableSyntaxNode, true);
        }),
        new ParserTestArgs('${A}->$b;', 'object access of a variable with expression name', (statements) => {
          let accessNode = assertIndirectMemberAccess(statements);
          assert.equal(accessNode.dereferencable instanceof IndirectVariableSyntaxNode, true);
        }),
        // Expression group.
        new ParserTestArgs('($a)->$b;', 'object access of an expression group', (statements) => {
          let accessNode = assertIndirectMemberAccess(statements);
          assert.equal(accessNode.dereferencable instanceof ExpressionGroupSyntaxNode, true);
        }),
        // Invocation.
        new ParserTestArgs('a()->$b;', 'object access of a function invocation', (statements) => {
          let accessNode = assertIndirectMemberAccess(statements);
          assert.equal(accessNode.dereferencable instanceof FunctionInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('A::b()->$c;', 'object access of a static method invocation', (statements) => {
          let accessNode = assertIndirectMemberAccess(statements);
          assert.equal(accessNode.dereferencable instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a::b()->$c;', 'object access of a static method invocation with class name reference', (statements) => {
          let accessNode = assertIndirectMemberAccess(statements);
          assert.equal(accessNode.dereferencable instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a->b()->$c;', 'object access of a method invocation', (statements) => {
          let accessNode = assertIndirectMemberAccess(statements);
          assert.equal(accessNode.dereferencable instanceof NamedMethodInvocationSyntaxNode, true);
        }),
        // Scoped access.
        new ParserTestArgs('A::$b->$c;', 'object access of a scoped access expression', (statements) => {
          let accessNode = assertIndirectMemberAccess(statements);
          assert.equal(accessNode.dereferencable instanceof StaticPropertySyntaxNode, true);
        }),
        // Self.
        new ParserTestArgs('$a->b->$c;', 'object access of an object access expression', (statements) => {
          let accessNode = assertIndirectMemberAccess(statements);
          assert.equal(accessNode.dereferencable instanceof NamedMemberAccessSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    // NOTE: Does not include additional syntax variations for the member.
    describe('scoped-access-expression (static property)', function() {
      let syntaxTests = [
        new ParserTestArgs('$a::$b;', 'scoped access of a variable', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('$$a::$b;', 'scoped access of a variable with variable name', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof IndirectVariableSyntaxNode, true);
        }),
        new ParserTestArgs('${A}::$b;', 'scoped access of a variable with expression name', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof IndirectVariableSyntaxNode, true);
        }),
        new ParserTestArgs('"a"::$b;', 'scoped access of a string literal', (statements) => {
          let constant = assertStaticProperty(statements);
          assert.equal(constant.qualifier instanceof LiteralSyntaxNode, true);
        }),
        // Expression group.
        new ParserTestArgs('($a)::$b;', 'scoped access of an expression group', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof ExpressionGroupSyntaxNode, true);
        }),
        // Invocation.
        new ParserTestArgs('a()::$b;', 'scoped access of a function invocation', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof FunctionInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('A::b()::$c;', 'scoped access of a static method invocation', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a::b()::$c;', 'scoped access of a static method invocation with class name reference', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a->b()::$c;', 'scoped access of a method invocation', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof NamedMethodInvocationSyntaxNode, true);
        }),
        // Names.
        new ParserTestArgs('A::$b;', 'scoped access of a class name', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('static::$b;', 'scoped access of a class name (static keyword)', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        // Object access.
        new ParserTestArgs('$a->b::$c;', 'scoped access of an object access expression', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof NamedMemberAccessSyntaxNode, true);
        }),
        // Self.
        new ParserTestArgs('A::$b::$c;', 'scoped access of a scoped access expression', (statements) => {
          let property = assertStaticProperty(statements);
          assert.equal(property.qualifier instanceof StaticPropertySyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('array()::$b;', 'should not parse scoped access of an array', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [7, 7]),
        new DiagnosticTestArgs('[]::$b;', 'should not parse scoped access of an array (short syntax)', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [2, 2]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('scoped-access-expression (class constant)', function() {
      let syntaxTests = [
        new ParserTestArgs('$a::B;', 'scoped access of a variable', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'B');
          assert.equal(constant.qualifier instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('$$a::B;', 'scoped access of a variable with variable name', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'B');
          assert.equal(constant.qualifier instanceof IndirectVariableSyntaxNode, true);
        }),
        new ParserTestArgs('${A}::B;', 'scoped access of a variable with expression name', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'B');
          assert.equal(constant.qualifier instanceof IndirectVariableSyntaxNode, true);
        }),
        new ParserTestArgs('"a"::B;', 'scoped access of a string literal', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'B');
          assert.equal(constant.qualifier instanceof LiteralSyntaxNode, true);
        }),
        // Expression group.
        new ParserTestArgs('($a)::B;', 'scoped access of an expression group', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'B');
          assert.equal(constant.qualifier instanceof ExpressionGroupSyntaxNode, true);
        }),
        // Invocation.
        new ParserTestArgs('a()::B;', 'scoped access of a function invocation', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'B');
          assert.equal(constant.qualifier instanceof FunctionInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('A::b()::C;', 'scoped access of a static method invocation', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'C');
          assert.equal(constant.qualifier instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a::b()::C;', 'scoped access of a static method invocation with class name reference', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'C');
          assert.equal(constant.qualifier instanceof NamedScopedInvocationSyntaxNode, true);
        }),
        new ParserTestArgs('$a->b()::C;', 'scoped access of a method invocation', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'C');
          assert.equal(constant.qualifier instanceof NamedMethodInvocationSyntaxNode, true);
        }),
        // Names.
        new ParserTestArgs('A::B;', 'scoped access of a class name', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'B');
          assert.equal(constant.qualifier instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('static::B;', 'scoped access of a class name (static keyword)', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'B');
          assert.equal(constant.qualifier instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        // Object access.
        new ParserTestArgs('$a->b::C;', 'scoped access of an object access expression', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'C');
          assert.equal(constant.qualifier instanceof NamedMemberAccessSyntaxNode, true);
        }),
        // Self.
        new ParserTestArgs('A::$b::C;', 'scoped access of a scoped access expression', (statements, text) => {
          let constant = assertClassConstant(statements, text, 'C');
          assert.equal(constant.qualifier instanceof StaticPropertySyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('array()::B;', 'should not parse scoped access of an array', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [7, 7]),
        new DiagnosticTestArgs('[]::B;', 'should not parse scoped access of an array (short syntax)', [ErrorCode.ERR_SemicolonExpected, ErrorCode.ERR_UnexpectedToken], [2, 2]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

  });

});
