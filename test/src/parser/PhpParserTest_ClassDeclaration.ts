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
  ClassDeclarationSyntaxNode,
  FullyQualifiedNameSyntaxNode,
  LiteralSyntaxNode,
  MethodDeclarationSyntaxNode,
  MethodReferenceSyntaxNode,
  NamedTraitAliasSyntaxNode,
  NamedTypeSyntaxNode,
  PartiallyQualifiedNameSyntaxNode,
  PredefinedTypeSyntaxNode,
  PropertyDeclarationSyntaxNode,
  PropertyElementSyntaxNode,
  ReferencedTraitAliasSyntaxNode,
  RelativeNameSyntaxNode,
  StatementBlockSyntaxNode,
  TraitPrecedenceSyntaxNode,
  TraitUseGroupSyntaxNode,
  TraitUseSyntaxNode,
  TypeSyntaxNode,
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { ISyntaxNode } from '../../../src/language/syntax/ISyntaxNode';
import { PhpVersion } from '../../../src/parser/PhpVersion';
import { TokenKind } from '../../../src/language/TokenKind';

function assertClassConstantDeclaration(statements: ISyntaxNode[]): ClassConstantDeclarationSyntaxNode {
  let classNode = <ClassDeclarationSyntaxNode>statements[0];
  assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
  let members = classNode.members ? classNode.members.childNodes() : [];
  assert.equal(members.length, 1);
  let classConstant = <ClassConstantDeclarationSyntaxNode>members[0];
  assert.equal(classConstant instanceof ClassConstantDeclarationSyntaxNode, true);
  return classConstant;
}

function assertMethodDeclaration(statements: ISyntaxNode[]): MethodDeclarationSyntaxNode {
  let classNode = <ClassDeclarationSyntaxNode>statements[0];
  assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
  let members = classNode.members ? classNode.members.childNodes() : [];
  assert.equal(members.length, 1);
  let method = <MethodDeclarationSyntaxNode>members[0];
  assert.equal(method instanceof MethodDeclarationSyntaxNode, true);
  return method;
}

function assertPropertyDeclaration(statements: ISyntaxNode[]): PropertyDeclarationSyntaxNode {
  let classNode = <ClassDeclarationSyntaxNode>statements[0];
  assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
  let members = classNode.members ? classNode.members.childNodes() : [];
  assert.equal(members.length, 1);
  let property = <PropertyDeclarationSyntaxNode>members[0];
  assert.equal(property instanceof PropertyDeclarationSyntaxNode, true);
  return property;
}

function assertTraitUse(statements: ISyntaxNode[]): TraitUseSyntaxNode {
  let classNode = <ClassDeclarationSyntaxNode>statements[0];
  assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
  let members = classNode.members ? classNode.members.childNodes() : [];
  assert.equal(members.length, 1);
  let traitUse = <TraitUseSyntaxNode>members[0];
  assert.equal(traitUse instanceof TraitUseSyntaxNode, true);
  return traitUse;
}

function assertTraitUseGroup(statements: ISyntaxNode[]): TraitUseGroupSyntaxNode {
  let classNode = <ClassDeclarationSyntaxNode>statements[0];
  assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
  let members = classNode.members ? classNode.members.childNodes() : [];
  assert.equal(members.length, 1);
  let traitUseGroup = <TraitUseGroupSyntaxNode>members[0];
  assert.equal(traitUseGroup instanceof TraitUseGroupSyntaxNode, true);
  return traitUseGroup;
}

