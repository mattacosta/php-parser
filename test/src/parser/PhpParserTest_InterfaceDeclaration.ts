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
  ClassConstantDeclarationSyntaxNode,
  ClassConstantElementSyntaxNode,
  FullyQualifiedNameSyntaxNode,
  InterfaceDeclarationSyntaxNode,
  LiteralSyntaxNode,
  MethodDeclarationSyntaxNode,
  NamedTypeSyntaxNode,
  PartiallyQualifiedNameSyntaxNode,
  PredefinedTypeSyntaxNode,
  RelativeNameSyntaxNode,
  StatementBlockSyntaxNode,
  TypeSyntaxNode,
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { ISyntaxNode } from '../../../src/language/syntax/ISyntaxNode';
import { PhpVersion } from '../../../src/parser/PhpVersion';
import { TokenKind } from '../../../src/language/TokenKind';

function assertClassConstantDeclaration(statements: ISyntaxNode[]): ClassConstantDeclarationSyntaxNode {
  let interfaceNode = <InterfaceDeclarationSyntaxNode>statements[0];
  assert.equal(interfaceNode instanceof InterfaceDeclarationSyntaxNode, true, 'is a InterfaceDeclarationSyntaxNode');
  let members = interfaceNode.members ? interfaceNode.members.childNodes() : [];
  assert.equal(members.length, 1);
  let classConstant = <ClassConstantDeclarationSyntaxNode>members[0];
  assert.equal(classConstant instanceof ClassConstantDeclarationSyntaxNode, true);
  return classConstant;
}

function assertMethodDeclaration(statements: ISyntaxNode[]): MethodDeclarationSyntaxNode {
  let interfaceNode = <InterfaceDeclarationSyntaxNode>statements[0];
  assert.equal(interfaceNode instanceof InterfaceDeclarationSyntaxNode, true, 'is a InterfaceDeclarationSyntaxNode');
  let members = interfaceNode.members ? interfaceNode.members.childNodes() : [];
  assert.equal(members.length, 1);
  let method = <MethodDeclarationSyntaxNode>members[0];
  assert.equal(method instanceof MethodDeclarationSyntaxNode, true);
  return method;
}

