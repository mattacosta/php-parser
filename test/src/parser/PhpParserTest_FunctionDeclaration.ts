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
  CompositeTypeSyntaxNode,
  ConstantSyntaxNode,
  FullyQualifiedNameSyntaxNode,
  FunctionDeclarationSyntaxNode,
  LiteralSyntaxNode,
  NamedTypeSyntaxNode,
  ParameterSyntaxNode,
  PartiallyQualifiedNameSyntaxNode,
  PredefinedTypeSyntaxNode,
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { ISyntaxNode } from '../../../src/language/syntax/ISyntaxNode';
import { PhpVersion } from '../../../src/parser/PhpVersion';
import { TokenKind } from '../../../src/language/TokenKind';

function assertFunctionWithParameters(statements: ISyntaxNode[]): ISyntaxNode[] {
  let funcDecl = <FunctionDeclarationSyntaxNode>statements[0];
  assert.strictEqual(funcDecl instanceof FunctionDeclarationSyntaxNode, true, 'FunctionDeclarationSyntaxNode');
  assert.strictEqual(funcDecl.ampersand, null);
  assert.strictEqual(funcDecl.returnType, null);
  let parameters = funcDecl.parameters ? funcDecl.parameters.childNodes() : [];
  return parameters;
}

function assertParameter(node: ISyntaxNode, hasType: boolean, hasAmpersand: boolean, hasEllipsis: boolean, hasDefaultValue: boolean): ParameterSyntaxNode {
  let parameter = <ParameterSyntaxNode>node;
  assert.strictEqual(parameter instanceof ParameterSyntaxNode, true, 'ParameterSyntaxNode');
  assert.strictEqual(parameter.modifiers, null);
  if (!hasType) {
    assert.strictEqual(parameter.type, null);
  }
  if (hasAmpersand) {
    assert.notStrictEqual(parameter.ampersand, null);
  }
  else {
    assert.strictEqual(parameter.ampersand, null);
  }
  if (hasEllipsis) {
    assert.notStrictEqual(parameter.ellipsis, null);
  }
  else {
    assert.strictEqual(parameter.ellipsis, null);
  }
  if (!hasDefaultValue) {
    assert.strictEqual(parameter.equal, null);
    assert.strictEqual(parameter.expression, null);
  }
  return parameter;
}

