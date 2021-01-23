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
  FullyQualifiedNameSyntaxNode,
  PartiallyQualifiedNameSyntaxNode,
  UseDeclarationSyntaxNode,
  UseElementSyntaxNode,
  UseGroupDeclarationSyntaxNode
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { PhpVersion } from '../../../src/parser/PhpVersion';
import { TokenKind } from '../../../src/language/TokenKind';

function assertUseElement(element: UseElementSyntaxNode, text: string, isFullyQualified: boolean, type: string | null, alias: string | null): void {
  assert.strictEqual(element instanceof UseElementSyntaxNode, true, 'UseElementSyntaxNode');
  if (type) {
    let kind = type === 'function' ? TokenKind.Function : TokenKind.Const;
    Test.assertSyntaxToken(element.typeKeyword, text, kind, type);
  }
  else {
    assert.strictEqual(element.typeKeyword, null);
  }
  if (isFullyQualified) {
    assert.strictEqual(element.target instanceof FullyQualifiedNameSyntaxNode, true, 'FullyQualifiedNameSyntaxNode');
  }
  else {
    assert.strictEqual(element.target instanceof PartiallyQualifiedNameSyntaxNode, true, 'PartiallyQualifiedNameSyntaxNode');
  }
  if (alias) {
    assert.notStrictEqual(element.asKeyword, null);
    Test.assertSyntaxToken(element.alias, text, TokenKind.Identifier, alias);
  }
  else {
    assert.strictEqual(element.asKeyword, null);
    assert.strictEqual(element.alias, null);
  }
}

function assertUseGroupDeclaration(decl: UseGroupDeclarationSyntaxNode, nameTokenCount: number, hasUseType = true): UseElementSyntaxNode[] {
  assert.strictEqual(decl instanceof UseGroupDeclarationSyntaxNode, true, 'UseGroupDeclarationSyntaxNode');
  if (hasUseType) {
    assert.notStrictEqual(decl.useType, null);
  }
  else {
    assert.strictEqual(decl.useType, null);
  }
  let nameTokens = decl.rootName ? decl.rootName.childTokens() : [];
  assert.strictEqual(nameTokens.length, nameTokenCount);
  let declarations = decl.declarations ? decl.declarations.childNodes() : [];
  return <UseElementSyntaxNode[]>declarations;
}

