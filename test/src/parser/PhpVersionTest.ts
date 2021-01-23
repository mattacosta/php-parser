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

import { PhpVersion, PhpVersionInfo } from '../../../src/parser/PhpVersion';

describe('PhpVersionInfo', function() {

  describe('#getText()', function() {
    it('should return text for all versions', () => {
      assert.strictEqual(PhpVersionInfo.getText(PhpVersion.Any), '');
      for (let version = PhpVersion.PHP7_0; version <= PhpVersion.Latest; version++) {
        assert.notStrictEqual(PhpVersionInfo.getText(version), '');
      }
    });
  });

});
