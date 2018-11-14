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
  FullyQualifiedNameSyntaxNode,
  LiteralSyntaxNode,
  MethodDeclarationSyntaxNode,
  MethodReferenceSyntaxNode,
  NamedTraitAliasSyntaxNode,
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
  TypeSyntaxNode
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { ISyntaxNode } from '../../../src/language/syntax/ISyntaxNode';
import { TokenKind } from '../../../src/language/TokenKind';

function assertMethodDeclaration(statements: ISyntaxNode[]): MethodDeclarationSyntaxNode {
  let traitNode = <TraitDeclarationSyntaxNode>statements[0];
  assert.equal(traitNode instanceof TraitDeclarationSyntaxNode, true, 'TraitDeclarationSyntaxNode');
  let members = traitNode.members ? traitNode.members.childNodes() : [];
  assert.equal(members.length, 1);
  let method = <MethodDeclarationSyntaxNode>members[0];
  assert.equal(method instanceof MethodDeclarationSyntaxNode, true);
  return method;
}

function assertPropertyDeclaration(statements: ISyntaxNode[]): PropertyDeclarationSyntaxNode {
  let traitNode = <TraitDeclarationSyntaxNode>statements[0];
  assert.equal(traitNode instanceof TraitDeclarationSyntaxNode, true, 'TraitDeclarationSyntaxNode');
  let members = traitNode.members ? traitNode.members.childNodes() : [];
  assert.equal(members.length, 1);
  let property = <PropertyDeclarationSyntaxNode>members[0];
  assert.equal(property instanceof PropertyDeclarationSyntaxNode, true);
  return property;
}

function assertTraitUse(statements: ISyntaxNode[]): TraitUseSyntaxNode {
  let traitNode = <TraitDeclarationSyntaxNode>statements[0];
  assert.equal(traitNode instanceof TraitDeclarationSyntaxNode, true, 'TraitDeclarationSyntaxNode');
  let members = traitNode.members ? traitNode.members.childNodes() : [];
  assert.equal(members.length, 1);
  let traitUse = <TraitUseSyntaxNode>members[0];
  assert.equal(traitUse instanceof TraitUseSyntaxNode, true);
  return traitUse;
}

function assertTraitUseGroup(statements: ISyntaxNode[]): TraitUseGroupSyntaxNode {
  let traitNode = <TraitDeclarationSyntaxNode>statements[0];
  assert.equal(traitNode instanceof TraitDeclarationSyntaxNode, true, 'TraitDeclarationSyntaxNode');
  let members = traitNode.members ? traitNode.members.childNodes() : [];
  assert.equal(members.length, 1);
  let traitUseGroup = <TraitUseGroupSyntaxNode>members[0];
  assert.equal(traitUseGroup instanceof TraitUseGroupSyntaxNode, true);
  return traitUseGroup;
}

