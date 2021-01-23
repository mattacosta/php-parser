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

import { SourceTextFactory } from '../../../src/text/SourceTextFactory';
import { TextChange } from '../../../src/text/TextChange';
import { TextSpan } from '../../../src/text/TextSpan';

describe('SourceTextBase', function() {

  describe('#equals()', function() {
    it('should equal the same text', () => {
      let a = SourceTextFactory.from('abc');
      let b = SourceTextFactory.from('abc');
      assert.strictEqual(a.equals(a), true);  // Reference equality.
      assert.strictEqual(a.equals(b), true);
    });
    it('should not equal text with different length', () => {
      let a = SourceTextFactory.from('abc');
      let b = SourceTextFactory.from('abcabc');
      assert.strictEqual(a.equals(b), false);
    });
    it('should not equal different text', () => {
      let a = SourceTextFactory.from('abc');
      let b = SourceTextFactory.from('xyz');
      assert.strictEqual(a.equals(b), false);
    });
  });

  describe('#withChanges()', function() {
    let text = SourceTextFactory.from('abc');

    it('insert from start', () => {
      let change = new TextChange(new TextSpan(0, 0), 'x');
      assert.strictEqual(text.withChanges([change]).substring(0), 'xabc');
    });
    it('insert from middle', () => {
      let change = new TextChange(new TextSpan(1, 0), 'x');
      assert.strictEqual(text.withChanges([change]).substring(0), 'axbc');
    });
    it('insert from end', () => {
      let change = new TextChange(new TextSpan(3, 0), 'x');
      assert.strictEqual(text.withChanges([change]).substring(0), 'abcx');
    });
    it('insert with no text', () => {
      let change = new TextChange(new TextSpan(2, 0), '');
      assert.strictEqual(text.withChanges([change]), text);
    });

    it('delete from start', () => {
      let change = new TextChange(new TextSpan(0, 1), '');
      assert.strictEqual(text.withChanges([change]).substring(0), 'bc');
    });
    it('delete from middle', () => {
      let change = new TextChange(new TextSpan(1, 1), '');
      assert.strictEqual(text.withChanges([change]).substring(0), 'ac');
    });
    it('delete from end', () => {
      let change = new TextChange(new TextSpan(2, 1), '');
      assert.strictEqual(text.withChanges([change]).substring(0), 'ab');
    });
    it('delete with no length', () => {
      let change = new TextChange(new TextSpan(0, 0), '');
      assert.strictEqual(text.withChanges([change]), text);
    });

    it('replace from start', () => {
      let change = new TextChange(new TextSpan(0, 1), 'x');
      assert.strictEqual(text.withChanges([change]).substring(0), 'xbc');
    });
    it('replace from middle', () => {
      let change = new TextChange(new TextSpan(1, 1), 'x');
      assert.strictEqual(text.withChanges([change]).substring(0), 'axc');
    });
    it('replace from end', () => {
      let change = new TextChange(new TextSpan(2, 1), 'x');
      assert.strictEqual(text.withChanges([change]).substring(0), 'abx');
    });

    it('should throw exception if changes are not sequential', () => {
      let first = new TextChange(new TextSpan(2, 1), '');  // Delete at end.
      let second = new TextChange(new TextSpan(0, 1), '');  // Delete at start.
      assert.throws(() => { text.withChanges([first, second]); });
    });
    it('should throw exception if changes overlap', () => {
      let first = new TextChange(new TextSpan(0, 2), 'cd');  // Replace first two characters.
      let second = new TextChange(new TextSpan(1, 2), 'ab');  // Replace last two characters.
      assert.throws(() => { text.withChanges([first, second]); });
    });
  });

});
