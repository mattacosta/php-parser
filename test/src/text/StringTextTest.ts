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

import { StringText } from '../../../src/text/StringText';
import { TextSpan } from '../../../src/text/TextSpan';

describe('StringText', function() {

  describe('#charCodeAt()', function() {
    let text = new StringText('abc');
    it('should get character at first offset', () => {
      assert.equal(text.charCodeAt(0), 'a'.charCodeAt(0));
    });
    it('should get character at last offset', () => {
      assert.equal(text.charCodeAt(2), 'c'.charCodeAt(0));
    });
    it('should return NaN if offset is less than starting offset', () => {
      assert.equal(Number.isNaN(text.charCodeAt(-1)), true);
    });
    it('should return NaN if offset is greater than or equal to text length', () => {
      assert.equal(Number.isNaN(text.charCodeAt(3)), true, 'offset == text.length');
      assert.equal(Number.isNaN(text.charCodeAt(4)), true, 'offset > text.length');
    });
  });

  describe('#slice()', function() {
    let text = new StringText('abc');
    it('should get slice if starting position is equal to text start', () => {
      assert.equal(text.slice(new TextSpan(0, 3)).substring(0), 'abc');
      assert.equal(text.slice(0).substring(0), 'abc');
    });
    it('should get slice if starting position is equal to text length', () => {
      assert.equal(text.slice(new TextSpan(3, 0)).substring(0), '');
      assert.equal(text.slice(3).substring(0), '');
    });
    it('should throw exception if starting position is less than starting offset', () => {
      assert.throws(() => { text.slice(-1); });
    });
    it('should throw exception if starting position is greater than text length', () => {
      assert.throws(() => { text.slice(new TextSpan(4, 0)); });
      assert.throws(() => { text.slice(4); });
    });
    it('should throw exception if length is too long', () => {
      assert.throws(() => { text.slice(new TextSpan(0, 4)); });
      assert.throws(() => { text.slice(new TextSpan(3, 1)); });
    });
  });

  describe('#substring()', function() {
    let text = new StringText('abc');
    it('should get substring if starting position is equal to text start', () => {
      assert.equal(text.substring(0, 1), 'a');
      assert.equal(text.substring(-3, 1), 'a');
    });
    it('should get substring if starting position is equal to text length', () => {
      assert.equal(text.substring(3, 0), '');
    });
    it('should get substring if length is negative', () => {
      assert.equal(text.substring(3, -1), '');
    });
    it('should throw exception if starting position is greater than text length', () => {
      assert.throws(() => { text.substring(4, 0); });
    });
    it('should throw exception if starting position is less than inverse text length', () => {
      assert.throws(() => { text.substring(-4, 0); });
    });
    it('should throw exception if length is too long', () => {
      assert.throws(() => { text.substring(0, 4); });
      assert.throws(() => { text.substring(3, 1); });
    });
  });

});
