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
  FullyQualifiedNameSyntaxNode,
  LiteralSyntaxNode,
  MethodDeclarationSyntaxNode,
  MethodReferenceSyntaxNode,
  NamedTraitAliasSyntaxNode,
  NamedTypeSyntaxNode,
  ParameterSyntaxNode,
  PartiallyQualifiedNameSyntaxNode,
  PredefinedTypeSyntaxNode,
  PropertyDeclarationSyntaxNode,
  PropertyElementSyntaxNode,
  ReferencedTraitAliasSyntaxNode,
  RelativeNameSyntaxNode,
  StatementBlockSyntaxNode,
  TraitDeclarationSyntaxNode,
  TraitPrecedenceSyntaxNode,
  TraitUseGroupSyntaxNode,
  TraitUseSyntaxNode,
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { ISyntaxNode } from '../../../src/language/syntax/ISyntaxNode';
import { PhpVersion } from '../../../src/parser/PhpVersion';
import { TokenKind } from '../../../src/language/TokenKind';

function assertMethodDeclaration(statements: ISyntaxNode[]): MethodDeclarationSyntaxNode {
  let traitNode = <TraitDeclarationSyntaxNode>statements[0];
  assert.strictEqual(traitNode instanceof TraitDeclarationSyntaxNode, true, 'TraitDeclarationSyntaxNode');
  let members = traitNode.members ? traitNode.members.childNodes() : [];
  assert.strictEqual(members.length, 1);
  let method = <MethodDeclarationSyntaxNode>members[0];
  assert.strictEqual(method instanceof MethodDeclarationSyntaxNode, true, 'MethodDeclarationSyntaxNode');
  return method;
}

function assertMethodDeclarationWithParameters(statements: ISyntaxNode[]): ISyntaxNode[] {
  let method = assertMethodDeclaration(statements);
  assert.strictEqual(method.modifiers, null);
  assert.strictEqual(method.ampersand, null);
  assert.strictEqual(method.returnType, null);
  let parameters = method.parameters ? method.parameters.childNodes() : [];
  return parameters;
}

