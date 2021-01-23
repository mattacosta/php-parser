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

import { Encoding } from '../../../src/text/Encoding';
import { SegmentedText } from '../../../src/text/SegmentedText';
import { StringText } from '../../../src/text/StringText';
import { TextSpan } from '../../../src/text/TextSpan';

describe('SegmentedText', function() {

  describe('#constructor()', function() {
    it('should throw if span is not in text', () => {
      let text = new StringText('abcde', Encoding.Latin1);
      assert.throws(() => new SegmentedText(text, new TextSpan(6, 1), Encoding.Latin1));
      assert.throws(() => new SegmentedText(text, new TextSpan(3, 3), Encoding.Latin1));
    });
  });

  describe('#charCodeAt()', function() {
    let text = new StringText('abcde', Encoding.Latin1);
    let segment = new SegmentedText(text, new TextSpan(0, 3), Encoding.Latin1);
    it('should get character at first offset', () => {
      assert.strictEqual(segment.charCodeAt(0), 'a'.charCodeAt(0));
    });
    it('should get character at last offset', () => {
      assert.strictEqual(segment.charCodeAt(2), 'c'.charCodeAt(0));
    });
    it('should return NaN if offset is less than starting offset', () => {
      assert.strictEqual(Number.isNaN(segment.charCodeAt(-1)), true);
    });
    it('should return NaN if offset is greater than or equal to text length', () => {
      assert.strictEqual(Number.isNaN(segment.charCodeAt(3)), true, 'offset == text.length');
      assert.strictEqual(Number.isNaN(segment.charCodeAt(4)), true, 'offset > text.length');
    });
  });

  describe('#slice()', function() {
    let text = new StringText('abcde', Encoding.Latin1);
    let segment = new SegmentedText(text, new TextSpan(1, 3), Encoding.Latin1);
    it('should get slice if starting position is equal to text start', () => {
      assert.strictEqual(segment.slice(new TextSpan(0, 3)).substring(0), 'bcd');
      assert.strictEqual(segment.slice(0).substring(0), 'bcd');
    });
    it('should get slice if starting position is equal to text length', () => {
      assert.strictEqual(segment.slice(new TextSpan(3, 0)).substring(0), '');
      assert.strictEqual(segment.slice(3).substring(0), '');
    });
    it('should throw exception if starting position is less than starting offset', () => {
      assert.throws(() => { segment.slice(-1); });
    });
    it('should throw exception if starting position is greater than text length', () => {
      assert.throws(() => { segment.slice(new TextSpan(4, 0)); });
      assert.throws(() => { segment.slice(4); });
    });
    it('should throw exception if length is too long', () => {
      assert.throws(() => { segment.slice(new TextSpan(0, 4)); });
      assert.throws(() => { segment.slice(new TextSpan(3, 1)); });
    });
  });

  describe('#substring()', function() {
    let text = new StringText('abcde', Encoding.Latin1);
    let segment = new SegmentedText(text, new TextSpan(2, 3), Encoding.Latin1);
    it('should get substring if starting position is equal to text start', () => {
      assert.strictEqual(segment.substring(0, 1), 'c');
      assert.strictEqual(segment.substring(-3, 1), 'c');
    });
    it('should get substring if starting position is equal to text length', () => {
      assert.strictEqual(segment.substring(3, 0), '');
    });
    it('should get substring if length is negative', () => {
      assert.strictEqual(segment.substring(3, -1), '');
    });
    it('should throw exception if starting position is greater than text length', () => {
      assert.throws(() => { segment.substring(4, 0); });
    });
    it('should throw exception if starting position is less than inverse text length', () => {
      assert.throws(() => { segment.substring(-4, 0); });
    });
    it('should throw exception if length is too long', () => {
      assert.throws(() => { segment.substring(0, 4); });
      assert.throws(() => { segment.substring(3, 1); });
    });
  });

});
