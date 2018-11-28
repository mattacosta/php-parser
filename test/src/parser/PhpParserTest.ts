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

import { ParserTestArgs, Test } from '../Test';

import {
  FunctionDeclarationSyntaxNode
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { DocumentationMode } from '../../../src/parser/DocumentationMode';
import { ModifierFlags } from '../../../src/parser/ModifierFlags';
import { PhpLexer } from '../../../src/parser/PhpLexer';
import { PhpParser } from '../../../src/parser/PhpParser';
import { PhpParserOptions } from '../../../src/parser/PhpParserOptions';
import { PhpVersion } from '../../../src/parser/PhpVersion';
import { Precedence } from '../../../src/parser/Precedence';
import { SourceTextFactory } from '../../../src/text/SourceTextFactory';
import { TokenKind } from '../../../src/language/TokenKind';

/**
 * Exposes internal methods of `PhpParser` to allow additional testing.
 */
class TestPhpParser extends PhpParser {

  constructor(lexer: PhpLexer) {
    super(lexer);
  }

  public getPrecedence(kind: TokenKind): Precedence {
    return super.getPrecedence(kind);
  }

  public isAbstractAndPrivate(currentFlags: ModifierFlags, modifier: ModifierFlags): boolean {
    return super.isAbstractAndPrivate(currentFlags, modifier);
  }

}

class ModifierTestArgs {

  constructor(public currentFlags: ModifierFlags, public newFlag: ModifierFlags, public expected: boolean, public description: string) {}

}

function assertModifiers(args: ModifierTestArgs[]) {
  const lexer = new PhpLexer();
  const parser = new TestPhpParser(lexer);
  for (let i = 0; i < args.length; i++) {
    it(args[i].description, () => {
      assert.equal(parser.isAbstractAndPrivate(args[i].currentFlags, args[i].newFlag), args[i].expected);
    });
  }
}

function assertWithOptions(argList: ParserTestArgs[], options: PhpParserOptions) {
  for (let i = 0; i < argList.length; i++) {
    const args = argList[i];
    const desc = args.description || args.text;
    const testFn = args.testCallback;
    if (testFn) {
      it(desc, () => {
        const text = '<?php ' + args.text;
        const lexer = new PhpLexer(SourceTextFactory.from(text), options.version, options.is64Bit);
        const parser = new PhpParser(lexer, options);

        const root = parser.parse();
        const statements = root.statements;
        assert.equal(root.containsDiagnostics, false, 'contains diagnostics');
        assert.notStrictEqual(statements, null, 'statements not found');
        if (!statements) {
          return;
        }
        testFn(statements.childNodes(), text);
      });
    }
    else {
      it(desc);
    }
  }
}

describe('PhpParser', function() {

  describe('isAbstractAndPrivate()', function() {
    let tests = [
      // 'abstract'
      new ModifierTestArgs(ModifierFlags.None, ModifierFlags.Abstract, false, 'none and abstract'),
    //new ModifierTestArgs(ModifierFlags.Abstract, ModifierFlags.Abstract, false, 'abstract and abstract'),
      new ModifierTestArgs(ModifierFlags.Final, ModifierFlags.Abstract, false, 'final and abstract'),
      new ModifierTestArgs(ModifierFlags.Private, ModifierFlags.Abstract, true, 'private and abstract'),
      new ModifierTestArgs(ModifierFlags.Protected, ModifierFlags.Abstract, false, 'protected and abstract'),
      new ModifierTestArgs(ModifierFlags.Public, ModifierFlags.Abstract, false, 'public and abstract'),
      new ModifierTestArgs(ModifierFlags.Static, ModifierFlags.Abstract, false, 'static and abstract'),
      // 'private'
      new ModifierTestArgs(ModifierFlags.None, ModifierFlags.Private, false, 'none and private'),
      new ModifierTestArgs(ModifierFlags.Abstract, ModifierFlags.Private, true, 'abstract and private'),
      new ModifierTestArgs(ModifierFlags.Final, ModifierFlags.Private, false, 'final and private'),
    //new ModifierTestArgs(ModifierFlags.Private, ModifierFlags.Private, false, 'private and private'),
      new ModifierTestArgs(ModifierFlags.Protected, ModifierFlags.Private, false, 'protected and private'),
      new ModifierTestArgs(ModifierFlags.Public, ModifierFlags.Private, false, 'public and private'),
      new ModifierTestArgs(ModifierFlags.Static, ModifierFlags.Private, false, 'static and private'),
    ];
    assertModifiers(tests);
  });

  describe('feature: allowReservedNames', function() {
    const features = new Map<string, string>([['allowReservedNames', '']]);
    const options = new PhpParserOptions(PhpVersion.Latest, true, DocumentationMode.None, features);

    let syntaxTests = [
      new ParserTestArgs('function empty() {}', 'should parse function with reserved name', (statements, text) => {
        let funcDecl = <FunctionDeclarationSyntaxNode>statements[0];
        assert.equal(funcDecl instanceof FunctionDeclarationSyntaxNode, true, 'FunctionDeclarationSyntaxNode');
        Test.assertSyntaxToken(funcDecl.identifier, text, TokenKind.Empty, 'empty');
        assert.strictEqual(funcDecl.ampersand, null);
        assert.strictEqual(funcDecl.parameters, null);
        assert.strictEqual(funcDecl.returnType, null);
      }),
    ];
    assertWithOptions(syntaxTests, options);
  });

});