describe('PhpParser', function() {

  describe('interface-declaration', function() {
    let syntaxTests = [
      new ParserTestArgs('interface A {}', 'should parse an interface declaration', (statements, text) => {
        let interfaceNode = <InterfaceDeclarationSyntaxNode>statements[0];
        assert.equal(interfaceNode instanceof InterfaceDeclarationSyntaxNode, true, 'is a InterfaceDeclarationSyntaxNode');
        Test.assertSyntaxToken(interfaceNode.identifier, text, TokenKind.Identifier, 'A');
        assert.strictEqual(interfaceNode.baseInterfaces, null);
        assert.strictEqual(interfaceNode.members, null);
      }),
      new ParserTestArgs('{ interface A {} }', 'should parse an interface declaration in statement block', (statements) => {
        let block = <StatementBlockSyntaxNode>statements[0];
        assert.equal(block instanceof StatementBlockSyntaxNode, true, 'is a StatementBlockSyntaxNode');
        let innerStatements = block.childNodes();
        assert.equal(innerStatements.length, 1);
        assert.equal(innerStatements[0] instanceof InterfaceDeclarationSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    // let recoveryTests = [
    //   new ParserTestArgs('interface A }', 'should not consume closing brace if opening brace is missing')
    // ];
    // Test.assertSyntaxNodes(recoveryTests, false);

    let diagnosticTests = [
      new DiagnosticTestArgs('interface', 'missing identifier', [ErrorCode.ERR_IdentifierExpected], [9]),
      new DiagnosticTestArgs('interface A', 'missing base clause or open brace', [ErrorCode.ERR_IncompleteInterfaceDeclaration], [11]),
      new DiagnosticTestArgs('interface A {', 'missing close brace', [ErrorCode.ERR_CloseBraceExpected], [13]),
      new DiagnosticTestArgs('interface A implements {}', 'should not parse an implements list', [ErrorCode.ERR_InterfaceImplementsList], [12]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('interface-base-clause', function() {
    let syntaxTests = [
      new ParserTestArgs('interface A extends B {}', 'should parse an interface declaration with single base type', (statements) => {
        let interfaceNode = <InterfaceDeclarationSyntaxNode>statements[0];
        assert.equal(interfaceNode instanceof InterfaceDeclarationSyntaxNode, true, 'is a InterfaceDeclarationSyntaxNode');
        let interfaces = interfaceNode.baseInterfaces ? interfaceNode.baseInterfaces.childNodes() : [];
        assert.equal(interfaces.length, 1);
        assert.equal(interfaces[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(interfaceNode.members, null);
      }),
      new ParserTestArgs('interface A extends B, C {}', 'should parse an interface declaration with multiple base types', (statements) => {
        let interfaceNode = <InterfaceDeclarationSyntaxNode>statements[0];
        assert.equal(interfaceNode instanceof InterfaceDeclarationSyntaxNode, true, 'is a InterfaceDeclarationSyntaxNode');
        let interfaces = interfaceNode.baseInterfaces ? interfaceNode.baseInterfaces.childNodes() : [];
        assert.equal(interfaces.length, 2);
        assert.equal(interfaces[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.equal(interfaces[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(interfaceNode.members, null);
      }),
      new ParserTestArgs('interface A extends \\B {}', 'should parse an interface declaration with fully qualified base type', (statements) => {
        let interfaceNode = <InterfaceDeclarationSyntaxNode>statements[0];
        assert.equal(interfaceNode instanceof InterfaceDeclarationSyntaxNode, true, 'is a InterfaceDeclarationSyntaxNode');
        let interfaces = interfaceNode.baseInterfaces ? interfaceNode.baseInterfaces.childNodes() : [];
        assert.equal(interfaces.length, 1);
        assert.equal(interfaces[0] instanceof FullyQualifiedNameSyntaxNode, true);
        assert.strictEqual(interfaceNode.members, null);
      }),
      new ParserTestArgs('interface A extends namespace\\B {}', 'should parse an interface declaration with relative base type', (statements) => {
        let interfaceNode = <InterfaceDeclarationSyntaxNode>statements[0];
        assert.equal(interfaceNode instanceof InterfaceDeclarationSyntaxNode, true, 'is a InterfaceDeclarationSyntaxNode');
        let interfaces = interfaceNode.baseInterfaces ? interfaceNode.baseInterfaces.childNodes() : [];
        assert.equal(interfaces.length, 1);
        assert.equal(interfaces[0] instanceof RelativeNameSyntaxNode, true);
        assert.strictEqual(interfaceNode.members, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('interface A extends', 'missing base type', [ErrorCode.ERR_TypeExpected], [19]),
      new DiagnosticTestArgs('interface A extends B', 'missing comma or open brace', [ErrorCode.ERR_CommaOrOpenBraceExpected], [21]),
      new DiagnosticTestArgs('interface A extends B,', 'missing base type (in list)', [ErrorCode.ERR_TypeExpected], [22]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('interface-member-declarations', function() {

    // @todo Add test for ERR_InvalidMemberDeclaration.

    describe('modifiers', function() {
      let diagnosticTests = [
        new DiagnosticTestArgs('interface A { public }', 'missing const or function', [ErrorCode.ERR_InterfaceMemberExpected], [14]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('class-const-declaration', function() {
      let syntaxTests = [
        new ParserTestArgs('interface A { const B = 1; }', 'should parse a class constant declaration', (statements, text) => {
          let declNode = assertClassConstantDeclaration(statements);
          assert.strictEqual(declNode.modifiers, null);
          let elements = declNode.elements ? declNode.elements.childNodes() : [];
          assert.equal(elements.length, 1);
          let constNode = <ClassConstantElementSyntaxNode>elements[0];
          assert.equal(constNode instanceof ClassConstantElementSyntaxNode, true);
          Test.assertSyntaxToken(constNode.identifierOrKeyword, text, TokenKind.Identifier, 'B');
          assert.equal(constNode.expression instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('interface A { const B = 1, C = 2; }', 'should parse a class constant declaration with multiple elements', (statements, text) => {
          let declNode = assertClassConstantDeclaration(statements);
          assert.strictEqual(declNode.modifiers, null);
          let elements = declNode.elements ? declNode.elements.childNodes() : [];
          assert.equal(elements.length, 2);
          let firstConst = <ClassConstantElementSyntaxNode>elements[0];
          assert.equal(firstConst instanceof ClassConstantElementSyntaxNode, true);
          Test.assertSyntaxToken(firstConst.identifierOrKeyword, text, TokenKind.Identifier, 'B');
          assert.equal(firstConst.expression instanceof LiteralSyntaxNode, true);
          let secondConst = <ClassConstantElementSyntaxNode>elements[1];
          assert.equal(secondConst instanceof ClassConstantElementSyntaxNode, true);
          Test.assertSyntaxToken(secondConst.identifierOrKeyword, text, TokenKind.Identifier, 'C');
          assert.equal(secondConst.expression instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('interface A { const foreach = 1; }', 'should parse a class constant declaration with a semi-reserved name', (statements, text) => {
          let declNode = assertClassConstantDeclaration(statements);
          assert.strictEqual(declNode.modifiers, null);
          let elements = declNode.elements ? declNode.elements.childNodes() : [];
          assert.equal(elements.length, 1);
          let constNode = <ClassConstantElementSyntaxNode>elements[0];
          assert.equal(constNode instanceof ClassConstantElementSyntaxNode, true);
          Test.assertSyntaxToken(constNode.identifierOrKeyword, text, TokenKind.ForEach, 'foreach');
          assert.equal(constNode.expression instanceof LiteralSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let syntaxTests7_1 = [
        new ParserTestArgs('interface A { public const B = 1; }', 'should parse a public class constant declaration', (statements, text) => {
          let declNode = assertClassConstantDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          let elements = declNode.elements ? declNode.elements.childNodes() : [];
          assert.equal(elements.length, 1);
          let constNode = <ClassConstantElementSyntaxNode>elements[0];
          assert.equal(constNode instanceof ClassConstantElementSyntaxNode, true);
          Test.assertSyntaxToken(constNode.identifierOrKeyword, text, TokenKind.Identifier, 'B');
          assert.equal(constNode.expression instanceof LiteralSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests7_1, PhpVersion.PHP7_1);

      let diagnosticTests = [
        new DiagnosticTestArgs('interface A { const }', 'missing identifier and assignment', [ErrorCode.ERR_IdentifierExpected], [19]),
        new DiagnosticTestArgs('interface A { const B }', 'missing assignment', [ErrorCode.ERR_Syntax], [21]),
        new DiagnosticTestArgs('interface A { const B = }', 'missing expression', [ErrorCode.ERR_ExpressionExpected], [23]),
        new DiagnosticTestArgs('interface A { const B = 1 }', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [25]),
        new DiagnosticTestArgs('interface A { abstract const B = 1; }', 'abstract modifier', [ErrorCode.ERR_BadInterfaceModifier, ErrorCode.ERR_BadConstantModifier], [14, 14]),
        new DiagnosticTestArgs('interface A { protected const B = 1; }', 'protected modifier', [ErrorCode.ERR_InterfaceMemberNotPublic], [14]),
        new DiagnosticTestArgs('interface A { private const B = 1; }', 'private modifier', [ErrorCode.ERR_InterfaceMemberNotPublic], [14]),
        new DiagnosticTestArgs('interface A { final const B = 1; }', 'final modifier', [ErrorCode.ERR_BadInterfaceModifier, ErrorCode.ERR_BadConstantModifier], [14, 14]),
        new DiagnosticTestArgs('interface A { static const B = 1; }', 'static modifier', [ErrorCode.ERR_BadConstantModifier], [14, 14]),
        new DiagnosticTestArgs('interface A { const class = 1; }', 'should not parse a class constant declaration with a reserved name', [ErrorCode.ERR_IdentifierExpectedKeyword], [20]),
      ];
      Test.assertDiagnostics(diagnosticTests);

      let diagnosticTests7_0 = [
        new DiagnosticTestArgs('class A { public const B = 1; }', 'public modifier', [ErrorCode.ERR_FeatureClassConstantModifiers], [10]),
      ];
      Test.assertDiagnostics(diagnosticTests7_0, PhpVersion.PHP7_0, PhpVersion.PHP7_0);
    });

    describe('property-declaration', function() {
      let diagnosticTests = [
        new DiagnosticTestArgs('interface A { abstract $b; }', 'should not parse an abstract property', [ErrorCode.ERR_BadInterfaceModifier, ErrorCode.ERR_InterfaceProperty], [14, 23]),
        new DiagnosticTestArgs('interface A { final $b; }', 'should not parse a final property', [ErrorCode.ERR_BadInterfaceModifier, ErrorCode.ERR_InterfaceProperty], [14, 20]),
        new DiagnosticTestArgs('interface A { public $b; }', 'should not parse a public property', [ErrorCode.ERR_InterfaceProperty], [21]),
        new DiagnosticTestArgs('interface A { protected $b; }', 'should not parse a protected property', [ErrorCode.ERR_InterfaceMemberNotPublic, ErrorCode.ERR_InterfaceProperty], [14, 24]),
        new DiagnosticTestArgs('interface A { private $b; }', 'should not parse a private property', [ErrorCode.ERR_InterfaceMemberNotPublic, ErrorCode.ERR_InterfaceProperty], [14, 22]),
        new DiagnosticTestArgs('interface A { static $b; }', 'should not parse a static property', [ErrorCode.ERR_InterfaceProperty], [21]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    // Everything except for the parameter list and statement block needs full
    // testing since it uses a different implementation than `function-declaration`.
    describe('method-declaration', function() {
      let syntaxTests = [
        new ParserTestArgs('interface A { function b(); }', 'should parse a method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
          assert.strictEqual(method.statements, null);
        }),
        new ParserTestArgs('interface A { function list(); }', 'should parse a method declaration with semi-reserved keyword', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.List, 'list');
          assert.strictEqual(method.returnType, null);
          assert.strictEqual(method.statements, null);
        }),
        new ParserTestArgs('interface A { function &b(); }', 'should parse a method declaration with ampersand', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.notStrictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
          assert.strictEqual(method.statements, null);
        }),

        // Modifiers.
        new ParserTestArgs('interface A { public function b(); }', 'should parse a public method declaration without body', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
          assert.strictEqual(method.statements, null);
        }),
        new ParserTestArgs('interface A { static function b(); }', 'should parse a static method declaration without body', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
          assert.strictEqual(method.statements, null);
        }),

        // Modifiers (mixed).
        new ParserTestArgs('interface A { static public function b(); }', 'should parse a static and public method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Public, 'public');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
          assert.strictEqual(method.statements, null);
        }),

        // Return types.
        new ParserTestArgs('interface A { function b(): C; }', 'should parse a method declaration with return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof TypeSyntaxNode, true);
          assert.strictEqual(method.statements, null);
        }),
        new ParserTestArgs('interface A { function b(): \\C; }', 'should parse a method declaration with fully qualified return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof TypeSyntaxNode, true);
          assert.strictEqual(method.statements, null);
        }),
        new ParserTestArgs('interface A { function b(): namespace\\C; }', 'should parse a method declaration with relative return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof TypeSyntaxNode, true);
          assert.strictEqual(method.statements, null);
        }),
        new ParserTestArgs('interface A { function b(): array; }', 'should parse a method declaration with predefined return type (array)', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof PredefinedTypeSyntaxNode, true);
          assert.strictEqual(method.statements, null);
        }),
        new ParserTestArgs('interface A { function b(): callable; }', 'should parse a method declaration with predefined return type (callable)', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof PredefinedTypeSyntaxNode, true);
          assert.strictEqual(method.statements, null);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let syntaxTests7_1 = [
        new ParserTestArgs('interface A { function b(): ? C; }', 'should parse a method declaration with nullable return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          let returnType = <NamedTypeSyntaxNode>method.returnType;
          assert.equal(returnType instanceof NamedTypeSyntaxNode, true, 'NamedTypeSyntaxNode');
          assert.notStrictEqual(returnType.question, null);
          assert.equal(returnType.typeName instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests7_1, PhpVersion.PHP7_1);

      // @todo Recovery tests:
      //   'interface A { function b() { }'
      //   'interface A { function b() { public $c; }'

      let diagnosticTests = [
        new DiagnosticTestArgs('interface A { function }', 'missing method name or ampersand', [ErrorCode.ERR_MethodNameOrAmpersandExpected], [22]),
        new DiagnosticTestArgs('interface A { function &', 'missing method name (after ampersand)', [ErrorCode.ERR_MethodNameExpected], [24]),
        new DiagnosticTestArgs('interface A { function b }', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [24]),
        new DiagnosticTestArgs('interface A { function b( }', 'missing ampersand, ellipsis, question, type, variable, or close paren', [ErrorCode.ERR_ParameterOrCloseParenExpected], [25]),
        new DiagnosticTestArgs('interface A { function b() }', 'missing colon or semicolon', [ErrorCode.ERR_ColonOrSemicolonExpected], [26]),

        new DiagnosticTestArgs('interface A { function b():', 'missing return type', [ErrorCode.ERR_TypeExpected], [27]),
        new DiagnosticTestArgs('interface A { function b(): C\\ }', 'missing identifier in return type', [ErrorCode.ERR_IdentifierExpected], [30]),
        new DiagnosticTestArgs('interface A { function b(): \\ }', 'missing identifier in return type (fully qualified name)', [ErrorCode.ERR_IdentifierExpected], [29]),

        new DiagnosticTestArgs('interface A { function b() {} }', 'should not expect a method body', [ErrorCode.ERR_InterfaceMethodDefinition], [27]),
        new DiagnosticTestArgs('interface A { public function b() {} }', 'should not expect a method body on public method', [ErrorCode.ERR_InterfaceMethodDefinition], [34]),
        new DiagnosticTestArgs('interface A { static function b() {} }', 'should not expect a method body on static method', [ErrorCode.ERR_InterfaceMethodDefinition], [34]),

        new DiagnosticTestArgs('interface A { protected function b(); }', 'should not parse a protected method declaration', [ErrorCode.ERR_InterfaceMemberNotPublic], [14]),
        new DiagnosticTestArgs('interface A { private function b(); }', 'should not parse a private method declaration', [ErrorCode.ERR_InterfaceMemberNotPublic], [14]),

        new DiagnosticTestArgs('interface A { abstract function b(); }', 'should not parse an abstract method declaration', [ErrorCode.ERR_BadInterfaceModifier], [14]),
        new DiagnosticTestArgs('interface A { abstract final function b(); }', 'should not expect abstract and final modifiers', [ErrorCode.ERR_BadInterfaceModifier, ErrorCode.ERR_BadInterfaceModifier], [14, 23]),
        new DiagnosticTestArgs('interface A { abstract public function b(); }', 'should not expect abstract and public modifiers', [ErrorCode.ERR_BadInterfaceModifier], [14]),
        new DiagnosticTestArgs('interface A { abstract protected function b(); }', 'should not expect abstract and protected modifiers', [ErrorCode.ERR_BadInterfaceModifier, ErrorCode.ERR_InterfaceMemberNotPublic], [14, 23]),
        new DiagnosticTestArgs('interface A { abstract private function b(); }', 'should not expect abstract and private modifiers', [ErrorCode.ERR_BadInterfaceModifier, ErrorCode.ERR_InterfaceMemberNotPublic], [14, 23]),
        new DiagnosticTestArgs('interface A { abstract static function b(); }', 'should not expect abstract and static modifiers', [ErrorCode.ERR_BadInterfaceModifier], [14]),

        new DiagnosticTestArgs('interface A { final function b(); }', 'should not parse a final method declaration', [ErrorCode.ERR_BadInterfaceModifier], [14]),
        new DiagnosticTestArgs('interface A { final abstract function b(); }', 'should not expect final and abstract modifiers', [ErrorCode.ERR_BadInterfaceModifier, ErrorCode.ERR_BadInterfaceModifier], [14, 20]),
        new DiagnosticTestArgs('interface A { final public function b(); }', 'should not expect final and public modifiers', [ErrorCode.ERR_BadInterfaceModifier], [14]),
        new DiagnosticTestArgs('interface A { final protected function b(); }', 'should not expect final and protected modifiers', [ErrorCode.ERR_BadInterfaceModifier, ErrorCode.ERR_InterfaceMemberNotPublic], [14, 20]),
        new DiagnosticTestArgs('interface A { final private function b(); }', 'should not expect final and private modifiers', [ErrorCode.ERR_BadInterfaceModifier, ErrorCode.ERR_InterfaceMemberNotPublic], [14, 20]),
        new DiagnosticTestArgs('interface A { final static function b(); }', 'should not expect final and static modifiers', [ErrorCode.ERR_BadInterfaceModifier], [14]),

        new DiagnosticTestArgs('interface A { static abstract function b(); }', 'should not expect static and abstract modifiers', [ErrorCode.ERR_BadInterfaceModifier], [21]),
        new DiagnosticTestArgs('interface A { static final function b(); }', 'should not expect static and final modifiers', [ErrorCode.ERR_BadInterfaceModifier], [21]),
        new DiagnosticTestArgs('interface A { static protected function b(); }', 'should not expect static and protected modifiers', [ErrorCode.ERR_InterfaceMemberNotPublic], [21]),
        new DiagnosticTestArgs('interface A { static private function b(); }', 'should not expect static and private modifiers', [ErrorCode.ERR_InterfaceMemberNotPublic], [21]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('trait-use-clause', function() {
      let diagnosticTests = [
        new DiagnosticTestArgs('interface A { use B; }', 'should not parse a trait use clause', [ErrorCode.ERR_InterfaceTrait], [14]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

  });

});
