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

import { ModifierFlags } from '../../../src/parser/ModifierFlags';
import { PhpLexer } from '../../../src/parser/PhpLexer';
import { PhpParser } from '../../../src/parser/PhpParser';
import { Precedence } from '../../../src/parser/Precedence';
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

})