describe('PhpParser', function() {

  describe('trait-declaration', function() {
    let syntaxTests = [
      new ParserTestArgs('trait A {}', 'should parse a trait declaration', (statements, text) => {
        let traitNode = <TraitDeclarationSyntaxNode>statements[0];
        assert.equal(traitNode instanceof TraitDeclarationSyntaxNode, true, 'TraitDeclarationSyntaxNode');
        Test.assertSyntaxToken(traitNode.identifier, text, TokenKind.Identifier, 'A');
        assert.strictEqual(traitNode.members, null);
      }),
      new ParserTestArgs('{ trait A {} }', 'should parse a trait declaration in statement block', (statements) => {
        let block = <StatementBlockSyntaxNode>statements[0];
        assert.equal(block instanceof StatementBlockSyntaxNode, true, 'is a StatementBlockSyntaxNode');
        let innerStatements = block.childNodes();
        assert.equal(innerStatements.length, 1);
        assert.equal(innerStatements[0] instanceof TraitDeclarationSyntaxNode, true);
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
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('class-const-declaration', function() {
      let diagnosticTests = [
        new DiagnosticTestArgs('trait A { const B = 1; }', 'should not parse a class constant declaration', [ErrorCode.ERR_TraitConstant], [10]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('property-declaration', function() {
      let syntaxTests = [
        new ParserTestArgs('trait A { public $b; }', 'should parse a property declaration', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          let elements = declNode.properties ? declNode.properties.childNodes() : [];
          assert.equal(elements.length, 1);
          let propertyNode = <PropertyElementSyntaxNode>elements[0];
          assert.equal(propertyNode instanceof PropertyElementSyntaxNode, true);
          Test.assertSyntaxToken(propertyNode.variable, text, TokenKind.Variable, '$b');
          assert.strictEqual(propertyNode.expression, null);
        }),
        new ParserTestArgs('trait A { public $b = 1; }', 'should parse a property declaration with assignment', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          let elements = declNode.properties ? declNode.properties.childNodes() : [];
          assert.equal(elements.length, 1);
          let propertyNode = <PropertyElementSyntaxNode>elements[0];
          assert.equal(propertyNode instanceof PropertyElementSyntaxNode, true);
          Test.assertSyntaxToken(propertyNode.variable, text, TokenKind.Variable, '$b');
          assert.equal(propertyNode.expression instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { public $b, $c; }', 'should parse a property declaration with multiple properties', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          let elements = declNode.properties ? declNode.properties.childNodes() : [];
          assert.equal(elements.length, 2);
          let firstProperty = <PropertyElementSyntaxNode>elements[0];
          assert.equal(firstProperty instanceof PropertyElementSyntaxNode, true);
          Test.assertSyntaxToken(firstProperty.variable, text, TokenKind.Variable, '$b');
          assert.strictEqual(firstProperty.expression, null);
          let secondProperty = <PropertyElementSyntaxNode>elements[1];
          assert.equal(secondProperty instanceof PropertyElementSyntaxNode, true);
          Test.assertSyntaxToken(secondProperty.variable, text, TokenKind.Variable, '$c');
          assert.strictEqual(secondProperty.expression, null);
        }),
        new ParserTestArgs('trait A { protected $b; }', 'should parse a protected property declaration', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Protected, 'protected');
          let elements = declNode.properties ? declNode.properties.childNodes() : [];
          assert.equal(elements.length, 1);
          let propertyNode = <PropertyElementSyntaxNode>elements[0];
          assert.equal(propertyNode instanceof PropertyElementSyntaxNode, true);
          Test.assertSyntaxToken(propertyNode.variable, text, TokenKind.Variable, '$b');
          assert.strictEqual(propertyNode.expression, null);
        }),
        new ParserTestArgs('trait A { private $b; }', 'should parse a private property declaration', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Private, 'private');
          let elements = declNode.properties ? declNode.properties.childNodes() : [];
          assert.equal(elements.length, 1);
          let propertyNode = <PropertyElementSyntaxNode>elements[0];
          assert.equal(propertyNode instanceof PropertyElementSyntaxNode, true);
          Test.assertSyntaxToken(propertyNode.variable, text, TokenKind.Variable, '$b');
          assert.strictEqual(propertyNode.expression, null);
        }),
        new ParserTestArgs('trait A { static $b; }', 'should parse a static property declaration', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          let elements = declNode.properties ? declNode.properties.childNodes() : [];
          assert.equal(elements.length, 1);
          let propertyNode = <PropertyElementSyntaxNode>elements[0];
          assert.equal(propertyNode instanceof PropertyElementSyntaxNode, true);
          Test.assertSyntaxToken(propertyNode.variable, text, TokenKind.Variable, '$b');
          assert.strictEqual(propertyNode.expression, null);
        }),
        new ParserTestArgs('trait A { public static $b; }', 'should parse a static property declaration with visibility modifier (before)', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Static, 'static');
          let elements = declNode.properties ? declNode.properties.childNodes() : [];
          assert.equal(elements.length, 1);
          let propertyNode = <PropertyElementSyntaxNode>elements[0];
          assert.equal(propertyNode instanceof PropertyElementSyntaxNode, true);
          Test.assertSyntaxToken(propertyNode.variable, text, TokenKind.Variable, '$b');
          assert.strictEqual(propertyNode.expression, null);
        }),
        new ParserTestArgs('trait A { static public $b; }', 'should parse a static property declaration with visibility modifier (after)', (statements, text) => {
          let declNode = assertPropertyDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Public, 'public');
          let elements = declNode.properties ? declNode.properties.childNodes() : [];
          assert.equal(elements.length, 1);
          let propertyNode = <PropertyElementSyntaxNode>elements[0];
          assert.equal(propertyNode instanceof PropertyElementSyntaxNode, true);
          Test.assertSyntaxToken(propertyNode.variable, text, TokenKind.Variable, '$b');
          assert.strictEqual(propertyNode.expression, null);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);
    });

    // Everything except for the parameter list and statement block needs full
    // testing since it uses a different implementation than `function-declaration`.
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

        // Modifiers.
        new ParserTestArgs('trait A { abstract function b(); }', 'should parse an abstract method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { private function b() {} }', 'should parse a private method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Private, 'private');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { protected function b() {} }', 'should parse a protected method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Protected, 'protected');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { public function b() {} }', 'should parse a public method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { static function b() {} }', 'should parse a static method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),

        // Modifiers (mixed).
        new ParserTestArgs('trait A { abstract protected function b(); }', 'should parse an abstract and protected method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Protected, 'protected');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { abstract public function b(); }', 'should parse an abstract and public method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Public, 'public');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { abstract static function b(); }', 'should parse an abstract and static method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Static, 'static');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { static final function b() {} }', 'should parse a static and final method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Final, 'final');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { static public function b() {} }', 'should parse a static and public method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Public, 'public');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { static protected function b() {} }', 'should parse a static and protected method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Protected, 'protected');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('trait A { static private function b() {} }', 'should parse a static and private method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Private, 'private');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),

        // Return types.
        new ParserTestArgs('trait A { function b(): C {} }', 'should parse a method declaration with return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof TypeSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { function b(): \\C {} }', 'should parse a method declaration with fully qualified return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof TypeSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { function b(): namespace\\C {} }', 'should parse a method declaration with relative return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof TypeSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { function b(): array {} }', 'should parse a method declaration with predefined return type (array)', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof PredefinedTypeSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { function b(): callable {} }', 'should parse a method declaration with predefined return type (callable)', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof PredefinedTypeSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('trait A { function }', 'missing method name or ampersand', [ErrorCode.ERR_MethodNameOrAmpersandExpected], [18]),
        new DiagnosticTestArgs('trait A { function &', 'missing method name (after ampersand)', [ErrorCode.ERR_MethodNameExpected], [20]),
        new DiagnosticTestArgs('trait A { function b }', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [20]),
        new DiagnosticTestArgs('trait A { function b( }', 'missing ampersand, ellipsis, question, type, variable, or close paren', [ErrorCode.ERR_ParameterOrCloseParenExpected], [21]),
        new DiagnosticTestArgs('trait A { function b() }', 'missing open brace or colon', [ErrorCode.ERR_OpenBraceOrColonExpected], [22]),

        new DiagnosticTestArgs('trait A { function b():', 'missing return type', [ErrorCode.ERR_TypeExpected], [23]),
        new DiagnosticTestArgs('trait A { function b(): C\\ }', 'missing identifier in return type', [ErrorCode.ERR_IdentifierExpected], [26]),
        new DiagnosticTestArgs('trait A { function b(): \\ }', 'missing identifier in return type (fully qualified name)', [ErrorCode.ERR_IdentifierExpected], [25]),
        new DiagnosticTestArgs('trait A { function b(); }', 'should not expect a semicolon after a non-abstract method declaration', [ErrorCode.ERR_OpenBraceOrColonExpected], [22]),

        // @todo Improve error message.
        new DiagnosticTestArgs('trait A { abstract function b() }', 'missing colon or semicolon', [ErrorCode.ERR_SemicolonExpected], [31]),
        new DiagnosticTestArgs('trait A { abstract function b() {} }', 'should not expect method body on abstract method', [ErrorCode.ERR_AbstractMethodHasBody], [32]),
        new DiagnosticTestArgs('trait A { abstract final function b(); }', 'should not expect abstract and final modifiers', [ErrorCode.ERR_AbstractMemberIsFinal], [19]),
        new DiagnosticTestArgs('trait A { abstract private function b(); }', 'should not expect abstract and private modifiers', [ErrorCode.ERR_AbstractMemberIsPrivate], [19]),

        // @todo These should be recovery tests.
        new DiagnosticTestArgs('trait A { function b() { }', 'missing close brace', [ErrorCode.ERR_CloseBraceExpected], [26]),
        new DiagnosticTestArgs('trait A { function b() { public $c; }', 'missing close brace with trailing class member', [ErrorCode.ERR_CloseBraceExpected], [24]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('trait-use-clause', function() {
      let syntaxTests = [
        new ParserTestArgs('trait A { use B; }', 'should parse a trait use clause', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use \\B; }', 'should parse a trait use clause with fully qualified name', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof FullyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use namespace\\B; }', 'should parse a trait use clause with relative name', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof RelativeNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use B { } }', 'should parse a trait use clause with adaptations', (statements) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.strictEqual(traitUseGroup.adaptations, null);
        }),
        new ParserTestArgs('trait A { use B, C; }', 'should parse a trait use clause list', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 2);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.equal(names[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use B, \\C; }', 'should parse a trait use clause list with fully qualified name', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 2);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.equal(names[1] instanceof FullyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use B, namespace\\C; }', 'should parse a trait use clause list with relative name', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 2);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.equal(names[1] instanceof RelativeNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use B, C { } }', 'should parse a trait use clause list with adaptations', (statements) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 2);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.equal(names[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.strictEqual(traitUseGroup.adaptations, null);
        }),

        // Trait alias.
        new ParserTestArgs('trait A { use B { c as d; } }', 'should parse a trait alias', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { c as list; } }', 'should parse a trait alias with semi-reserved keyword', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.List, 'list');
        }),
        new ParserTestArgs('trait A { use B { c as public; } }', 'should parse a trait alias with public modifier', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Public, 'public');
          assert.strictEqual(aliasNode.alias, null);
        }),
        new ParserTestArgs('trait A { use B { c as protected; } }', 'should parse a trait alias with protected modifier', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Protected, 'protected');
          assert.strictEqual(aliasNode.alias, null);
        }),
        new ParserTestArgs('trait A { use B { c as private; } }', 'should parse a trait alias with private modifier', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Private, 'private');
          assert.strictEqual(aliasNode.alias, null);
        }),
        new ParserTestArgs('trait A { use B { c as public d; } }', 'should parse a trait alias with public modifier and name', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Public, 'public');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { c as protected d; } }', 'should parse a trait alias with protected modifier and name', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Protected, 'protected');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { c as private d; } }', 'should parse a trait alias with private modifier and name', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <NamedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof NamedTraitAliasSyntaxNode, true);
          Test.assertSyntaxToken(aliasNode.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Private, 'private');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),

        // Trait alias (absolute reference).
        new ParserTestArgs('trait A { use B { B::c as d; } }', 'should parse a trait alias (method reference)', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.equal(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { B::c as list; } }', 'should parse a trait alias with semi-reserved keyword (method reference)', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.equal(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.List, 'list');
        }),
        new ParserTestArgs('trait A { use B { B::c as public d; } }', 'should parse a trait alias with public modifier (method reference)', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.equal(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Public, 'public');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { B::c as protected d; } }', 'should parse a trait alias with protected modifier (method reference)', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.equal(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Protected, 'protected');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
        new ParserTestArgs('trait A { use B { B::c as private d; } }', 'should parse a trait alias with private modifier (method reference)', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let aliasNode = <ReferencedTraitAliasSyntaxNode>adaptations[0];
          assert.equal(aliasNode instanceof ReferencedTraitAliasSyntaxNode, true);
          assert.notStrictEqual(aliasNode.reference, null);
          let reference = <MethodReferenceSyntaxNode>aliasNode.reference;
          assert.equal(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          Test.assertSyntaxToken(aliasNode.modifier, text, TokenKind.Private, 'private');
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'd');
        }),
      //new ParserTestArgs('trait A { use B { B::list as c; } }', 'should parse a method reference with semi-reserved keyword'),

        // Trait precedence.
        new ParserTestArgs('trait A { use B { B::c insteadof D; } }', 'should parse a trait precedence adaptation', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let precedence = <TraitPrecedenceSyntaxNode>adaptations[0];
          assert.equal(precedence instanceof TraitPrecedenceSyntaxNode, true);
          let reference = <MethodReferenceSyntaxNode>precedence.methodReference;
          assert.equal(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          let traitNames = precedence.traitNames ? precedence.traitNames.childNodes() : [];
          assert.equal(traitNames.length, 1);
          assert.equal(traitNames[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('trait A { use B { B::c insteadof D, E; } }', 'should parse a trait precedence adapataion list', (statements, text) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          let adaptations = traitUseGroup.adaptations ? traitUseGroup.adaptations.childNodes() : [];
          assert.equal(adaptations.length, 1);
          let precedence = <TraitPrecedenceSyntaxNode>adaptations[0];
          assert.equal(precedence instanceof TraitPrecedenceSyntaxNode, true);
          let reference = <MethodReferenceSyntaxNode>precedence.methodReference;
          assert.equal(reference.className instanceof PartiallyQualifiedNameSyntaxNode, true);
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.Identifier, 'c');
          let traitNames = precedence.traitNames ? precedence.traitNames.childNodes() : [];
          assert.equal(traitNames.length, 2);
          assert.equal(traitNames[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.equal(traitNames[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
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
        new DiagnosticTestArgs('trait A { use B { c insteadof } }', 'should not parse trait adaptation if method name is ambiguous', [ErrorCode.ERR_MalformedMethodReference], [19]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

  });

});
