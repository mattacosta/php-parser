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

import { TextChange } from '../../../src/text/TextChange';
import { TextSpan } from '../../../src/text/TextSpan';

describe('TextSpan', function() {

  describe('#equals()', function() {
    it('should equal the same change', () => {
      let a = new TextChange(new TextSpan(0, 3), 'abc');
      let b = new TextChange(new TextSpan(0, 3), 'abc');
      assert.equal(a.equals(a), true);  // Reference equality.
      assert.equal(a.equals(b), true);
    });
    it('should not equal a change with different spans', () => {
      let a = new TextChange(new TextSpan(0, 3), 'abc');
      let b = new TextChange(new TextSpan(3, 3), 'abc');
      assert.equal(a.equals(b), false);
    });
    it('should not equal a change with different text', () => {
      let a = new TextChange(new TextSpan(0, 3), 'abc');
      let b = new TextChange(new TextSpan(0, 3), 'xyz');
      assert.equal(a.equals(b), false);
    });
  });

});