function assertMethodParameter(node: ISyntaxNode, hasModifiers: boolean, hasType: boolean, hasAmpersand: boolean, hasEllipsis: boolean, hasDefaultValue: boolean): ParameterSyntaxNode {
  let parameter = <ParameterSyntaxNode>node;
  assert.strictEqual(parameter instanceof ParameterSyntaxNode, true, 'ParameterSyntaxNode');
  if (!hasModifiers) {
    assert.strictEqual(parameter.modifiers, null);
  }
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

function assertPropertyDeclaration(statements: ISyntaxNode[]): PropertyDeclarationSyntaxNode {
  let traitNode = <TraitDeclarationSyntaxNode>statements[0];
  assert.strictEqual(traitNode instanceof TraitDeclarationSyntaxNode, true, 'TraitDeclarationSyntaxNode');
  let members = traitNode.members ? traitNode.members.childNodes() : [];
  assert.strictEqual(members.length, 1);
  let property = <PropertyDeclarationSyntaxNode>members[0];
  assert.strictEqual(property instanceof PropertyDeclarationSyntaxNode, true, 'PropertyDeclarationSyntaxNode');
  return property;
}

function assertPropertyElements(node: PropertyDeclarationSyntaxNode, text: string, expected: string[]): void {
  let elements = node.properties.childNodes();
  assert.strictEqual(elements.length, expected.length);
  for (let i = 0; i < elements.length; i++) {
    let element = <PropertyElementSyntaxNode>elements[i];
    assert.strictEqual(element instanceof PropertyElementSyntaxNode, true, 'PropertyElementSyntaxNode');
    Test.assertSyntaxToken(element.variable, text, TokenKind.Variable, expected[i]);
    assert.strictEqual(element.expression, null);
  }
}

function assertTraitUse(statements: ISyntaxNode[]): TraitUseSyntaxNode {
  let traitNode = <TraitDeclarationSyntaxNode>statements[0];
  assert.strictEqual(traitNode instanceof TraitDeclarationSyntaxNode, true, 'TraitDeclarationSyntaxNode');
  let members = traitNode.members ? traitNode.members.childNodes() : [];
  assert.strictEqual(members.length, 1);
  let traitUse = <TraitUseSyntaxNode>members[0];
  assert.strictEqual(traitUse instanceof TraitUseSyntaxNode, true, 'TraitUseSyntaxNode');
  return traitUse;
}

function assertTraitUseGroup(statements: ISyntaxNode[]): TraitUseGroupSyntaxNode {
  let traitNode = <TraitDeclarationSyntaxNode>statements[0];
  assert.strictEqual(traitNode instanceof TraitDeclarationSyntaxNode, true, 'TraitDeclarationSyntaxNode');
  let members = traitNode.members ? traitNode.members.childNodes() : [];
  assert.strictEqual(members.length, 1);
  let traitUseGroup = <TraitUseGroupSyntaxNode>members[0];
  assert.strictEqual(traitUseGroup instanceof TraitUseGroupSyntaxNode, true, 'TraitUseGroupSyntaxNode');
  return traitUseGroup;
}

describe('PhpParser', function() {

  describe('trait-declaration', function() {
    let syntaxTests = [
      new ParserTestArgs('trait A {}', 'should parse a trait declaration', (statements, text) => {
        let traitNode = <TraitDeclarationSyntaxNode>statements[0];
        assert.strictEqual(traitNode instanceof TraitDeclarationSyntaxNode, true, 'TraitDeclarationSyntaxNode');
        Test.assertSyntaxToken(traitNode.identifier, text, TokenKind.Identifier, 'A');
        assert.strictEqual(traitNode.members, null);
      }),
      new ParserTestArgs('{ trait A {} }', 'should parse a trait declaration in statement block', (statements) => {
        let block = <StatementBlockSyntaxNode>statements[0];
        assert.strictEqual(block instanceof StatementBlockSyntaxNode, true, 'StatementBlockSyntaxNode');
        let innerStatements = block.childNodes();
        assert.strictEqual(innerStatements.length, 1);
        assert.strictEqual(innerStatements[0] instanceof TraitDeclarationSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    // let recoveryTests = [
    //   new ParserTestArgs('trait A }', 'should not consume closing brace if opening brace is missing')
    // ];
    // Test.assertSyntaxNodes(recoveryTests, false);

    let diagnosticTests = [
      new DiagnosticTestArgs('trait', 'missing identifier', [ErrorCode.ERR_IdentifierExpected], [5]),
      new DiagnosticTestArgs('trait A {', 'missing close brace', [ErrorCode.ERR_CloseBraceExpected], [9]),
      new DiagnosticTestArgs('trait A extends', 'should not parse a base clause', [ErrorCode.ERR_OpenBraceExpected], [7]),
      new DiagnosticTestArgs('trait A implements', 'should not parse an implements list', [ErrorCode.ERR_OpenBraceExpected], [7]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('trait-member-declarations', function() {

    // @todo Add test for ERR_InvalidMemberDeclaration.

    describe('modifiers', function() {
      let diagnosticTests = [
        new DiagnosticTestArgs('trait A { public }', 'missing function or variable', [ErrorCode.ERR_TraitMemberExpected], [10]),

        new DiagnosticTestArgs('trait A { private private }', 'duplicate private modifier', [ErrorCode.ERR_DuplicateModifier], [18]),
        new DiagnosticTestArgs('trait A { protected protected }', 'duplicate protected modifier', [ErrorCode.ERR_DuplicateModifier], [20]),
        new DiagnosticTestArgs('trait A { public public }', 'duplicate public modifier', [ErrorCode.ERR_DuplicateModifier], [17]),

        new DiagnosticTestArgs('trait A { private protected }', 'private and protected modifiers', [ErrorCode.ERR_MultipleVisibilityModifiers], [18]),
        new DiagnosticTestArgs('trait A { private public }', 'private and public modifiers', [ErrorCode.ERR_MultipleVisibilityModifiers], [18]),
        new DiagnosticTestArgs('trait A { protected private }', 'protected and private modifiers', [ErrorCode.ERR_MultipleVisibilityModifiers], [20]),
        new DiagnosticTestArgs('trait A { protected public }', 'protected and public modifiers', [ErrorCode.ERR_MultipleVisibilityModifiers], [20]),
        new DiagnosticTestArgs('trait A { public private }', 'public and private modifiers', [ErrorCode.ERR_MultipleVisibilityModifiers], [17]),
        new DiagnosticTestArgs('trait A { public protected }', 'public and protected modifiers', [ErrorCode.ERR_MultipleVisibilityModifiers], [17]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('class-const-declaration', function() {
      let diagnosticTests = [
        new DiagnosticTestArgs('trait A { const B = 1; }', 'should not parse a class constant declaration', [ErrorCode.ERR_TraitConstant], [10]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('method-declaration', function() {
      let syntaxTests = [
        new ParserTestArgs('trait A { function b() {} }', 'should parse a method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { function list() {} }', 'should parse a method declaration with semi-reserved keyword', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.List, 'list');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { function &b() {} }', 'should parse a method declaration with ampersand', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.notStrictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),

        // See modifier tests below.

        // See parameter tests below.

        // Return types.
        new ParserTestArgs('trait A { function b(): C {} }', 'should parse a method declaration with return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType instanceof NamedTypeSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { function b(): \\C {} }', 'should parse a method declaration with fully qualified return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType instanceof NamedTypeSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { function b(): namespace\\C {} }', 'should parse a method declaration with relative return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType instanceof NamedTypeSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { function b(): array {} }', 'should parse a method declaration with predefined return type (array)', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType instanceof PredefinedTypeSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { function b(): callable {} }', 'should parse a method declaration with predefined return type (callable)', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType instanceof PredefinedTypeSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let syntaxTests7_1 = [
        new ParserTestArgs('trait A { function b(): ? C {} }', 'should parse a method declaration with nullable return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          let returnType = <NamedTypeSyntaxNode>method.returnType;
          assert.strictEqual(returnType instanceof NamedTypeSyntaxNode, true, 'NamedTypeSyntaxNode');
          assert.notStrictEqual(returnType.question, null);
          assert.strictEqual(returnType.typeName instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests7_1, PhpVersion.PHP7_1);

      let syntaxTests8_0 = [
        new ParserTestArgs('trait A { function b(): array | C {} }', 'should parse a method declaration with type union', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          let returnType = <CompositeTypeSyntaxNode>method.returnType;
          assert.strictEqual(returnType instanceof CompositeTypeSyntaxNode, true, 'CompositeTypeSyntaxNode');
          let types = returnType.types.childNodes();
          assert.strictEqual(types.length, 2);
          assert.strictEqual(types[0] instanceof PredefinedTypeSyntaxNode, true);
          assert.strictEqual(types[1] instanceof NamedTypeSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests8_0, PhpVersion.PHP8_0);

      let diagnosticTests = [
        new DiagnosticTestArgs('trait A { function }', 'missing method name or ampersand', [ErrorCode.ERR_MethodNameOrAmpersandExpected], [18]),
        new DiagnosticTestArgs('trait A { function &', 'missing method name (after ampersand)', [ErrorCode.ERR_MethodNameExpected], [20]),
        new DiagnosticTestArgs('trait A { function b }', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [20]),
        new DiagnosticTestArgs('trait A { function b( }', 'missing ampersand, ellipsis, question, type, variable, or close paren', [ErrorCode.ERR_ParameterOrCloseParenExpected], [21]),
        new DiagnosticTestArgs('trait A { function b() }', 'missing open brace or colon', [ErrorCode.ERR_OpenBraceOrColonExpected], [22]),
        new DiagnosticTestArgs('trait A { function b():', 'missing return type', [ErrorCode.ERR_TypeExpected], [23]),
        new DiagnosticTestArgs('trait A { abstract function b() }', 'missing colon or semicolon', [ErrorCode.ERR_ColonOrSemicolonExpected], [31]),

        new DiagnosticTestArgs('trait A { function b() { public $c; }', 'should not parse trailing class member as method statement', [ErrorCode.ERR_CloseBraceExpected], [24]),
        new DiagnosticTestArgs('trait A { function b(); }', 'should not expect a semicolon after a non-abstract method declaration', [ErrorCode.ERR_OpenBraceOrColonExpected], [22]),
      ];
      Test.assertDiagnostics(diagnosticTests);

      let diagnosticTests8_0 = [
        new DiagnosticTestArgs('trait A { function b(): C }', 'missing open brace or vertical bar', [ErrorCode.ERR_OpenBraceExpected], [25]),
        new DiagnosticTestArgs('trait A { function b(): C | }', 'missing type', [ErrorCode.ERR_TypeExpected], [27]),
        new DiagnosticTestArgs('trait A { function b(): C | D }', 'missing open brace or vertical bar (after multiple types)', [ErrorCode.ERR_OpenBraceExpected], [29]),
        new DiagnosticTestArgs('trait A { abstract function b(): C }', 'missing semicolon or vertical bar', [ErrorCode.ERR_SemicolonExpected], [34]),

        new DiagnosticTestArgs('trait A { function b(): ?C | D {} }', 'should not parse nullable type in type union', [ErrorCode.ERR_TypeUnionHasNullableType], [24]),
        new DiagnosticTestArgs('trait A { function b(): ?C | ?D {} }', 'should not parse nullable type in type union (multiple)', [ErrorCode.ERR_TypeUnionHasNullableType, ErrorCode.ERR_TypeUnionHasNullableType], [24, 29]),
      ];
      Test.assertDiagnostics(diagnosticTests8_0, PhpVersion.PHP8_0);

      let diagnosticRegressionTests8_0 = [
        new DiagnosticTestArgs('trait A { function b(): C }', 'missing open brace', [ErrorCode.ERR_OpenBraceExpected], [25]),
        new DiagnosticTestArgs('trait A { function b(): C | D {} }', 'should not parse a type union', [ErrorCode.ERR_FeatureUnionTypes], [24]),
        new DiagnosticTestArgs('trait A { abstract function b(): C }', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [34]),
      ];
      Test.assertDiagnostics(diagnosticRegressionTests8_0, PhpVersion.PHP7_0, PhpVersion.PHP7_4);
    });

    describe('method-declaration (modifiers)', function() {
      let syntaxTests = [
        // Modifiers.
        new ParserTestArgs('trait A { abstract function b(); }', 'should parse an abstract method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { final function b() {} }', 'should parse a final method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Final, 'final');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { private function b() {} }', 'should parse a private method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Private, 'private');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { protected function b() {} }', 'should parse a protected method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Protected, 'protected');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { public function b() {} }', 'should parse a public method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { static function b() {} }', 'should parse a static method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),

        // Modifiers (mixed).
        new ParserTestArgs('trait A { abstract protected function b(); }', 'should parse an abstract and protected method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Protected, 'protected');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { abstract public function b(); }', 'should parse an abstract and public method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Public, 'public');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { abstract static function b(); }', 'should parse an abstract and static method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Static, 'static');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { static final function b() {} }', 'should parse a static and final method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Final, 'final');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { static private function b() {} }', 'should parse a static and private method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Private, 'private');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { static protected function b() {} }', 'should parse a static and protected method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Protected, 'protected');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { static public function b() {} }', 'should parse a static and public method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Public, 'public');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('trait A { abstract final function b(); }', 'should not expect abstract and final modifiers', [ErrorCode.ERR_AbstractMemberIsFinal], [19]),
        new DiagnosticTestArgs('trait A { abstract private function b(); }', 'should not expect abstract and private modifiers', [ErrorCode.ERR_AbstractMemberIsPrivate], [19]),
        new DiagnosticTestArgs('trait A { abstract function b() {} }', 'should not expect method body on abstract method', [ErrorCode.ERR_AbstractMethodHasBody], [32]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('method-declaration (parameters)', function() {
      let syntaxTests = [
        new ParserTestArgs('trait A { function b($c) {} }', 'should parse a method parameter', (statements) => {
          let parameters = assertMethodDeclarationWithParameters(statements);
          assert.strictEqual(parameters.length, 1);
          assertMethodParameter(parameters[0], false, false, false, false, false);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let syntaxTests8_0 = [
        // NOTE: Promoted parameters are allowed on all methods, not just constructors.
        new ParserTestArgs('trait A { function __construct(public $c) {} }', 'should parse a method parameter with modifier', (statements, text) => {
          let parameters = assertMethodDeclarationWithParameters(statements);
          assert.strictEqual(parameters.length, 1);
          let param = assertMethodParameter(parameters[0], true, false, false, false, false);
          let modifiers = param.modifiers ? param.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
        }),
        new ParserTestArgs('trait A { function b(public static $c) {} }', 'should parse a method parameter with multiple modifiers', (statements, text) => {
          let parameters = assertMethodDeclarationWithParameters(statements);
          assert.strictEqual(parameters.length, 1);
          let param = assertMethodParameter(parameters[0], true, false, false, false, false);
          let modifiers = param.modifiers ? param.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Static, 'static');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests8_0, PhpVersion.PHP8_0);

      let diagnosticTests8_0 = [
        new DiagnosticTestArgs('trait A { function b(', 'missing ampersand, ellipsis, question, modifier, type, variable, or close paren', [ErrorCode.ERR_ParameterOrCloseParenExpected], [21]),
        new DiagnosticTestArgs('trait A { function b(public', 'missing ampersand, ellipsis, question, type, variable, or close paren', [ErrorCode.ERR_ParameterExpected], [27]),
      ];
      Test.assertDiagnostics(diagnosticTests8_0, PhpVersion.PHP8_0);

      let diagnosticRegressionTests8_0 = [
        new DiagnosticTestArgs('trait A { function b(', 'missing ampersand, ellipsis, question, type, variable, or close paren', [ErrorCode.ERR_ParameterOrCloseParenExpected], [21]),
        new DiagnosticTestArgs('trait A { function b(public', 'should not parse a modifier', [ErrorCode.ERR_FeatureConstructorParameterPromotion, ErrorCode.ERR_ParameterExpected], [21, 27]),
      ];
      Test.assertDiagnostics(diagnosticRegressionTests8_0, PhpVersion.PHP7_0, PhpVersion.PHP7_4);
    });

    describe('property-declaration', function() {
      let syntaxTests = [
        new ParserTestArgs('trait A { public $b; }', 'should parse a property declaration', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(declNode.type, null);
          assertPropertyElements(declNode, text, ['$b']);
        }),
        new ParserTestArgs('trait A { var $b; }', 'should parse a property declaration (var)', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Var, 'var');
          assert.strictEqual(declNode.type, null);
          assertPropertyElements(declNode, text, ['$b']);
        }),
        new ParserTestArgs('trait A { public $b = 1; }', 'should parse a property declaration with assignment', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(declNode.type, null);
          let elements = declNode.properties ? declNode.properties.childNodes() : [];
          assert.strictEqual(elements.length, 1);
          let propertyNode = <PropertyElementSyntaxNode>elements[0];
          assert.strictEqual(propertyNode instanceof PropertyElementSyntaxNode, true);
          Test.assertSyntaxToken(propertyNode.variable, text, TokenKind.Variable, '$b');
          assert.strictEqual(propertyNode.expression instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { public $b, $c; }', 'should parse a property declaration with multiple properties', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(declNode.type, null);
          assertPropertyElements(declNode, text, ['$b', '$c']);
        }),
        new ParserTestArgs('trait A { protected $b; }', 'should parse a protected property declaration', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Protected, 'protected');
          assert.strictEqual(declNode.type, null);
          assertPropertyElements(declNode, text, ['$b']);
        }),
        new ParserTestArgs('trait A { private $b; }', 'should parse a private property declaration', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Private, 'private');
          assert.strictEqual(declNode.type, null);
          assertPropertyElements(declNode, text, ['$b']);
        }),
        new ParserTestArgs('trait A { static $b; }', 'should parse a static property declaration', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          assert.strictEqual(declNode.type, null);
          assertPropertyElements(declNode, text, ['$b']);
        }),
        new ParserTestArgs('trait A { public static $b; }', 'should parse a static property declaration with visibility modifier (before)', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Static, 'static');
          assert.strictEqual(declNode.type, null);
          assertPropertyElements(declNode, text, ['$b']);
        }),
        new ParserTestArgs('trait A { static public $b; }', 'should parse a static property declaration with visibility modifier (after)', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Public, 'public');
          assert.strictEqual(declNode.type, null);
          assertPropertyElements(declNode, text, ['$b']);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let syntaxTests7_4 = [
        new ParserTestArgs('trait A { public B $c; }', 'should parse a typed property declaration', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(declNode.type instanceof NamedTypeSyntaxNode, true, 'NamedTypeSyntaxNode');
          assert.strictEqual((<NamedTypeSyntaxNode>declNode.type).question, null);
          assertPropertyElements(declNode, text, ['$c']);
        }),
        new ParserTestArgs('trait A { var B $c; }', 'should parse a typed property declaration (var)', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Var, 'var');
          assert.strictEqual(declNode.type instanceof NamedTypeSyntaxNode, true, 'NamedTypeSyntaxNode');
          assert.strictEqual((<NamedTypeSyntaxNode>declNode.type).question, null);
          assertPropertyElements(declNode, text, ['$c']);
        }),
        new ParserTestArgs('trait A { public \\B $c; }', 'should parse a typed property declaration with fully qualified name', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(declNode.type instanceof NamedTypeSyntaxNode, true, 'NamedTypeSyntaxNode');
          assert.strictEqual((<NamedTypeSyntaxNode>declNode.type).question, null);
          assertPropertyElements(declNode, text, ['$c']);
        }),
        new ParserTestArgs('trait A { public namespace\\B $c; }', 'should parse a typed property declaration with relative name', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(declNode.type instanceof NamedTypeSyntaxNode, true, 'NamedTypeSyntaxNode');
          assert.strictEqual((<NamedTypeSyntaxNode>declNode.type).question, null);
          assertPropertyElements(declNode, text, ['$c']);
        }),
        new ParserTestArgs('trait A { public array $c; }', 'should parse a property declaration with predefined type', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(declNode.type instanceof PredefinedTypeSyntaxNode, true, 'PredefinedTypeSyntaxNode');
          assert.strictEqual((<PredefinedTypeSyntaxNode>declNode.type).question, null);
          assertPropertyElements(declNode, text, ['$c']);
        }),
        new ParserTestArgs('trait A { public ?B $c; }', 'should parse a property declaration with nullable type', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.strictEqual(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(declNode.type instanceof NamedTypeSyntaxNode, true, 'NamedTypeSyntaxNode');
          assert.notStrictEqual((<NamedTypeSyntaxNode>declNode.type).question, null);
          assertPropertyElements(declNode, text, ['$c']);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests7_4, PhpVersion.PHP7_4);

      let diagnosticTests = [
        new DiagnosticTestArgs('trait A { var }', 'missing property', [ErrorCode.ERR_PropertyExpected], [13]),

        new DiagnosticTestArgs('trait A { abstract $b; }', 'should not parse an abstract property', [ErrorCode.ERR_BadPropertyModifier], [10]),
        new DiagnosticTestArgs('trait A { final $b; }', 'should not parse a final property', [ErrorCode.ERR_BadPropertyModifier], [10]),
      ];
      Test.assertDiagnostics(diagnosticTests);

      let diagnosticTests7_4 = [
        new DiagnosticTestArgs('trait A { public B }', 'missing property after type', [ErrorCode.ERR_PropertyExpected], [18]),
      ];
      Test.assertDiagnostics(diagnosticTests7_4, PhpVersion.PHP7_4);

      let featureTypedProperties = [
        new DiagnosticTestArgs('trait A { public B $c; }', 'should not parse a typed property', [ErrorCode.ERR_FeatureTypedProperties], [17]),
      ];
      Test.assertDiagnostics(featureTypedProperties, PhpVersion.PHP7_0, PhpVersion.PHP7_3);
    });

    describe('trait-use-clause', function() {
      let syntaxTests = [
        new ParserTestArgs('trait A { use B; }', 'should parse a trait use clause', (statements) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use \\B; }', 'should parse a trait use clause with fully qualified name', (statements) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof FullyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use namespace\\B; }', 'should parse a trait use clause with relative name', (statements) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof RelativeNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use B { } }', 'should parse a trait use clause with adaptations', (statements) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.strictEqual(traitUseGroup.adaptations, null);
        }),
        new ParserTestArgs('trait A { use B, C; }', 'should parse a trait use clause list', (statements) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 2);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.strictEqual(names[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use B, \\C; }', 'should parse a trait use clause list with fully qualified name', (statements) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 2);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.strictEqual(names[1] instanceof FullyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use B, namespace\\C; }', 'should parse a trait use clause list with relative name', (statements) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 2);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.strictEqual(names[1] instanceof RelativeNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use B, C { } }', 'should parse a trait use clause list with adaptations', (statements) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 2);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.strictEqual(names[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.strictEqual(traitUseGroup.adaptations, null);
        }),

        // Trait alias (named).
        new ParserTestArgs('trait A { use B { c as d; } }', 'should parse a trait alias', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { list as c; } }', 'should parse a trait alias with semi-reserved keyword as method name', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.List, 'list');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'c');
        }),
        new ParserTestArgs('trait A { use B { namespace as c; } }', 'should parse a trait alias with semi-reserved keyword as method name (namespace)', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Namespace, 'namespace');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'c');
        }),
        new ParserTestArgs('trait A { use B { c as list; } }', 'should parse a trait alias with semi-reserved keyword as alias', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.List, 'list');
        }),
        new ParserTestArgs('trait A { use B { c as public; } }', 'should parse a trait alias with public modifier', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Public, 'public');
          assert.strictEqual(aliasNode.alias, null);
        }),
        new ParserTestArgs('trait A { use B { c as protected; } }', 'should parse a trait alias with protected modifier', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Protected, 'protected');
          assert.strictEqual(aliasNode.alias, null);
        }),
        new ParserTestArgs('trait A { use B { c as private; } }', 'should parse a trait alias with private modifier', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Private, 'private');
          assert.strictEqual(aliasNode.alias, null);
        }),
        new ParserTestArgs('trait A { use B { c as public d; } }', 'should parse a trait alias with public modifier and alias', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Public, 'public');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { c as protected d; } }', 'should parse a trait alias with protected modifier and alias', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Protected, 'protected');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { c as private d; } }', 'should parse a trait alias with private modifier and alias', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Private, 'private');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),

        // Trait alias (referenced).
        new ParserTestArgs('trait A { use B { B::c as d; } }', 'should parse a trait alias using a method reference', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.strictEqual(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { B::list as c; } }', 'should parse a trait alias using a method reference with semi-reserved keyword as method name', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.strictEqual(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.List, 'list');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'c');
        }),
        new ParserTestArgs('trait A { use B { B::c as list; } }', 'should parse a trait alias using a method reference with semi-reserved keyword as alias', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.strictEqual(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.List, 'list');
        }),
        new ParserTestArgs('trait A { use B { B::c as public d; } }', 'should parse a trait alias using a method reference with public modifier and alias', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.strictEqual(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Public, 'public');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { B::c as protected d; } }', 'should parse a trait alias using a method reference with protected modifier and alias', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.strictEqual(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Protected, 'protected');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { B::c as private d; } }', 'should parse a trait alias using a method reference with private modifier and alias', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.strictEqual(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Private, 'private');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use \\B { \\B::c as d; } }', 'should parse a trait alias using a method reference with fully-qualified name', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof FullyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.strictEqual(reference.className instanceof FullyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use namespace\\B { namespace\\B::c as d; } }', 'should parse a trait alias using a method reference with relative name', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof RelativeNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.strictEqual(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.strictEqual(reference.className instanceof RelativeNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),

        // Trait precedence.
        new ParserTestArgs('trait A { use B { B::c insteadof D; } }', 'should parse a trait precedence adaptation', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let precedence = <TraitPrecedenceSyntaxNode>adaptations[0];
          assert.strictEqual(precedence instanceof TraitPrecedenceSyntaxNode, true);
          let reference = <MethodReferenceSyntaxNode>precedence.methodReference;
          assert.strictEqual(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          let traitNames = precedence.traitNames ? precedence.traitNames.childNodes() : [];
          assert.strictEqual(traitNames.length, 1);
          assert.strictEqual(traitNames[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use B { B::c insteadof D, E; } }', 'should parse a trait precedence adapataion list', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let precedence = <TraitPrecedenceSyntaxNode>adaptations[0];
          assert.strictEqual(precedence instanceof TraitPrecedenceSyntaxNode, true);
          let reference = <MethodReferenceSyntaxNode>precedence.methodReference;
          assert.strictEqual(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          let traitNames = precedence.traitNames ? precedence.traitNames.childNodes() : [];
          assert.strictEqual(traitNames.length, 2);
          assert.strictEqual(traitNames[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.strictEqual(traitNames[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use B { B::list insteadof D; } }', 'should parse a trait precedence adaptation with semi-reserved keyword as method name', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.strictEqual(names.length, 1);
          assert.strictEqual(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.strictEqual(adaptations.length, 1);
          let precedence = <TraitPrecedenceSyntaxNode>adaptations[0];
          assert.strictEqual(precedence instanceof TraitPrecedenceSyntaxNode, true);
          let reference = <MethodReferenceSyntaxNode>precedence.methodReference;
          assert.strictEqual(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.List, 'list');
          let traitNames = precedence.traitNames ? precedence.traitNames.childNodes() : [];
          assert.strictEqual(traitNames.length, 1);
          assert.strictEqual(traitNames[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('trait A { use }', 'missing class name', [ErrorCode.ERR_TypeExpected], [13]),
        new DiagnosticTestArgs('trait A { use \\ }', 'missing identifier', [ErrorCode.ERR_IdentifierExpected], [15]),
        new DiagnosticTestArgs('trait A { use B }', 'missing comma, open brace, or semicolon', [ErrorCode.ERR_IncompleteTraitUse], [15]),
        new DiagnosticTestArgs('trait A { use B, }', 'missing class name (in list)', [ErrorCode.ERR_TypeExpected], [16]),
        new DiagnosticTestArgs('trait A { use B, \\ }', 'missing identifier (in list)', [ErrorCode.ERR_IdentifierExpected], [18]),
        new DiagnosticTestArgs('trait A { use B, C }', 'missing comma, open brace, or semicolon (in list)', [ErrorCode.ERR_IncompleteTraitUse], [18]),

        new DiagnosticTestArgs('trait A { use B { }', 'missing close brace', [ErrorCode.ERR_CloseBraceExpected], [19]),
        new DiagnosticTestArgs('trait A { use B { c } }', 'missing adaptation keyword', [ErrorCode.ERR_IncompleteTraitAdaptation], [18]),  // Placed on node.
        new DiagnosticTestArgs('trait A { use B { c as } }', 'missing alias name', [ErrorCode.ERR_MethodNameExpected], [22]),
        new DiagnosticTestArgs('trait A { use B { c as d } }', 'missing semicolon after alias', [ErrorCode.ERR_SemicolonExpected], [24]),

        new DiagnosticTestArgs('trait A { use B { B:: } }', 'missing method name', [ErrorCode.ERR_MethodNameExpected], [21]),
        new DiagnosticTestArgs('trait A { use B { B::c } }', 'missing adaptation keyword (using method reference)', [ErrorCode.ERR_TraitAdaptationKeywordExpected], [18]),  // Placed on node.
        new DiagnosticTestArgs('trait A { use B { B::c as } }', 'missing alias name (using method reference)', [ErrorCode.ERR_MethodNameExpected], [25]),
        new DiagnosticTestArgs('trait A { use B { B::c insteadof } }', 'missing precedence class name', [ErrorCode.ERR_TypeExpected], [32]),
        new DiagnosticTestArgs('trait A { use B { B::c insteadof D } }', 'missing semicolon after precedence', [ErrorCode.ERR_SemicolonExpected], [34]),

        new DiagnosticTestArgs('trait A { use B { c as abstract d; } }', 'should not parse trait alias with abstract modifier', [ErrorCode.ERR_BadTraitAliasModifier], [23]),
        new DiagnosticTestArgs('trait A { use B { c as final d; } }', 'should not parse trait alias with final modifier', [ErrorCode.ERR_BadTraitAliasModifier], [23]),
        new DiagnosticTestArgs('trait A { use B { c as static d; } }', 'should not parse trait alias with static modifier', [ErrorCode.ERR_BadTraitAliasModifier], [23]),

        new DiagnosticTestArgs('trait A { use B { B::c insteadof list } }', 'should not parse semi-reserved keyword as trait precedence class name', [ErrorCode.ERR_TypeExpected], [32]),

        // @todo These should be recovery tests.
        new DiagnosticTestArgs('trait A { use B { c d } }', 'should not parse trait adaptation if keyword is missing', [ErrorCode.ERR_IncompleteTraitAdaptation, ErrorCode.ERR_IncompleteTraitAdaptation], [18, 20]),  // Placed on node.
        new DiagnosticTestArgs('trait A { use B { c insteadof } }', 'should not parse trait adaptation if method name is ambiguous', [ErrorCode.ERR_IncompleteMethodReference], [19]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

  });

});
