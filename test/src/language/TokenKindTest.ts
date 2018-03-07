/**
 * Copyright 2018 Matt Acosta
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

import { TokenKind, TokenKindInfo } from '../../../src/language/TokenKind';

describe('TokenKindInfo', function() {

  describe('#getText()', function() {
    it('should return text for language-defined tokens', function() {
      // NOTE: The `EOF` token is language-defined, but obviously does not have
      // a textual representation, so it is treated as user-defined.
      for (let i = TokenKind.Abstract; i <= TokenKind.CloseTag; i++) {
        assert.notStrictEqual(TokenKindInfo.getText(i), TokenKind[i].toUpperCase());
      }
    });
    it('should return token name for user-defined tokens', function() {
      for (let i = TokenKind.EOF; i <= TokenKind.Whitespace; i++) {
        assert.strictEqual(TokenKindInfo.getText(i), TokenKind[i].toUpperCase());
      }
    });
  });

});