describe('PhpParser', function() {

  // Officially this is `function-definition`.
  describe('function-declaration', function() {
    let syntaxTests = [
      new ParserTestArgs('function a() {}', 'should parse a function', (statements) => {
        let funcDecl = <FunctionDeclarationSyntaxNode>statements[0];
        assert.strictEqual(funcDecl instanceof FunctionDeclarationSyntaxNode, true, 'FunctionDeclarationSyntaxNode');
        assert.strictEqual(funcDecl.ampersand, null);
        assert.strictEqual(funcDecl.parameters, null);
        assert.strictEqual(funcDecl.returnType, null);
      }),
      new ParserTestArgs('function &a() {}', 'should parse a function (byref)', (statements) => {
        let funcDecl = <FunctionDeclarationSyntaxNode>statements[0];
        assert.strictEqual(funcDecl instanceof FunctionDeclarationSyntaxNode, true, 'FunctionDeclarationSyntaxNode');
        assert.notStrictEqual(funcDecl.ampersand, null);
        assert.strictEqual(funcDecl.parameters, null);
        assert.strictEqual(funcDecl.returnType, null);
      }),

      new ParserTestArgs('function a(): B {}', 'should parse a function with return type', (statements) => {
        let funcDecl = <FunctionDeclarationSyntaxNode>statements[0];
        assert.strictEqual(funcDecl instanceof FunctionDeclarationSyntaxNode, true, 'FunctionDeclarationSyntaxNode');
        assert.strictEqual(funcDecl.ampersand, null);
        assert.strictEqual(funcDecl.parameters, null);
        let returnType = <NamedTypeSyntaxNode>funcDecl.returnType;
        assert.strictEqual(returnType instanceof NamedTypeSyntaxNode, true, 'NamedTypeSyntaxNode');
        assert.strictEqual(returnType.question, null);
        assert.strictEqual(returnType.typeName instanceof PartiallyQualifiedNameSyntaxNode, true);
      }),
      new ParserTestArgs('function a(): \\B {}', 'should parse a function with return type (fully qualified)', (statements) => {
        let funcDecl = <FunctionDeclarationSyntaxNode>statements[0];
        assert.strictEqual(funcDecl instanceof FunctionDeclarationSyntaxNode, true, 'FunctionDeclarationSyntaxNode');
        assert.strictEqual(funcDecl.ampersand, null);
        assert.strictEqual(funcDecl.parameters, null);
        let returnType = <NamedTypeSyntaxNode>funcDecl.returnType;
        assert.strictEqual(returnType instanceof NamedTypeSyntaxNode, true, 'NamedTypeSyntaxNode');
        assert.strictEqual(returnType.question, null);
        assert.strictEqual(returnType.typeName instanceof FullyQualifiedNameSyntaxNode, true);
      }),
      new ParserTestArgs('function a(): array {}', 'should parse a function with predefined return type (array)', (statements, text) => {
        let funcDecl = <FunctionDeclarationSyntaxNode>statements[0];
        assert.strictEqual(funcDecl instanceof FunctionDeclarationSyntaxNode, true, 'FunctionDeclarationSyntaxNode');
        assert.strictEqual(funcDecl.ampersand, null);
        assert.strictEqual(funcDecl.parameters, null);
        let returnType = <PredefinedTypeSyntaxNode>funcDecl.returnType;
        assert.strictEqual(returnType instanceof PredefinedTypeSyntaxNode, true, 'PredefinedTypeSyntaxNode');
        assert.strictEqual(returnType.question, null);
        Test.assertSyntaxToken(returnType.keyword, text, TokenKind.Array, 'array');
      }),
      new ParserTestArgs('function a(): callable {}', 'should parse a function with predefined return type (callable)', (statements, text) => {
        let funcDecl = <FunctionDeclarationSyntaxNode>statements[0];
        assert.strictEqual(funcDecl instanceof FunctionDeclarationSyntaxNode, true, 'FunctionDeclarationSyntaxNode');
        assert.strictEqual(funcDecl.ampersand, null);
        assert.strictEqual(funcDecl.parameters, null);
        let returnType = <PredefinedTypeSyntaxNode>funcDecl.returnType;
        assert.strictEqual(returnType instanceof PredefinedTypeSyntaxNode, true, 'PredefinedTypeSyntaxNode');
        assert.strictEqual(returnType.question, null);
        Test.assertSyntaxToken(returnType.keyword, text, TokenKind.Callable, 'callable');
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let syntaxTests7_1 = [
      new ParserTestArgs('function a(): ? B {}', 'should parse a function with nullable return type', (statements) => {
        let funcDecl = <FunctionDeclarationSyntaxNode>statements[0];
        assert.strictEqual(funcDecl instanceof FunctionDeclarationSyntaxNode, true, 'FunctionDeclarationSyntaxNode');
        assert.strictEqual(funcDecl.ampersand, null);
        assert.strictEqual(funcDecl.parameters, null);
        let returnType = <NamedTypeSyntaxNode>funcDecl.returnType;
        assert.strictEqual(returnType instanceof NamedTypeSyntaxNode, true, 'NamedTypeSyntaxNode');
        assert.notStrictEqual(returnType.question, null);
        assert.strictEqual(returnType.typeName instanceof PartiallyQualifiedNameSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests7_1, PhpVersion.PHP7_1);

    let syntaxTests8_0 = [
      new ParserTestArgs('function a(): static {}', 'should parse a function with static return type', (statements) => {
        let funcDecl = <FunctionDeclarationSyntaxNode>statements[0];
        assert.strictEqual(funcDecl instanceof FunctionDeclarationSyntaxNode, true, 'FunctionDeclarationSyntaxNode');
        assert.strictEqual(funcDecl.ampersand, null);
        assert.strictEqual(funcDecl.parameters, null);
        assert.strictEqual(funcDecl.returnType instanceof PredefinedTypeSyntaxNode, true, 'PredefinedTypeSyntaxNode');
      }),
      new ParserTestArgs('function a(): B | callable {}', 'should parse a function with type union', (statements) => {
        let funcDecl = <FunctionDeclarationSyntaxNode>statements[0];
        assert.strictEqual(funcDecl instanceof FunctionDeclarationSyntaxNode, true, 'FunctionDeclarationSyntaxNode');
        assert.strictEqual(funcDecl.ampersand, null);
        assert.strictEqual(funcDecl.parameters, null);
        let returnType = <CompositeTypeSyntaxNode>funcDecl.returnType;
        assert.strictEqual(returnType instanceof CompositeTypeSyntaxNode, true, 'CompositeTypeSyntaxNode');
        let types = returnType.types.childNodes();
        assert.strictEqual(types.length, 2);
        assert.strictEqual(types[0] instanceof NamedTypeSyntaxNode, true);
        assert.strictEqual(types[1] instanceof PredefinedTypeSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests8_0, PhpVersion.PHP8_0);

    let diagnosticTests = [
      new DiagnosticTestArgs('function', 'missing ampersand, identifier, or open paren', [ErrorCode.ERR_IncompleteFunctionDeclaration], [8]),
      new DiagnosticTestArgs('function &', 'missing identifier or open paren', [ErrorCode.ERR_IdentifierOrOpenParenExpected], [10]),
      new DiagnosticTestArgs('function a()', 'missing colon or open brace', [ErrorCode.ERR_OpenBraceOrColonExpected], [12]),
      new DiagnosticTestArgs('function a():', 'missing type', [ErrorCode.ERR_TypeExpected], [13]),

      new DiagnosticTestArgs('function empty() {}', 'should not parse a function with a reserved name', [ErrorCode.ERR_IncompleteFunctionDeclaration], [8]),
    ];
    Test.assertDiagnostics(diagnosticTests);

    let diagnosticTests8_0 = [
      new DiagnosticTestArgs('function a(): B', 'missing open brace or vertical bar', [ErrorCode.ERR_OpenBraceExpected], [15]),
      new DiagnosticTestArgs('function a(): B |', 'missing type', [ErrorCode.ERR_TypeExpected], [17]),
      new DiagnosticTestArgs('function a(): B | C', 'missing open brace or vertical bar (after multiple types)', [ErrorCode.ERR_OpenBraceExpected], [19]),
      new DiagnosticTestArgs('function a(): ?B | C {}', 'should not parse nullable type in type union', [ErrorCode.ERR_TypeUnionHasNullableType], [14]),
      new DiagnosticTestArgs('function a(): ?B | ?C {}', 'should not parse nullable type in type union (multiple)', [ErrorCode.ERR_TypeUnionHasNullableType, ErrorCode.ERR_TypeUnionHasNullableType], [14, 19]),
    ];
    Test.assertDiagnostics(diagnosticTests8_0, PhpVersion.PHP8_0);

    let diagnosticRegressionTests8_0 = [
      new DiagnosticTestArgs('function a(): B', 'missing open brace', [ErrorCode.ERR_OpenBraceExpected], [15]),
      new DiagnosticTestArgs('function a(): B | C {}', 'should not parse a type union', [ErrorCode.ERR_FeatureUnionTypes], [14]),
      new DiagnosticTestArgs('function a(): static {}', 'should not parse a static return type', [ErrorCode.ERR_FeatureStaticReturnType], [14]),
    ];
    Test.assertDiagnostics(diagnosticRegressionTests8_0, PhpVersion.PHP7_0, PhpVersion.PHP7_4);
  });

  describe('parameter-list', function() {
    let syntaxTests = [
      new ParserTestArgs('function a($b) {}', 'should parse a parameter', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        assertParameter(parameters[0], false, false, false, false);
      }),
      new ParserTestArgs('function a(&$b) {}', 'should parse a parameter (byref)', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        assertParameter(parameters[0], false, true, false, false);
      }),
      new ParserTestArgs('function a($b, $c) {}', 'should parse multiple parameters', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 2);
        assertParameter(parameters[0], false, false, false, false);
        assertParameter(parameters[1], false, false, false, false);
      }),
      new ParserTestArgs('function a(B $c) {}', 'should parse a parameter with type', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        let param = assertParameter(parameters[0], true, false, false, false);
        let type = <NamedTypeSyntaxNode>param.type;
        assert.strictEqual(type instanceof NamedTypeSyntaxNode, true);
        assert.strictEqual(type.question, null);
        assert.strictEqual(type.typeName instanceof PartiallyQualifiedNameSyntaxNode, true);
      }),
      new ParserTestArgs('function a(array $c) {}', 'should parse a parameter with predefined type (array)', (statements, text) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        let param = assertParameter(parameters[0], true, false, false, false);
        let type = <PredefinedTypeSyntaxNode>param.type;
        assert.strictEqual(type instanceof PredefinedTypeSyntaxNode, true);
        assert.strictEqual(type.question, null);
        Test.assertSyntaxToken(type.keyword, text, TokenKind.Array, 'array');
      }),
      new ParserTestArgs('function a(callable $c) {}', 'should parse a parameter with predefined type (callable)', (statements, text) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        let param = assertParameter(parameters[0], true, false, false, false);
        let type = <PredefinedTypeSyntaxNode>param.type;
        assert.strictEqual(type instanceof PredefinedTypeSyntaxNode, true);
        assert.strictEqual(type.question, null);
        Test.assertSyntaxToken(type.keyword, text, TokenKind.Callable, 'callable');
      }),
      new ParserTestArgs('function a($b = 1) {}', 'should parse a parameter with default value', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        let param = assertParameter(parameters[0], false, false, false, true);
        assert.notStrictEqual(param.equal, null);
        assert.strictEqual(param.expression instanceof LiteralSyntaxNode, true);
      }),
      new ParserTestArgs('function a(B $c = null) {}', 'should parse a parameter with type and default value', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        let param = assertParameter(parameters[0], true, false, false, true);
        let type = <NamedTypeSyntaxNode>param.type;
        assert.strictEqual(type instanceof NamedTypeSyntaxNode, true);
        assert.strictEqual(type.question, null);
        assert.strictEqual(type.typeName instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.notStrictEqual(param.equal, null);
        assert.strictEqual(param.expression instanceof ConstantSyntaxNode, true);
      }),

      new ParserTestArgs('function a(...$c) {}', 'should parse a variadic parameter', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        assertParameter(parameters[0], false, false, true, false);
      }),
      new ParserTestArgs('function a(&...$c) {}', 'should parse a variadic parameter (byref)', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        assertParameter(parameters[0], false, true, true, false);
      }),
      new ParserTestArgs('function a($b, ...$c) {}', 'should parse a variadic parameter after a parameter', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 2);
        assertParameter(parameters[0], false, false, false, false);
        assertParameter(parameters[1], false, false, true, false);
      }),
      new ParserTestArgs('function a(B ...$c) {}', 'should parse a variadic parameter with type', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        let param = assertParameter(parameters[0], true, false, true, false);
        let type = <NamedTypeSyntaxNode>param.type;
        assert.strictEqual(type instanceof NamedTypeSyntaxNode, true);
        assert.strictEqual(type.question, null);
        assert.strictEqual(type.typeName instanceof PartiallyQualifiedNameSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let syntaxTests7_1 = [
      new ParserTestArgs('function a(?B $c) {}', 'should parse a parameter with nullable type', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        let param = assertParameter(parameters[0], true, false, false, false);
        let type = <NamedTypeSyntaxNode>param.type;
        assert.strictEqual(type instanceof NamedTypeSyntaxNode, true);
        assert.notStrictEqual(type.question, null);
        assert.strictEqual(type.typeName instanceof PartiallyQualifiedNameSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests7_1, PhpVersion.PHP7_1);

    let syntaxTests8_0 = [
      new ParserTestArgs('function a(B | callable $d) {}', 'should parse a parameter with type union', (statements) => {
        let parameters = assertFunctionWithParameters(statements);
        assert.strictEqual(parameters.length, 1);
        let param = assertParameter(parameters[0], true, false, false, false);
        let paramType = <CompositeTypeSyntaxNode>param.type;
        assert.strictEqual(paramType instanceof CompositeTypeSyntaxNode, true, 'CompositeTypeSyntaxNode');
        let types = paramType.types.childNodes();
        assert.strictEqual(types.length, 2);
        assert.strictEqual(types[0] instanceof NamedTypeSyntaxNode, true);
        assert.strictEqual(types[1] instanceof PredefinedTypeSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests8_0, PhpVersion.PHP8_0);

    let diagnosticTests = [
      new DiagnosticTestArgs('function a(', 'missing ampersand, ellipsis, question, type, variable, or close paren', [ErrorCode.ERR_ParameterOrCloseParenExpected], [11]),
      new DiagnosticTestArgs('function a(&', 'missing ellipsis or variable', [ErrorCode.ERR_VariableOrEllipsisExpected], [12]),
      new DiagnosticTestArgs('function a($b', 'missing comma, close paren, or equals', [ErrorCode.ERR_IncompleteParameterList], [13]),
      new DiagnosticTestArgs('function a($b =', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [15]),
      new DiagnosticTestArgs('function a($b = 1', 'missing comma or close paren', [ErrorCode.ERR_CommaOrCloseParenExpected], [17]),
      new DiagnosticTestArgs('function a($b,', 'missing ampersand, ellipsis, question, type, or variable', [ErrorCode.ERR_ParameterExpected], [14]),
      new DiagnosticTestArgs('function a(...', 'missing variable', [ErrorCode.ERR_VariableExpected], [14]),
      new DiagnosticTestArgs('function a(...$b', 'missing close paren', [ErrorCode.ERR_CloseParenExpected], [16]),

      new DiagnosticTestArgs('function a(...$b = []) {}', 'should not parse variadic parameter with default value', [ErrorCode.ERR_VariadicHasDefaultValue], [17]),
      new DiagnosticTestArgs('function a(...$b, $c) {}', 'should not parse parameter after variadic parameter', [ErrorCode.ERR_VariadicIsNotLastParameter], [11]),

      // @todo Recovery tests.
      new DiagnosticTestArgs('function a($', 'missing variable name', [ErrorCode.ERR_VariableNameExpected], [11]),
      // @todo It may be worth allowing this for error recovery purposes in the
      //   future. A user may be refactoring a method into a regular function.
      new DiagnosticTestArgs('function a(public $b) {}', 'should not parse a parameter with modifier', [ErrorCode.ERR_ParameterOrCloseParenExpected], [11]),
    ];
    Test.assertDiagnostics(diagnosticTests);

    let diagnosticTests7_1 = [
      new DiagnosticTestArgs('function a(?', 'missing type', [ErrorCode.ERR_TypeExpected], [12]),
    ];
    Test.assertDiagnostics(diagnosticTests7_1, PhpVersion.PHP7_1);

    let diagnosticRegressionTests7_1 = [
      new DiagnosticTestArgs('function a(?B $c) {}', 'should not parse parameter with nullable type', [ErrorCode.ERR_FeatureNullableTypes], [11]),
    ];
    Test.assertDiagnostics(diagnosticRegressionTests7_1, PhpVersion.PHP7_0, PhpVersion.PHP7_0);

    let diagnosticTests8_0 = [
      new DiagnosticTestArgs('function a(B', 'missing ampersand, ellipsis, variable, or vertical bar', [ErrorCode.ERR_IncompleteParameter], [12]),
      new DiagnosticTestArgs('function a(B |', 'missing type', [ErrorCode.ERR_TypeExpected], [14]),
      new DiagnosticTestArgs('function a(B | C', 'missing ampersand, ellipsis, variable, or vertical bar (after multiple types)', [ErrorCode.ERR_IncompleteParameter], [16]),
      new DiagnosticTestArgs('function a(?B | C $d) {}', 'should not parse nullable type in type union', [ErrorCode.ERR_TypeUnionHasNullableType], [11]),
      new DiagnosticTestArgs('function a(?B | ?C $d) {}', 'should not parse nullable type in type union (multiple)', [ErrorCode.ERR_TypeUnionHasNullableType, ErrorCode.ERR_TypeUnionHasNullableType], [11, 16]),
    ];
    Test.assertDiagnostics(diagnosticTests8_0, PhpVersion.PHP8_0);

    let diagnosticRegressionTests8_0 = [
      new DiagnosticTestArgs('function a(B', 'missing ampersand, ellipsis, or variable', [ErrorCode.ERR_IncompleteParameter], [12]),
      new DiagnosticTestArgs('function a(B | C $d) {}', 'should not parse a type union', [ErrorCode.ERR_FeatureUnionTypes], [11]),
    ];
    Test.assertDiagnostics(diagnosticRegressionTests8_0, PhpVersion.PHP7_0, PhpVersion.PHP7_4);
  });

});
