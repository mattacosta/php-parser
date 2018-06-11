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
  ConstantSyntaxNode,
  IfSyntaxNode,
  LocalVariableSyntaxNode
} from '../../../../src/language/syntax/SyntaxNode.Generated';

import { PhpSyntaxTree } from '../../../../src/parser/PhpSyntaxTree';
import { SyntaxList } from '../../../../src/language/syntax/SyntaxList';
import { TextSpan } from '../../../../src/text/TextSpan';
import { TokenKind } from '../../../../src/language/TokenKind';

describe('SyntaxNode', function() {

  describe('#findChildNodeAt()', function() {
    // @todo Disabled. Works when debugging, fails otherwise???
    // it('should get root node if span is at eof', function() {
    //   let tree = PhpSyntaxTree.fromText('<?php if($a){}');
    //   let node = tree.root.findChildNodeAt(new TextSpan(14, 0));
    //   assert.equal(node instanceof SourceTextSyntaxNode, true);
    // });

    it('should get parent node if span does not contain child', function() {
      let tree = PhpSyntaxTree.fromText('<?php if($a){}');
      let node = tree.root.findChildNodeAt(new TextSpan(10, 2));  // "a)"
      assert.equal(node instanceof IfSyntaxNode, true);
    });
    it('should get parent node if span contains multiple children', function() {
      let tree = PhpSyntaxTree.fromText('<?php if($a){}');
      let node = tree.root.findChildNodeAt(new TextSpan(10, 3));  // "a){"
      assert.equal(node instanceof IfSyntaxNode, true);
    });
    it('should get child node', function() {
      let tree = PhpSyntaxTree.fromText('<?php if($a){}');
      let node = tree.root.findChildNodeAt(new TextSpan(9, 2));  // "$a"
      assert.equal(node instanceof LocalVariableSyntaxNode, true);
    });


    it('should get node if span is empty', function() {
      let tree = PhpSyntaxTree.fromText('<?php if($a){}');
      let node = tree.root.findChildNodeAt(new TextSpan(9, 0));  // ""
      assert.equal(node instanceof LocalVariableSyntaxNode, true);
    });
    it('should get node if span contains trivia', function() {
      let tree = PhpSyntaxTree.fromText('<?php if( $a){}');
      let node = tree.root.findChildNodeAt(new TextSpan(9, 1));  // " "
      assert.equal(node instanceof LocalVariableSyntaxNode, true);
    });
    it('should get node if span partially contains token', function() {
      let tree = PhpSyntaxTree.fromText('<?php if($a){}');
      let node = tree.root.findChildNodeAt(new TextSpan(9, 1));  // "$"
      assert.equal(node instanceof LocalVariableSyntaxNode, true);
    });

    // ConstantSyntaxNode -> PartiallyQualifiedSyntaxNode -> SyntaxList -> SyntaxToken

    it('should get outermost node', function() {
      let tree = PhpSyntaxTree.fromText('<?php if(A){}');
      let node = tree.root.findChildNodeAt(new TextSpan(9, 1));  // "A"
      assert.equal(node instanceof ConstantSyntaxNode, true);
    });
    it('should get innermost node', function() {
      let tree = PhpSyntaxTree.fromText('<?php if(A){}');
      let node = tree.root.findChildNodeAt(new TextSpan(9, 1), true);  // "A"
      assert.equal(node instanceof SyntaxList, true);
    });
  });

  describe('#firstToken()', function() {
    it('should return first token', function() {
      let text = '<?php if(A){}';
      let tree = PhpSyntaxTree.fromText(text);
      let ifNode = <IfSyntaxNode>tree.root.childNodes()[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      Test.assertSyntaxToken(ifNode.statement.firstToken(), text, TokenKind.OpenBrace, '{');
    });

    it('should return null if token must have width and node contains missing tokens', function() {
      let tree = PhpSyntaxTree.fromText('<?php if(A)');
      let ifNode = <IfSyntaxNode>tree.root.childNodes()[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      assert.strictEqual(ifNode.statement.firstToken(), null);
    });
  });

  describe('#lastToken()', function() {
    it('should return last token', function() {
      let text = '<?php if(A){}';
      let tree = PhpSyntaxTree.fromText(text);
      let ifNode = <IfSyntaxNode>tree.root.childNodes()[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      Test.assertSyntaxToken(ifNode.statement.lastToken(), text, TokenKind.CloseBrace, '}');
    });

    it('should return last token (with width; node contains missing token)', function() {
      let text = '<?php if(A){';
      let tree = PhpSyntaxTree.fromText(text);
      let ifNode = <IfSyntaxNode>tree.root.childNodes()[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      Test.assertSyntaxToken(ifNode.statement.lastToken(), text, TokenKind.OpenBrace, '{');
    });

    it('should return last token (without width; node contains missing token)', function() {
      let text = '<?php if(A){';
      let tree = PhpSyntaxTree.fromText(text);
      let ifNode = <IfSyntaxNode>tree.root.childNodes()[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      Test.assertSyntaxToken(ifNode.statement.lastToken(true), text, TokenKind.CloseBrace, '', true);
    });

    it('should return null if token must have width and node contains missing tokens', function() {
      let tree = PhpSyntaxTree.fromText('<?php if(A)');
      let ifNode = <IfSyntaxNode>tree.root.childNodes()[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      assert.strictEqual(ifNode.statement.lastToken(), null);
    });
  });

});
