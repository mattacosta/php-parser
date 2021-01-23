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

import { PhpLexerState } from '../../../src/parser/PhpLexerState';
import { TemplateSpan } from '../../../src/parser/TemplateSpan';

describe('TemplateSpan', function() {

  describe('#constructor()', function() {
    it('empty span', () => {
      let span = new TemplateSpan(PhpLexerState.InScript, 0, 0);
      assert.strictEqual(span.state, PhpLexerState.InScript);
      assert.strictEqual(span.start, 0);
      assert.strictEqual(span.length, 0);
    });
    it('span with non-zero start', () => {
      let span = new TemplateSpan(PhpLexerState.InScript, 5, 0);
      assert.strictEqual(span.state, PhpLexerState.InScript);
      assert.strictEqual(span.start, 5);
      assert.strictEqual(span.length, 0);
    });
    it('span with non-zero length', () => {
      let span = new TemplateSpan(PhpLexerState.InScript, 0, 5);
      assert.strictEqual(span.state, PhpLexerState.InScript);
      assert.strictEqual(span.start, 0);
      assert.strictEqual(span.length, 5);
    });
    it('span with non-zero start and non-zero length', () => {
      let span = new TemplateSpan(PhpLexerState.InScript, 5, 5);
      assert.strictEqual(span.state, PhpLexerState.InScript);
      assert.strictEqual(span.start, 5);
      assert.strictEqual(span.length, 5);
    });
    it('should throw if start is negative', () => {
      assert.throws(() => new TemplateSpan(PhpLexerState.LookingForHeredocLabel, -1, 1));
    });
    it('should throw if length is negative', () => {
      assert.throws(() => new TemplateSpan(PhpLexerState.LookingForHeredocLabel, 0, -1));
    });
  });

  describe('#fromBounds()', function() {
    it('empty span', () => {
      let span = TemplateSpan.fromBounds(PhpLexerState.InScript, 0, 0);
      assert.strictEqual(span.state, PhpLexerState.InScript);
      assert.strictEqual(span.start, 0);
      assert.strictEqual(span.length, 0);
    });
    it('span with non-zero start', () => {
      let span = TemplateSpan.fromBounds(PhpLexerState.InScript, 5, 5);
      assert.strictEqual(span.state, PhpLexerState.InScript);
      assert.strictEqual(span.start, 5);
      assert.strictEqual(span.length, 0);
    });
    it('span with non-zero length', () => {
      let span = TemplateSpan.fromBounds(PhpLexerState.InScript, 0, 5);
      assert.strictEqual(span.state, PhpLexerState.InScript);
      assert.strictEqual(span.start, 0);
      assert.strictEqual(span.length, 5);
    });
    it('span with non-zero start and non-zero length', () => {
      let span = TemplateSpan.fromBounds(PhpLexerState.InScript, 5, 10);
      assert.strictEqual(span.state, PhpLexerState.InScript);
      assert.strictEqual(span.start, 5);
      assert.strictEqual(span.length, 5);
    });
    it('should throw if end is prior to start', () => {
      assert.throws(() => TemplateSpan.fromBounds(PhpLexerState.LookingForHeredocLabel, 5, 0));
    });
  });

});
