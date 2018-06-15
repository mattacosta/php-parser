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
import * as mocha from 'mocha';

import { Test } from '../../Test';

import {
  ExpressionStatementSyntaxNode,
  StatementBlockSyntaxNode
} from '../../../../src/language/syntax/SyntaxNode.Generated';

import { PhpSyntaxTree } from '../../../../src/parser/PhpSyntaxTree';
import { SourceTextFactory } from '../../../../src/text/SourceTextFactory';
import { SyntaxToken } from '../../../../src/language/syntax/SyntaxToken';
import { TextSpan } from '../../../../src/text/TextSpan';
import { TokenKind } from '../../../../src/language/TokenKind';

describe('SyntaxToken', function() {

  describe('#getText()', function() {
    const text = SourceTextFactory.from('<?php { ; }');
    const tree = PhpSyntaxTree.fromText('<?php { ; }');

    it('should get text', function() {
      let node = <StatementBlockSyntaxNode>tree.root.childNodes()[0];
      assert.equal(node instanceof StatementBlockSyntaxNode, true);
      assert.equal(SyntaxToken.getText(node.openBrace, text), '{');
    });
    it('should get text at end of source', function() {
      let node = <StatementBlockSyntaxNode>tree.root.childNodes()[0];
      assert.equal(node instanceof StatementBlockSyntaxNode, true);
      assert.equal(SyntaxToken.getText(node.closeBrace, text), '}');
    });
    it('should throw exception if token is not in source', function() {
      let changedText = SourceTextFactory.from('<?php { }');
      let node = <StatementBlockSyntaxNode>tree.root.childNodes()[0];
      assert.equal(node instanceof StatementBlockSyntaxNode, true);
      assert.throws(() => { SyntaxToken.getText(node.closeBrace, changedText); });
    });
  });

  describe('#nextToken()', function() {
    it('should get next token in same node', function() {
      let text = '<?php {}';
      let tree = PhpSyntaxTree.fromText(text);
      let node = <StatementBlockSyntaxNode>tree.root.childNodes()[0];
      assert.equal(node instanceof StatementBlockSyntaxNode, true);
      Test.assertSyntaxToken(node.openBrace.nextToken(), text, TokenKind.CloseBrace, '}');
    });

    it('should get next token in sibling node', function() {
      let text = '<?php {} {}';
      let tree = PhpSyntaxTree.fromText(text);
      let node = <StatementBlockSyntaxNode>tree.root.childNodes()[0];
      assert.equal(node instanceof StatementBlockSyntaxNode, true);
      Test.assertSyntaxToken(node.closeBrace.nextToken(), text, TokenKind.OpenBrace, '{');
    });

    it('should get next token in parent node', function() {
      let text = '<?php { ; }';
      let tree = PhpSyntaxTree.fromText(text);
      let node = <ExpressionStatementSyntaxNode>tree.root.findChildNodeAt(new TextSpan(8, 1));
      assert.equal(node instanceof ExpressionStatementSyntaxNode, true);
      Test.assertSyntaxToken(node.semicolon.nextToken(), text, TokenKind.CloseBrace, '}');
    });

    it('should get next token in child node', function() {
      let text = '<?php { ; }';
      let tree = PhpSyntaxTree.fromText(text);
      let node = <StatementBlockSyntaxNode>tree.root.childNodes()[0];
      assert.equal(node instanceof StatementBlockSyntaxNode, true);
      Test.assertSyntaxToken(node.openBrace.nextToken(), text, TokenKind.Semicolon, ';');
    });

    it('should return null if at end of file', function() {
      let text = '<?php {}';
      let tree = PhpSyntaxTree.fromText(text);
      let node = <StatementBlockSyntaxNode>tree.root.childNodes()[0];
      assert.equal(node instanceof StatementBlockSyntaxNode, true);
      assert.strictEqual(node.closeBrace.nextToken(), null);
    });
  });

  describe('#previousToken()', function() {
    it('should get previous token in same node', function() {
      let text = '<?php {}';
      let tree = PhpSyntaxTree.fromText(text);
      let node = <StatementBlockSyntaxNode>tree.root.childNodes()[0];
      assert.equal(node instanceof StatementBlockSyntaxNode, true);
      Test.assertSyntaxToken(node.closeBrace.previousToken(), text, TokenKind.OpenBrace, '{');
    });

    it('should get previous token in sibling node', function() {
      let text = '<?php {} {}';
      let tree = PhpSyntaxTree.fromText(text);
      let node = <StatementBlockSyntaxNode>tree.root.childNodes()[1];
      assert.equal(node instanceof StatementBlockSyntaxNode, true);
      Test.assertSyntaxToken(node.openBrace.previousToken(), text, TokenKind.CloseBrace, '}');
    });

    it('should get previous token in parent node', function() {
      let text = '<?php { ; }';
      let tree = PhpSyntaxTree.fromText(text);
      let node = <ExpressionStatementSyntaxNode>tree.root.findChildNodeAt(new TextSpan(8, 1));
      assert.equal(node instanceof ExpressionStatementSyntaxNode, true);
      Test.assertSyntaxToken(node.semicolon.previousToken(), text, TokenKind.OpenBrace, '{');
    });

    it('should get previous token in child node', function() {
      let text = '<?php { ; }';
      let tree = PhpSyntaxTree.fromText(text);
      let node = <StatementBlockSyntaxNode>tree.root.childNodes()[0];
      assert.equal(node instanceof StatementBlockSyntaxNode, true);
      Test.assertSyntaxToken(node.closeBrace.previousToken(), text, TokenKind.Semicolon, ';');
    });

    it('should return null if at start of file', function() {
      let text = '<?php {}';
      let tree = PhpSyntaxTree.fromText(text);
      let node = <StatementBlockSyntaxNode>tree.root.childNodes()[0];
      assert.equal(node instanceof StatementBlockSyntaxNode, true);
      assert.strictEqual(node.openBrace.previousToken(), null);
    });
  });

});