describe('PhpParser', function() {

  describe('namespace-use-declaration', function() {

    describe('use-declaration', function() {
      let syntaxTests = [
        new ParserTestArgs('use A;', 'should parse a use declaration', (statements, text) => {
          let useDecl = <UseDeclarationSyntaxNode>statements[0];
          assert.strictEqual(useDecl instanceof UseDeclarationSyntaxNode, true, 'UseDeclarationSyntaxNode');
          assert.strictEqual(useDecl.useType, null);
          let declarations = useDecl.declarations ? useDecl.declarations.childNodes() : [];
          assert.strictEqual(declarations.length, 1);
          let element = <UseElementSyntaxNode>declarations[0];
          assertUseElement(element, text, false, null, null);
        }),
        new ParserTestArgs('use \\A;', 'should parse a use declaration with a fully qualified name', (statements, text) => {
          let useDecl = <UseDeclarationSyntaxNode>statements[0];
          assert.strictEqual(useDecl instanceof UseDeclarationSyntaxNode, true, 'UseDeclarationSyntaxNode');
          assert.strictEqual(useDecl.useType, null);
          let declarations = useDecl.declarations ? useDecl.declarations.childNodes() : [];
          assert.strictEqual(declarations.length, 1);
          let element = <UseElementSyntaxNode>declarations[0];
          assertUseElement(element, text, true, null, null);
        }),
        new ParserTestArgs('use A as B;', 'should parse a use declaration with alias', (statements, text) => {
          let useDecl = <UseDeclarationSyntaxNode>statements[0];
          assert.strictEqual(useDecl instanceof UseDeclarationSyntaxNode, true, 'UseDeclarationSyntaxNode');
          assert.strictEqual(useDecl.useType, null);
          let declarations = useDecl.declarations ? useDecl.declarations.childNodes() : [];
          assert.strictEqual(declarations.length, 1);
          let element = <UseElementSyntaxNode>declarations[0];
          assertUseElement(element, text, false, null, 'B');
        }),
        new ParserTestArgs('use \\A as B;', 'should parse a use declaration with a fully qualified name and alias', (statements, text) => {
          let useDecl = <UseDeclarationSyntaxNode>statements[0];
          assert.strictEqual(useDecl instanceof UseDeclarationSyntaxNode, true, 'UseDeclarationSyntaxNode');
          assert.strictEqual(useDecl.useType, null);
          let declarations = useDecl.declarations ? useDecl.declarations.childNodes() : [];
          assert.strictEqual(declarations.length, 1);
          let element = <UseElementSyntaxNode>declarations[0];
          assertUseElement(element, text, true, null, 'B');
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('use', 'missing use type or name', [ErrorCode.ERR_UseTypeExpected], [3]),
        new DiagnosticTestArgs('use A', 'missing as, backslash, comma, or semicolon', [ErrorCode.ERR_IncompleteUseDeclaration], [5]),
        new DiagnosticTestArgs('use A\\', 'missing identifier or open brace', [ErrorCode.ERR_IncompleteUseName], [6]),
        new DiagnosticTestArgs('use A as', 'missing alias name', [ErrorCode.ERR_IdentifierExpected], [8]),
        new DiagnosticTestArgs('use namespace\\A;', 'should not parse a use declaration with a relative name', [ErrorCode.ERR_UseTypeExpected], [3]),
        // @todo This could also expect a backslash.
        new DiagnosticTestArgs('use A, namespace\\B;', 'should not parse a use declaration with a relative name in list', [ErrorCode.ERR_IdentifierExpected], [6]),
        new DiagnosticTestArgs('use A as abstract;', 'should not parse a use declaration if alias is not an identifier', [ErrorCode.ERR_IdentifierExpected], [8]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('use-declaration (with type)', function() {
      let syntaxTests = [
        new ParserTestArgs('use function A;', 'should parse a use function declaration', (statements, text) => {
          let useDecl = <UseDeclarationSyntaxNode>statements[0];
          assert.strictEqual(useDecl instanceof UseDeclarationSyntaxNode, true, 'UseDeclarationSyntaxNode');
          assert.notStrictEqual(useDecl.useType, null);
          let declarations = useDecl.declarations ? useDecl.declarations.childNodes() : [];
          assert.strictEqual(declarations.length, 1);
          let element = <UseElementSyntaxNode>declarations[0];
          assertUseElement(element, text, false, null, null);
        }),
        new ParserTestArgs('use function \\A;', 'should parse a use function declaration with a fully qualified name', (statements, text) => {
          let useDecl = <UseDeclarationSyntaxNode>statements[0];
          assert.strictEqual(useDecl instanceof UseDeclarationSyntaxNode, true, 'UseDeclarationSyntaxNode');
          assert.notStrictEqual(useDecl.useType, null);
          let declarations = useDecl.declarations ? useDecl.declarations.childNodes() : [];
          assert.strictEqual(declarations.length, 1);
          let element = <UseElementSyntaxNode>declarations[0];
          assertUseElement(element, text, true, null, null);
        }),
        new ParserTestArgs('use const A;', 'should parse a use const declaration', (statements, text) => {
          let useDecl = <UseDeclarationSyntaxNode>statements[0];
          assert.strictEqual(useDecl instanceof UseDeclarationSyntaxNode, true, 'UseDeclarationSyntaxNode');
          assert.notStrictEqual(useDecl.useType, null);
          let declarations = useDecl.declarations ? useDecl.declarations.childNodes() : [];
          assert.strictEqual(declarations.length, 1);
          let element = <UseElementSyntaxNode>declarations[0];
          assertUseElement(element, text, false, null, null);
        }),
        new ParserTestArgs('use const \\A;', 'should parse a use const declaration with a fully qualified name', (statements, text) => {
          let useDecl = <UseDeclarationSyntaxNode>statements[0];
          assert.strictEqual(useDecl instanceof UseDeclarationSyntaxNode, true, 'UseDeclarationSyntaxNode');
          assert.notStrictEqual(useDecl.useType, null);
          let declarations = useDecl.declarations ? useDecl.declarations.childNodes() : [];
          assert.strictEqual(declarations.length, 1);
          let element = <UseElementSyntaxNode>declarations[0];
          assertUseElement(element, text, true, null, null);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      // See use-group-declaration for 'use function A\\' and 'use const A\\' tests.
      let diagnosticTests = [
        new DiagnosticTestArgs('use function', 'missing name in function import', [ErrorCode.ERR_IdentifierExpected], [12]),
        new DiagnosticTestArgs('use function A', 'missing as, backslash, comma, or semicolon in function import', [ErrorCode.ERR_IncompleteUseDeclaration], [14]),
        new DiagnosticTestArgs('use function A,', 'missing identifier in function import', [ErrorCode.ERR_IdentifierExpected], [15]),
        new DiagnosticTestArgs('use function A, B as', 'missing identifier in function import (alias name)', [ErrorCode.ERR_IdentifierExpected], [20]),
        new DiagnosticTestArgs('use function A, B as C', 'missing comma or semicolon in function import', [ErrorCode.ERR_CommaOrSemicolonExpected], [22]),

        new DiagnosticTestArgs('use const', 'missing name in constant import', [ErrorCode.ERR_IdentifierExpected], [9]),
        new DiagnosticTestArgs('use const A', 'missing as, backslash, comma, or semicolon in constant import', [ErrorCode.ERR_IncompleteUseDeclaration], [11]),
        new DiagnosticTestArgs('use const A,', 'missing identifier in constant import', [ErrorCode.ERR_IdentifierExpected], [12]),
        new DiagnosticTestArgs('use const A, B as', 'missing identifier in constant import (alias name)', [ErrorCode.ERR_IdentifierExpected], [17]),
        new DiagnosticTestArgs('use const A, B as C', 'missing comma or semicolon in constant import', [ErrorCode.ERR_CommaOrSemicolonExpected], [19]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('use-group-declaration (with type)', function() {
      let syntaxTests = [
        new ParserTestArgs('use function A\\{ B };', 'should parse a use function group declaration', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, null, null);
        }),
        new ParserTestArgs('use function A\\{ B, C };', 'should parse a use function group declaration with list of names', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2);
          assert.strictEqual(declarations.length, 2);
          assertUseElement(declarations[0], text, false, null, null);
          assertUseElement(declarations[1], text, false, null, null);
        }),
        new ParserTestArgs('use function A\\{ B as C };', 'should parse a use function group declaration with aliased function name', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, null, 'C');
        }),
        new ParserTestArgs('use function \\A\\{ B };', 'should parse a use function group declaration with a fully qualified name', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 3);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, null, null);
        }),
        new ParserTestArgs('use function \\A\\{ B, C };', 'should parse a use function group declaration with a fully qualified name and list of names', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 3);
          assert.strictEqual(declarations.length, 2);
          assertUseElement(declarations[0], text, false, null, null);
          assertUseElement(declarations[1], text, false, null, null);
        }),
        new ParserTestArgs('use const A\\{ B };', 'should parse a use const group declaration', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, null, null);
        }),
        new ParserTestArgs('use const A\\{ B, C };', 'should parse a use const group declaration with list of names', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2);
          assert.strictEqual(declarations.length, 2);
          assertUseElement(declarations[0], text, false, null, null);
          assertUseElement(declarations[1], text, false, null, null);
        }),
        new ParserTestArgs('use const A\\{ B as C };', 'should parse a use const group declaration with aliased constant name', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, null, 'C');
        }),
        new ParserTestArgs('use const \\A\\{ B };', 'should parse a use const group declaration with a fully qualified name', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 3);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, null, null);
        }),
        new ParserTestArgs('use const \\A\\{ B, C };', 'should parse a use const group declaration with a fully qualified name and list of names', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 3);
          assert.strictEqual(declarations.length, 2);
          assertUseElement(declarations[0], text, false, null, null);
          assertUseElement(declarations[1], text, false, null, null);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let syntaxTests7_2 = [
        new ParserTestArgs('use function A\\{ B, };', 'should parse a use function group declaration with trailing comma', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, null, null);
        }),
        new ParserTestArgs('use const A\\{ B, };', 'should parse a use const group declaration with trailing comma', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, null, null);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests7_2, PhpVersion.PHP7_2);

      let diagnosticTests = [
        new DiagnosticTestArgs('use function A\\', 'missing open brace or name in function import', [ErrorCode.ERR_IncompleteUseName], [15]),
        new DiagnosticTestArgs('use function A\\{', 'missing name in function import', [ErrorCode.ERR_IdentifierExpected], [16]),
        new DiagnosticTestArgs('use function A\\{ B', 'missing as, backslash, comma, or close brace in function import', [ErrorCode.ERR_IncompleteUseGroupDeclaration], [18]),
        new DiagnosticTestArgs('use function A\\{ B\\', 'missing identifier in function import', [ErrorCode.ERR_IdentifierExpected], [19]),
        new DiagnosticTestArgs('use function A\\{ B as', 'missing identifier in function import (alias)', [ErrorCode.ERR_IdentifierExpected], [21]),
        new DiagnosticTestArgs('use function A\\{ B as C', 'missing comma or close brace in function import', [ErrorCode.ERR_CommaOrCloseBraceExpected], [23]),
        new DiagnosticTestArgs('use function A\\{ B }', 'missing semicolon in function import', [ErrorCode.ERR_SemicolonExpected], [20]),

        new DiagnosticTestArgs('use const A\\', 'missing open brace or name in constant import', [ErrorCode.ERR_IncompleteUseName], [12]),
        new DiagnosticTestArgs('use const A\\{', 'missing name in constant import', [ErrorCode.ERR_IdentifierExpected], [13]),
        new DiagnosticTestArgs('use const A\\{ B', 'missing as, backslash, comma, or close brace in constant import', [ErrorCode.ERR_IncompleteUseGroupDeclaration], [15]),
        new DiagnosticTestArgs('use const A\\{ B\\', 'missing identifier in constant import', [ErrorCode.ERR_IdentifierExpected], [16]),
        new DiagnosticTestArgs('use const A\\{ B as', 'missing identifier in constant import (alias)', [ErrorCode.ERR_IdentifierExpected], [18]),
        new DiagnosticTestArgs('use const A\\{ B as C', 'missing comma or close brace in constant import', [ErrorCode.ERR_CommaOrCloseBraceExpected], [20]),
        new DiagnosticTestArgs('use const A\\{ B }', 'missing semicolon in constant import', [ErrorCode.ERR_SemicolonExpected], [17]),

        new DiagnosticTestArgs('use function A\\{ \\B', 'should not parse a fully qualified function name', [ErrorCode.ERR_IdentifierExpected], [16]),
        new DiagnosticTestArgs('use function A\\{ function B };', 'should not parse a use function group declaration with redeclared import type', [ErrorCode.ERR_UseTypeAlreadySpecified], [17]),
      ];
      Test.assertDiagnostics(diagnosticTests);

      let diagnosticTests7_2 = [
        new DiagnosticTestArgs('use function A\\{ B,', 'missing name or close brace in function import', [ErrorCode.ERR_IdentifierOrCloseBraceExpected], [19]),
        new DiagnosticTestArgs('use const A\\{ B,', 'missing name or close brace in constant import', [ErrorCode.ERR_IdentifierOrCloseBraceExpected], [16]),
      ];
      Test.assertDiagnostics(diagnosticTests7_2, PhpVersion.PHP7_2);

      let featureTrailingCommas = [
        new DiagnosticTestArgs('use function A\\{ B, };', 'should not parse trailing comma in function import', [ErrorCode.ERR_FeatureTrailingCommasInUseDeclarations], [18]),
        new DiagnosticTestArgs('use const A\\{ B, };', 'should not parse trailing comma in constant import', [ErrorCode.ERR_FeatureTrailingCommasInUseDeclarations], [15]),
      ];
      Test.assertDiagnostics(featureTrailingCommas, PhpVersion.PHP7_0, PhpVersion.PHP7_1);
    });

    describe('use-group-declaration (mixed types)', function() {
      let syntaxTests = [
        new ParserTestArgs('use A\\{ function B };', 'should parse a mixed use group declaration', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2, false);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, 'function', null);
        }),
        new ParserTestArgs('use A\\{ function B, function C };', 'should parse a mixed use group declaration with multiple imports', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2, false);
          assert.strictEqual(declarations.length, 2);
          assertUseElement(declarations[0], text, false, 'function', null);
          assertUseElement(declarations[1], text, false, 'function', null);
        }),
        new ParserTestArgs('use A\\{ function B, function C as D };', 'should parse a mixed use group declaration with aliased function name', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2, false);
          assert.strictEqual(declarations.length, 2);
          assertUseElement(declarations[0], text, false, 'function', null);
          assertUseElement(declarations[1], text, false, 'function', 'D');
        }),
        new ParserTestArgs('use A\\{ function B, const C };', 'should parse a mixed use group declaration with function and constant import types', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2, false);
          assert.strictEqual(declarations.length, 2);
          assertUseElement(declarations[0], text, false, 'function', null);
          assertUseElement(declarations[1], text, false, 'const', null);
        }),
        new ParserTestArgs('use A\\{ function B, const C as D };', 'should parse a mixed use group declaration with aliased constant name', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2, false);
          assert.strictEqual(declarations.length, 2);
          assertUseElement(declarations[0], text, false, 'function', null);
          assertUseElement(declarations[1], text, false, 'const', 'D');
        }),
        new ParserTestArgs('use A\\{ function B, C };', 'should parse a mixed use group declaration with function and class import types', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2, false);
          assert.strictEqual(declarations.length, 2);
          assertUseElement(declarations[0], text, false, 'function', null);
          assertUseElement(declarations[1], text, false, null, null);
        }),
        new ParserTestArgs('use A\\{ function B\\C };', 'should parse a mixed use group declaration with partially qualified import', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2, false);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, 'function', null);
        }),
        new ParserTestArgs('use \\A\\{ function B };', 'should parse a mixed use group declaration with fully qualified root name', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 3, false);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, 'function', null);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let syntaxTests7_2 = [
        new ParserTestArgs('use A\\{ function B, };', 'should parse a mixed use group declaration with trailing comma', (statements, text) => {
          let useDecl = <UseGroupDeclarationSyntaxNode>statements[0];
          let declarations = assertUseGroupDeclaration(useDecl, 2, false);
          assert.strictEqual(declarations.length, 1);
          assertUseElement(declarations[0], text, false, 'function', null);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests7_2, PhpVersion.PHP7_2);

      let diagnosticTests = [
        new DiagnosticTestArgs('use A\\{', 'missing identifier or import type', [ErrorCode.ERR_UseTypeExpected], [7]),

        new DiagnosticTestArgs('use A\\{ function', 'missing identifier', [ErrorCode.ERR_IdentifierExpected], [16]),
        new DiagnosticTestArgs('use A\\{ function B', 'missing as, backslash, comma, or close brace', [ErrorCode.ERR_IncompleteUseGroupDeclaration], [18]),
        new DiagnosticTestArgs('use A\\{ function B as', 'missing identifier (alias)', [ErrorCode.ERR_IdentifierExpected], [21]),
        new DiagnosticTestArgs('use A\\{ function B as C', 'missing comma or close brace', [ErrorCode.ERR_CommaOrCloseBraceExpected], [23]),

        new DiagnosticTestArgs('use A\\{ function \\B', 'should not parse a fully qualified function name', [ErrorCode.ERR_IdentifierExpected], [16]),
      ];
      Test.assertDiagnostics(diagnosticTests);

      let diagnosticTests7_2 = [
        new DiagnosticTestArgs('use A\\{ function B,', 'missing identifier, import type, or close brace', [ErrorCode.ERR_UseTypeOrCloseBraceExpected], [19]),
        new DiagnosticTestArgs('use A\\{ function B as C,', 'missing identifier, import type, or close brace (after alias)', [ErrorCode.ERR_UseTypeOrCloseBraceExpected], [24]),
      ];
      Test.assertDiagnostics(diagnosticTests7_2, PhpVersion.PHP7_2);

      let featureTrailingCommas = [
        new DiagnosticTestArgs('use A\\{ function B, };', 'should not parse trailing comma in mixed type import', [ErrorCode.ERR_FeatureTrailingCommasInUseDeclarations], [18]),
        new DiagnosticTestArgs('use A\\{ function B as C, };', 'should not parse trailing comma in mixed type import (after alias)', [ErrorCode.ERR_FeatureTrailingCommasInUseDeclarations], [23]),
      ];
      Test.assertDiagnostics(featureTrailingCommas, PhpVersion.PHP7_0, PhpVersion.PHP7_1);
    });

  });

});
