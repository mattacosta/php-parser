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
    it('should throw if start is negative', () => {
      assert.throws(() => new TemplateSpan(PhpLexerState.LookingForHeredocLabel, -1, 1));
    });
    it('should throw if length is negative', () => {
      assert.throws(() => new TemplateSpan(PhpLexerState.LookingForHeredocLabel, 0, -1));
    });
  });

  describe('#fromBounds()', function() {
    it('should create span from end offset', () => {
      let span = TemplateSpan.fromBounds(PhpLexerState.LookingForHeredocLabel, 10, 15);
      assert.equal(span.state, PhpLexerState.LookingForHeredocLabel);
      assert.equal(span.start, 10);
      assert.equal(span.length, 5);
    });
  });

});
