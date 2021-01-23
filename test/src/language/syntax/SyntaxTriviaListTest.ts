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

import { Test } from '../../Test';

import { ISyntaxTriviaList } from '../../../../src/language/syntax/ISyntaxTriviaList';
import { PhpSyntaxTree } from '../../../../src/parser/PhpSyntaxTree';
import { TextSpan } from '../../../../src/text/TextSpan';
import { TokenKind } from '../../../../src/language/TokenKind';

describe('SyntaxTriviaList', function() {

  const text = '<?php } /* comment */;';
  const tree = PhpSyntaxTree.fromText(text);

  describe('#fullSpan', function() {
    it('should include all trivia', () => {
      let leadingTrivia = <ISyntaxTriviaList>tree.root.leadingTrivia;
      assert.strictEqual(leadingTrivia.fullSpan.equals(new TextSpan(0, 21)), true);
    });
    it('should be empty if there is no trivia', () => {
      let leadingTrivia = <ISyntaxTriviaList>tree.root.eof.leadingTrivia;
      assert.strictEqual(leadingTrivia.fullSpan.equals(new TextSpan(22, 0)), true);
    });
  });

  describe('#span', function() {
    it('should include all trivia', () => {
      let leadingTrivia = <ISyntaxTriviaList>tree.root.leadingTrivia;
      assert.strictEqual(leadingTrivia.span.equals(new TextSpan(0, 21)), true);
    });
    it('should be empty if there is no trivia', () => {
      let leadingTrivia = <ISyntaxTriviaList>tree.root.eof.leadingTrivia;
      assert.strictEqual(leadingTrivia.span.equals(new TextSpan(22, 0)), true);
    });
  });

  describe('#equals()', function() {
    it('should equal itself', () => {
      let leadingTrivia = <ISyntaxTriviaList>tree.root.leadingTrivia;
      assert.strictEqual(leadingTrivia.equals(leadingTrivia), true);
    });
  });

  describe('#triviaAt()', function() {
    it('should get first trivia in list', () => {
      let leadingTrivia = <ISyntaxTriviaList>tree.root.leadingTrivia;
      Test.assertSyntaxTrivia(leadingTrivia.triviaAt(0), text, TokenKind.OpenTag, '<?php');
    });
    it('should get last trivia in list', () => {
      let leadingTrivia = <ISyntaxTriviaList>tree.root.leadingTrivia;
      Test.assertSyntaxTrivia(leadingTrivia.triviaAt(4), text, TokenKind.MultipleLineComment, '/* comment */');
    });
    it('should throw if index is not in list', () => {
      let leadingTrivia = <ISyntaxTriviaList>tree.root.leadingTrivia;
      assert.throws(() => leadingTrivia.triviaAt(-1));
      assert.throws(() => leadingTrivia.triviaAt(5));
    });
  });

});