describe('PhpParser', function() {

  describe('class-declaration', function() {
    let syntaxTests = [
      new ParserTestArgs('class A {}', 'should parse a class declaration', (statements, text) => {
        let classNode = <ClassDeclarationSyntaxNode>statements[0];
        assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
        Test.assertSyntaxToken(classNode.identifier, text, TokenKind.Identifier, 'A');
        assert.strictEqual(classNode.baseType, null);
        assert.strictEqual(classNode.interfaces, null);
        assert.strictEqual(classNode.members, null);
      }),
      // @todo Reserved names: bool, false, float, int, iterable, null, object, parent, self, static, string, true, void.
      // @todo "Expected an identifier, '%s' is a keyword"
      // @todo Should parse, but also cause an error during analysis?
      // new ParserTestArgs('class int {}', 'should parse a class with a reserved name', (statements) => {
      //   let classNode = <ClassDeclarationSyntaxNode>statements[0];
      //   assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
      //   assert.strictEqual(classNode.baseType, null);
      //   assert.strictEqual(classNode.interfaces, null);
      //   assert.strictEqual(classNode.members, null);
      // }),
      new ParserTestArgs('{ class A {} }', 'should parse a class declaration in statement block', (statements) => {
        let block = <StatementBlockSyntaxNode>statements[0];
        assert.equal(block instanceof StatementBlockSyntaxNode, true, 'is a StatementBlockSyntaxNode');
        let innerStatements = block.childNodes();
        assert.equal(innerStatements.length, 1);
        assert.equal(innerStatements[0] instanceof ClassDeclarationSyntaxNode, true);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    // let recoveryTests = [
    //   new ParserTestArgs('class A }', 'should not consume closing brace if opening brace is missing')
    // ];
    // Test.assertSyntaxNodes(recoveryTests, false);

    let diagnosticTests = [
      new DiagnosticTestArgs('class', 'missing identifier and braces', [ErrorCode.ERR_IdentifierExpected], [5]),
      new DiagnosticTestArgs('class A', 'missing base clause, implements list, or open brace', [ErrorCode.ERR_IncompleteClassDeclaration], [7]),
      new DiagnosticTestArgs('class A {', 'missing close brace', [ErrorCode.ERR_CloseBraceExpected], [9]),
    //new DiagnosticTestArgs('class A }', 'missing open brace', [ErrorCode.ERR_IncompleteClassDeclaration], [7]),
      new DiagnosticTestArgs('class {}', 'missing identifier', [ErrorCode.ERR_IdentifierExpected], [5]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('class-modifiers', function() {
    let syntaxTests = [
      new ParserTestArgs('abstract class A {}', 'should parse an abstract class declaration', (statements, text) => {
        let classNode = <ClassDeclarationSyntaxNode>statements[0];
        assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
        let modifiers = classNode.modifiers ? classNode.modifiers.childTokens() : [];
        assert.equal(modifiers.length, 1);
        Test.assertSyntaxToken(classNode.identifier, text, TokenKind.Identifier, 'A');
        assert.strictEqual(classNode.baseType, null);
        assert.strictEqual(classNode.interfaces, null);
        assert.strictEqual(classNode.members, null);
      }),
      new ParserTestArgs('final class A {}', 'should parse a final class declaration', (statements, text) => {
        let classNode = <ClassDeclarationSyntaxNode>statements[0];
        assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
        let modifiers = classNode.modifiers ? classNode.modifiers.childTokens() : [];
        assert.equal(modifiers.length, 1);
        Test.assertSyntaxToken(classNode.identifier, text, TokenKind.Identifier, 'A');
        assert.strictEqual(classNode.baseType, null);
        assert.strictEqual(classNode.interfaces, null);
        assert.strictEqual(classNode.members, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    // @todo Assert no diagnostic on 'abstract' when recovering from 'public abstract class A {}'.

    // No tests are needed for `static` since that starts a different statement.
    let diagnosticTests = [
      new DiagnosticTestArgs('abstract final class A {}', 'abstract and final', [ErrorCode.ERR_AbstractClassIsFinal], [9]),
      new DiagnosticTestArgs('final abstract class A {}', 'final and abstract', [ErrorCode.ERR_AbstractClassIsFinal], [6]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('class-modifiers (visibility)', function() {
    let diagnosticTests = [
      new DiagnosticTestArgs('private class A {}', 'private', [ErrorCode.ERR_BadTypeModifier], [0]),
      new DiagnosticTestArgs('protected class A {}', 'protected', [ErrorCode.ERR_BadTypeModifier], [0]),
      new DiagnosticTestArgs('public class A {}', 'public', [ErrorCode.ERR_BadTypeModifier], [0]),
      new DiagnosticTestArgs('private public class A {}', 'multiple visibility modifiers', [ErrorCode.ERR_BadTypeModifier, ErrorCode.ERR_BadTypeModifier], [0, 8]),
      new DiagnosticTestArgs('protected public class A {}', 'multiple visibility modifiers', [ErrorCode.ERR_BadTypeModifier, ErrorCode.ERR_BadTypeModifier], [0, 10]),
      new DiagnosticTestArgs('public public class A {}', 'duplicate public modifiers', [ErrorCode.ERR_BadTypeModifier, ErrorCode.ERR_DuplicateModifier], [0, 7]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('class-base-clause', function() {
    let syntaxTests = [
      new ParserTestArgs('class A extends B {}', 'should parse a class declaration with a base type', (statements) => {
        let classNode = <ClassDeclarationSyntaxNode>statements[0];
        assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
        assert.equal(classNode.baseType instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(classNode.interfaces, null);
        assert.strictEqual(classNode.members, null);
      }),
      new ParserTestArgs('class A extends \\B {}', 'should parse a class declaration with fully qualified base type', (statements) => {
        let classNode = <ClassDeclarationSyntaxNode>statements[0];
        assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
        assert.equal(classNode.baseType instanceof FullyQualifiedNameSyntaxNode, true);
        assert.strictEqual(classNode.interfaces, null);
        assert.strictEqual(classNode.members, null);
      }),
      new ParserTestArgs('class A extends namespace\\B {}', 'should parse a class declaration with relative base type', (statements) => {
        let classNode = <ClassDeclarationSyntaxNode>statements[0];
        assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
        assert.equal(classNode.baseType instanceof RelativeNameSyntaxNode, true);
        assert.strictEqual(classNode.interfaces, null);
        assert.strictEqual(classNode.members, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('class A extends', 'missing base type', [ErrorCode.ERR_TypeExpected], [15]),
      new DiagnosticTestArgs('class A extends \\', 'missing identifier in fully qualified base type', [ErrorCode.ERR_IdentifierExpected], [17]),
      new DiagnosticTestArgs('class A extends B', 'missing implements or open brace', [ErrorCode.ERR_IncompleteClassDeclarationWithExtends], [17]),

      new DiagnosticTestArgs('class A extends B, {}', 'should not parse multiple base types', [ErrorCode.ERR_MultipleInheritance], [17]),
      new DiagnosticTestArgs('class A implements B extends {}', 'should not parse base clause after implements', [ErrorCode.ERR_BaseClauseAfterImplements], [21]),
      new DiagnosticTestArgs('class A , B {}', 'should not have base clause diagnostic if extends is missing', [ErrorCode.ERR_IncompleteClassDeclaration], [7]),
      new DiagnosticTestArgs('class A extends B implements C extends {}', 'should not have interface list diagnostic if base clause is already present', [ErrorCode.ERR_CommaOrOpenBraceExpected], [30]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('class-interface-clause', function() {
    let syntaxTests = [
      new ParserTestArgs('class A implements B {}', 'should parse a class declaration with single interface type', (statements) => {
        let classNode = <ClassDeclarationSyntaxNode>statements[0];
        assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
        assert.strictEqual(classNode.baseType, null);
        let interfaces = classNode.interfaces ? classNode.interfaces.childNodes() : [];
        assert.equal(interfaces.length, 1);
        assert.equal(interfaces[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(classNode.members, null);
      }),
      new ParserTestArgs('class A implements B, C {}', 'should parse a class declaration with multiple interface types', (statements) => {
        let classNode = <ClassDeclarationSyntaxNode>statements[0];
        assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
        assert.strictEqual(classNode.baseType, null);
        let interfaces = classNode.interfaces ? classNode.interfaces.childNodes() : [];
        assert.equal(interfaces.length, 2);
        assert.equal(interfaces[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.equal(interfaces[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
        assert.strictEqual(classNode.members, null);
      }),
      new ParserTestArgs('class A implements \\B {}', 'should parse a class declaration with fully qualified interface type', (statements) => {
        let classNode = <ClassDeclarationSyntaxNode>statements[0];
        assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
        assert.strictEqual(classNode.baseType, null);
        let interfaces = classNode.interfaces ? classNode.interfaces.childNodes() : [];
        assert.equal(interfaces.length, 1);
        assert.equal(interfaces[0] instanceof FullyQualifiedNameSyntaxNode, true);
        assert.strictEqual(classNode.members, null);
      }),
      new ParserTestArgs('class A implements namespace\\B {}', 'should parse a class declaration with relative interface type', (statements) => {
        let classNode = <ClassDeclarationSyntaxNode>statements[0];
        assert.equal(classNode instanceof ClassDeclarationSyntaxNode, true, 'is a ClassDeclarationSyntaxNode');
        assert.strictEqual(classNode.baseType, null);
        let interfaces = classNode.interfaces ? classNode.interfaces.childNodes() : [];
        assert.equal(interfaces.length, 1);
        assert.equal(interfaces[0] instanceof RelativeNameSyntaxNode, true);
        assert.strictEqual(classNode.members, null);
      }),
    ];
    Test.assertSyntaxNodes(syntaxTests);

    let diagnosticTests = [
      new DiagnosticTestArgs('class A implements', 'missing interface type', [ErrorCode.ERR_TypeExpected], [18]),
      new DiagnosticTestArgs('class A implements B', 'missing comma or open brace', [ErrorCode.ERR_CommaOrOpenBraceExpected], [20]),
      new DiagnosticTestArgs('class A implements B,', 'missing interface type (in list)', [ErrorCode.ERR_TypeExpected], [21]),
    ];
    Test.assertDiagnostics(diagnosticTests);
  });

  describe('class-member-declarations', function() {

    // @todo Add test for ERR_InvalidMemberDeclaration.

    describe('modifiers', function() {
      let diagnosticTests = [
        new DiagnosticTestArgs('class A { public }', 'missing const, function, or variable', [ErrorCode.ERR_ClassMemberExpected], [10]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('class-const-declaration', function() {
      let syntaxTests = [
        new ParserTestArgs('class A { const B = 1; }', 'should parse a class constant declaration', (statements, text) => {
          let declNode = assertClassConstantDeclaration(statements);
          assert.strictEqual(declNode.modifiers, null);
          let elements = declNode.elements ? declNode.elements.childNodes() : [];
          assert.equal(elements.length, 1);
          let constNode = <ClassConstantElementSyntaxNode>elements[0];
          assert.equal(constNode instanceof ClassConstantElementSyntaxNode, true);
          Test.assertSyntaxToken(constNode.identifierOrKeyword, text, TokenKind.Identifier, 'B');
          assert.equal(constNode.expression instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('class A { const B = 1, C = 2; }', 'should parse a class constant declaration with multiple elements', (statements, text) => {
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
        new ParserTestArgs('class A { const foreach = 1; }', 'should parse a class constant declaration with a semi-reserved name', (statements, text) => {
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
        new ParserTestArgs('class A { public const B = 1; }', 'should parse a public class constant declaration', (statements, text) => {
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
        new ParserTestArgs('class A { protected const B = 1; }', 'should parse a protected class constant declaration', (statements, text) => {
          let declNode = assertClassConstantDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Protected, 'protected');
          let elements = declNode.elements ? declNode.elements.childNodes() : [];
          assert.equal(elements.length, 1);
          let constNode = <ClassConstantElementSyntaxNode>elements[0];
          assert.equal(constNode instanceof ClassConstantElementSyntaxNode, true);
          Test.assertSyntaxToken(constNode.identifierOrKeyword, text, TokenKind.Identifier, 'B');
          assert.equal(constNode.expression instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('class A { private const B = 1; }', 'should parse a private class constant declaration', (statements, text) => {
          let declNode = assertClassConstantDeclaration(statements);
          let modifiers = declNode.modifiers ? declNode.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Private, 'private');
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
        new DiagnosticTestArgs('class A { const }', 'missing identifier and assignment', [ErrorCode.ERR_IdentifierExpected], [15]),
        new DiagnosticTestArgs('class A { const B }', 'missing assignment', [ErrorCode.ERR_Syntax], [17]),
        new DiagnosticTestArgs('class A { const B = }', 'missing expression', [ErrorCode.ERR_ExpressionExpected], [19]),
        new DiagnosticTestArgs('class A { const B = 1 }', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [21]),
        new DiagnosticTestArgs('class A { abstract const B = 1; }', 'abstract modifier', [ErrorCode.ERR_BadConstantModifier], [10]),
        new DiagnosticTestArgs('class A { final const B = 1; }', 'final modifier', [ErrorCode.ERR_BadConstantModifier], [10]),
        new DiagnosticTestArgs('class A { static const B = 1; }', 'static modifier', [ErrorCode.ERR_BadConstantModifier], [10]),
        new DiagnosticTestArgs('class A { const class = 1; }', 'should not parse a class constant declaration with a reserved name', [ErrorCode.ERR_IdentifierExpectedKeyword], [16]),
      ];
      Test.assertDiagnostics(diagnosticTests);

      let diagnosticTests7_0 = [
        new DiagnosticTestArgs('class A { private const B = 1; }', 'private modifier', [ErrorCode.ERR_FeatureClassConstantModifiers], [10]),
        new DiagnosticTestArgs('class A { protected const B = 1; }', 'protected modifier', [ErrorCode.ERR_FeatureClassConstantModifiers], [10]),
        new DiagnosticTestArgs('class A { public const B = 1; }', 'public modifier', [ErrorCode.ERR_FeatureClassConstantModifiers], [10]),
      ];
      Test.assertDiagnostics(diagnosticTests7_0, PhpVersion.PHP7_0, PhpVersion.PHP7_0);
    });

    describe('property-declaration', function() {
      let syntaxTests = [
        new ParserTestArgs('class A { public $b; }', 'should parse a property declaration', (statements, text) => {
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
        new ParserTestArgs('class A { public $b = 1; }', 'should parse a property declaration with assignment', (statements, text) => {
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
        new ParserTestArgs('class A { public $b, $c; }', 'should parse a property declaration with multiple properties', (statements, text) => {
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
        new ParserTestArgs('class A { protected $b; }', 'should parse a protected property declaration', (statements, text) => {
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
        new ParserTestArgs('class A { private $b; }', 'should parse a private property declaration', (statements, text) => {
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
        new ParserTestArgs('class A { static $b; }', 'should parse a static property declaration', (statements, text) => {
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
        new ParserTestArgs('class A { public static $b; }', 'should parse a static property declaration with visibility modifier (before)', (statements, text) => {
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
        new ParserTestArgs('class A { static public $b; }', 'should parse a static property declaration with visibility modifier (after)', (statements, text) => {
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

      let diagnosticTests = [
        new DiagnosticTestArgs('class A { public $ }', 'incomplete property name', [ErrorCode.ERR_PropertyNameExpected], [17]),
        new DiagnosticTestArgs('class A { public $b', 'missing assignment, comma, or semicolon', [ErrorCode.ERR_IncompletePropertyDeclaration], [19]),
        new DiagnosticTestArgs('class A { public $b = }', 'missing expression', [ErrorCode.ERR_ExpressionExpected], [21]),
        new DiagnosticTestArgs('class A { public $b = 1 }', 'missing comma or semicolon', [ErrorCode.ERR_CommaOrSemicolonExpected], [23]),
        new DiagnosticTestArgs('class A { public $b, }', 'missing property in list', [ErrorCode.ERR_PropertyExpected], [20]),
        new DiagnosticTestArgs('class A { public $b = 1, }', 'missing property in list (after assignment)', [ErrorCode.ERR_PropertyExpected], [24]),
        new DiagnosticTestArgs('class A { abstract $b; }', 'should not parse an abstract property', [ErrorCode.ERR_BadPropertyModifier], [10]),
        new DiagnosticTestArgs('class A { final $b; }', 'should not parse a final property', [ErrorCode.ERR_BadPropertyModifier], [10]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    // Everything except for the parameter list and statement block needs full
    // testing since it uses a different implementation than `function-declaration`.
    describe('method-declaration', function() {
      let syntaxTests = [
        new ParserTestArgs('class A { function b() {} }', 'should parse a method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { function list() {} }', 'should parse a method declaration with semi-reserved keyword', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.List, 'list');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { function &b() {} }', 'should parse a method declaration with ampersand', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.notStrictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),

        // Modifiers.
        new ParserTestArgs('class A { abstract function b(); }', 'should parse an abstract method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { private function b() {} }', 'should parse a private method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Private, 'private');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { protected function b() {} }', 'should parse a protected method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Protected, 'protected');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { public function b() {} }', 'should parse a public method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Public, 'public');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { static function b() {} }', 'should parse a static method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 1);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),

        // Modifiers (mixed).
        new ParserTestArgs('class A { abstract protected function b(); }', 'should parse an abstract and protected method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Protected, 'protected');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { abstract public function b(); }', 'should parse an abstract and public method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Public, 'public');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { abstract static function b(); }', 'should parse an abstract and static method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Abstract, 'abstract');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Static, 'static');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { static final function b() {} }', 'should parse a static and final method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Final, 'final');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { static public function b() {} }', 'should parse a static and public method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Public, 'public');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { static protected function b() {} }', 'should parse a static and protected method declaration', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          let modifiers = method.modifiers ? method.modifiers.childTokens() : [];
          assert.equal(modifiers.length, 2);
          Test.assertSyntaxToken(modifiers[0], text, TokenKind.Static, 'static');
          Test.assertSyntaxToken(modifiers[1], text, TokenKind.Protected, 'protected');
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.strictEqual(method.returnType, null);
        }),
        new ParserTestArgs('class A { static private function b() {} }', 'should parse a static and private method declaration', (statements, text) => {
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
        new ParserTestArgs('class A { function b(): C {} }', 'should parse a method declaration with return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof TypeSyntaxNode, true);
        }),
        new ParserTestArgs('class A { function b(): \\C {} }', 'should parse a method declaration with fully qualified return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof TypeSyntaxNode, true);
        }),
        new ParserTestArgs('class A { function b(): namespace\\C {} }', 'should parse a method declaration with relative return type', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof TypeSyntaxNode, true);
        }),
        new ParserTestArgs('class A { function b(): array {} }', 'should parse a method declaration with predefined return type (array)', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof PredefinedTypeSyntaxNode, true);
        }),
        new ParserTestArgs('class A { function b(): callable {} }', 'should parse a method declaration with predefined return type (callable)', (statements, text) => {
          let method = assertMethodDeclaration(statements);
          assert.strictEqual(method.modifiers, null);
          assert.strictEqual(method.ampersand, null);
          Test.assertSyntaxToken(method.identifierOrKeyword, text, TokenKind.Identifier, 'b');
          assert.equal(method.returnType instanceof PredefinedTypeSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let syntaxTests7_1 = [
        new ParserTestArgs('class A { function b(): ? C {} }', 'should parse a method declaration with nullable return type', (statements, text) => {
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

      let diagnosticTests = [
        new DiagnosticTestArgs('class A { function }', 'missing method name or ampersand', [ErrorCode.ERR_MethodNameOrAmpersandExpected], [18]),
        new DiagnosticTestArgs('class A { function &', 'missing method name (after ampersand)', [ErrorCode.ERR_MethodNameExpected], [20]),
        new DiagnosticTestArgs('class A { function b }', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [20]),
        new DiagnosticTestArgs('class A { function b( }', 'missing ampersand, ellipsis, question, type, variable, or close paren', [ErrorCode.ERR_ParameterOrCloseParenExpected], [21]),
        new DiagnosticTestArgs('class A { function b() }', 'missing open brace or colon', [ErrorCode.ERR_OpenBraceOrColonExpected], [22]),
        new DiagnosticTestArgs('class A { function b() { }', 'missing close brace', [ErrorCode.ERR_CloseBraceExpected], [26]),
        new DiagnosticTestArgs('class A { function b() { public $c; }', 'missing close brace with trailing class member', [ErrorCode.ERR_CloseBraceExpected], [24]),

        new DiagnosticTestArgs('class A { function b():', 'missing return type', [ErrorCode.ERR_TypeExpected], [23]),
        new DiagnosticTestArgs('class A { function b(): C\\ }', 'missing identifier in return type', [ErrorCode.ERR_IdentifierExpected], [26]),
        new DiagnosticTestArgs('class A { function b(): \\ }', 'missing identifier in return type (fully qualified name)', [ErrorCode.ERR_IdentifierExpected], [25]),
        new DiagnosticTestArgs('class A { function b(); }', 'should not expect a semicolon after a non-abstract method declaration', [ErrorCode.ERR_OpenBraceOrColonExpected], [22]),

        new DiagnosticTestArgs('class A { abstract function b() }', 'missing colon or semicolon', [ErrorCode.ERR_ColonOrSemicolonExpected], [31]),
        new DiagnosticTestArgs('class A { abstract function b() {} }', 'should not expect method body on abstract method', [ErrorCode.ERR_AbstractMethodHasBody], [32]),
        new DiagnosticTestArgs('class A { abstract final function b(); }', 'should not expect abstract and final modifiers', [ErrorCode.ERR_AbstractMemberIsFinal], [19]),
        new DiagnosticTestArgs('class A { abstract private function b(); }', 'should not expect abstract and private modifiers', [ErrorCode.ERR_AbstractMemberIsPrivate], [19]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('trait-use-clause', function() {
      let syntaxTests = [
        new ParserTestArgs('class A { use B; }', 'should parse a trait use clause', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('class A { use \\B; }', 'should parse a trait use clause with fully qualified name', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof FullyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('class A { use namespace\\B; }', 'should parse a trait use clause with relative name', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof RelativeNameSyntaxNode, true);
        }),
        new ParserTestArgs('class A { use B { } }', 'should parse a trait use clause with adaptations', (statements) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 1);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.strictEqual(traitUseGroup.adaptations, null);
        }),
        new ParserTestArgs('class A { use B, C; }', 'should parse a trait use clause list', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 2);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.equal(names[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('class A { use B, \\C; }', 'should parse a trait use clause list with fully qualified name', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 2);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.equal(names[1] instanceof FullyQualifiedNameSyntaxNode, true);
        }),
        new ParserTestArgs('class A { use B, namespace\\C; }', 'should parse a trait use clause list with relative name', (statements, text) => {
          let traitUse = assertTraitUse(statements);
          let names = traitUse.traitNames ? traitUse.traitNames.childNodes() : [];
          assert.equal(names.length, 2);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.equal(names[1] instanceof RelativeNameSyntaxNode, true);
        }),
        new ParserTestArgs('class A { use B, C { } }', 'should parse a trait use clause list with adaptations', (statements) => {
          let traitUseGroup = assertTraitUseGroup(statements);
          let names = traitUseGroup.traitNames ? traitUseGroup.traitNames.childNodes() : [];
          assert.equal(names.length, 2);
          assert.equal(names[0] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.equal(names[1] instanceof PartiallyQualifiedNameSyntaxNode, true);
          assert.strictEqual(traitUseGroup.adaptations, null);
        }),

        // Trait alias.
        new ParserTestArgs('class A { use B { c as d; } }', 'should parse a trait alias', (statements, text) => {
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
        new ParserTestArgs('class A { use B { c as list; } }', 'should parse a trait alias with semi-reserved keyword', (statements, text) => {
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
        new ParserTestArgs('class A { use B { c as public; } }', 'should parse a trait alias with public modifier', (statements, text) => {
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
        new ParserTestArgs('class A { use B { c as protected; } }', 'should parse a trait alias with protected modifier', (statements, text) => {
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
        new ParserTestArgs('class A { use B { c as private; } }', 'should parse a trait alias with private modifier', (statements, text) => {
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
        new ParserTestArgs('class A { use B { c as public d; } }', 'should parse a trait alias with public modifier and name', (statements, text) => {
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
        new ParserTestArgs('class A { use B { c as protected d; } }', 'should parse a trait alias with protected modifier and name', (statements, text) => {
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
        new ParserTestArgs('class A { use B { c as private d; } }', 'should parse a trait alias with private modifier and name', (statements, text) => {
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
        new ParserTestArgs('class A { use B { B::c as d; } }', 'should parse a trait alias (method reference)', (statements, text) => {
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
        new ParserTestArgs('class A { use B { B::list as c; } }', 'should parse a trait alias (method reference with semi-reserved keyword)', (statements, text) => {
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
          Test.assertSyntaxToken(reference.methodName, text, TokenKind.List, 'list');
          assert.strictEqual(aliasNode.modifier, null);
          Test.assertSyntaxToken(aliasNode.alias, text, TokenKind.Identifier, 'c');
        }),
        new ParserTestArgs('class A { use B { B::c as list; } }', 'should parse a trait alias with semi-reserved keyword (method reference)', (statements, text) => {
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
        new ParserTestArgs('class A { use B { B::c as public d; } }', 'should parse a trait alias with public modifier (method reference)', (statements, text) => {
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
        new ParserTestArgs('class A { use B { B::c as protected d; } }', 'should parse a trait alias with protected modifier (method reference)', (statements, text) => {
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
        new ParserTestArgs('class A { use B { B::c as private d; } }', 'should parse a trait alias with private modifier (method reference)', (statements, text) => {
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

        // Trait precedence.
        new ParserTestArgs('class A { use B { B::c insteadof D; } }', 'should parse a trait precedence adaptation', (statements, text) => {
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
        new ParserTestArgs('class A { use B { B::c insteadof D, E; } }', 'should parse a trait precedence adapataion list', (statements, text) => {
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
        new DiagnosticTestArgs('class A { use }', 'missing class name', [ErrorCode.ERR_TypeExpected], [13]),
        new DiagnosticTestArgs('class A { use \\ }', 'missing identifier', [ErrorCode.ERR_IdentifierExpected], [15]),
        new DiagnosticTestArgs('class A { use B }', 'missing comma, open brace, or semicolon', [ErrorCode.ERR_IncompleteTraitUse], [15]),
        new DiagnosticTestArgs('class A { use B, }', 'missing class name (in list)', [ErrorCode.ERR_TypeExpected], [16]),
        new DiagnosticTestArgs('class A { use B, \\ }', 'missing identifier (in list)', [ErrorCode.ERR_IdentifierExpected], [18]),
        new DiagnosticTestArgs('class A { use B, C }', 'missing comma, open brace, or semicolon (in list)', [ErrorCode.ERR_IncompleteTraitUse], [18]),

        new DiagnosticTestArgs('class A { use B { }', 'missing close brace', [ErrorCode.ERR_CloseBraceExpected], [19]),
        new DiagnosticTestArgs('class A { use B { c } }', 'missing adaptation keyword', [ErrorCode.ERR_IncompleteTraitAdaptation], [18]),  // Placed on node.
        new DiagnosticTestArgs('class A { use B { c as } }', 'missing alias name', [ErrorCode.ERR_MethodNameExpected], [22]),
        new DiagnosticTestArgs('class A { use B { c as d } }', 'missing semicolon after alias', [ErrorCode.ERR_SemicolonExpected], [24]),

        new DiagnosticTestArgs('class A { use B { B:: } }', 'missing method name', [ErrorCode.ERR_MethodNameExpected], [21]),
        new DiagnosticTestArgs('class A { use B { B::c } }', 'missing adaptation keyword (using method reference)', [ErrorCode.ERR_TraitAdaptationKeywordExpected], [18]),  // Placed on node.
        new DiagnosticTestArgs('class A { use B { B::c as } }', 'missing alias name (using method reference)', [ErrorCode.ERR_MethodNameExpected], [25]),
        new DiagnosticTestArgs('class A { use B { B::c insteadof } }', 'missing precedence class name', [ErrorCode.ERR_TypeExpected], [32]),
        new DiagnosticTestArgs('class A { use B { B::c insteadof D } }', 'missing semicolon after precedence', [ErrorCode.ERR_SemicolonExpected], [34]),

        new DiagnosticTestArgs('class A { use B { c as abstract d; } }', 'should not parse trait alias with abstract modifier', [ErrorCode.ERR_BadTraitAliasModifier], [23]),
        new DiagnosticTestArgs('class A { use B { c as final d; } }', 'should not parse trait alias with final modifier', [ErrorCode.ERR_BadTraitAliasModifier], [23]),
        new DiagnosticTestArgs('class A { use B { c as static d; } }', 'should not parse trait alias with static modifier', [ErrorCode.ERR_BadTraitAliasModifier], [23]),

        new DiagnosticTestArgs('class A { use B { B::c insteadof list } }', 'should not parse semi-reserved keyword as trait precedence class name', [ErrorCode.ERR_TypeExpected], [32]),

        // @todo These should be recovery tests.
        new DiagnosticTestArgs('class A { use B { c d } }', 'should not parse trait adaptation if keyword is missing', [ErrorCode.ERR_IncompleteTraitAdaptation, ErrorCode.ERR_IncompleteTraitAdaptation], [18, 20]),  // Placed on node.
        new DiagnosticTestArgs('class A { use B { c insteadof } }', 'should not parse trait adaptation if method name is ambiguous', [ErrorCode.ERR_MalformedMethodReference], [19]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

  });

});
