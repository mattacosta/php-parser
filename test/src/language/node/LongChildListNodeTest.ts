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

import { LongChildListNode } from '../../../../src/language/node/NodeList';
import { MissingTokenWithTriviaNode, TokenNode } from '../../../../src/language/node/TokenNode';
import { NodeFlags } from '../../../../src/language/node/NodeFlags';
import { TokenKind } from '../../../../src/language/TokenKind';

function createLongList(): LongChildListNode {
  const abstract = new TokenNode(TokenKind.Abstract, 7);
  const ampersand = new TokenNode(TokenKind.Ampersand, 1);
  const andEqual = new TokenNode(TokenKind.AndEqual, 2);
  return new LongChildListNode([abstract, ampersand, andEqual]);
}

describe('LongChildListNode', function() {

  describe('#flags', function() {
    it('is not missing flag (none missing)', function() {
      const list = createLongList();
      assert.strictEqual(list.flags, NodeFlags.IsNotMissing);
    });
    it('is not missing flag (all missing)', () => {
      const abstract = new MissingTokenWithTriviaNode(TokenKind.Abstract, null);
      const list = new LongChildListNode([abstract]);
      assert.strictEqual(list.flags, NodeFlags.None);
    });
  });

  describe('#fullWidth', function() {
    it('should include all children', () => {
      const list = createLongList();
      assert.strictEqual(list.fullWidth, 10);
    });
  });

  describe('#indexAtOffset()', function() {
    it('should get index of first child', () => {
      const list = createLongList();
      assert.strictEqual(list.indexAtOffset(0), 0);
    });
    it('should get index of middle child', () => {
      const list = createLongList();
      assert.strictEqual(list.indexAtOffset(7), 1);
    });
    it('should get index of last child', () => {
      const list = createLongList();
      assert.strictEqual(list.indexAtOffset(8), 2);
    });
  });

  describe('#offsetAt()', function() {
    it('should get offset of first child', () => {
      const list = createLongList();
      assert.strictEqual(list.offsetAt(0), 0);
    });
    it('should get offset of middle child', () => {
      const list = createLongList();
      assert.strictEqual(list.offsetAt(1), 7);
    });
    it('should get offset of last child', () => {
      const list = createLongList();
      assert.strictEqual(list.offsetAt(2), 8);
    });
  });

});
