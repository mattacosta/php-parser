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

import {
  ExpressionStatementSyntaxNode
} from '../../../../src/language/syntax/SyntaxNode.Generated';

import { ISyntaxTriviaList } from '../../../../src/language/syntax/ISyntaxTriviaList';
import { PhpSyntaxTree } from '../../../../src/parser/PhpSyntaxTree';
import { TextSpan } from '../../../../src/text/TextSpan';

describe('SyntaxTrivia', function() {

  const text = '<?php } /* comment */;';
  const tree = PhpSyntaxTree.fromText(text);

  describe('#fullSpan', function() {
    it('should include the entire token', () => {
      let node = <ExpressionStatementSyntaxNode>tree.root.childNodes()[0];
      let leadingTrivia = <ISyntaxTriviaList>node.leadingTrivia;
      let comment = leadingTrivia.triviaAt(4);
      assert.equal(comment.fullSpan.equals(new TextSpan(8, 13)), true);
    });
  });

  describe('#equals()', function() {
    it('should equal itself', () => {
      let node = <ExpressionStatementSyntaxNode>tree.root.childNodes()[0];
      let leadingTrivia = <ISyntaxTriviaList>node.leadingTrivia;
      let openTag = leadingTrivia.triviaAt(0);
      assert.equal(openTag.equals(openTag), true);
    });
    it('should equal equivalent instances', () => {
      let node = <ExpressionStatementSyntaxNode>tree.root.childNodes()[0];
      let leadingTrivia = <ISyntaxTriviaList>node.leadingTrivia;
      let a = leadingTrivia.triviaAt(0);
      let b = leadingTrivia.triviaAt(0);
      // This test only works if the trivia list creates new objects on demand.
      assert.notStrictEqual(a, b, 'same object');
      assert.equal(a.equals(b), true);
    });
  });

});
