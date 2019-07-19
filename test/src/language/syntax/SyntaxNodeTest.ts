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

import {
  ConstantSyntaxNode,
  ExpressionStatementSyntaxNode,
  IfSyntaxNode,
  LocalVariableSyntaxNode
} from '../../../../src/language/syntax/SyntaxNode.Generated';

import { PhpSyntaxTree } from '../../../../src/parser/PhpSyntaxTree';
import { SyntaxList } from '../../../../src/language/syntax/SyntaxList';
import { TextSpan } from '../../../../src/text/TextSpan';
import { TokenKind } from '../../../../src/language/TokenKind';

describe('SyntaxNode', function() {

  describe('#containsSkippedText', function() {
    it('should contain skipped text if a token was skipped', () => {
      let tree = PhpSyntaxTree.fromText('<?php :');
      assert.equal(tree.root.containsSkippedText, true);
    });
    it('should not contain skipped text if there were no skipped tokens', () => {
      let tree = PhpSyntaxTree.fromText('<?php ;');
      assert.equal(tree.root.containsSkippedText, false);
    });
    it('should not contain skipped text if a token was missing', () => {
      let tree = PhpSyntaxTree.fromText('<?php {');
      assert.equal(tree.root.containsSkippedText, false);
    });
  });

  describe('#hasError', function() {
    it('no diagnostic', () => {
      let tree = PhpSyntaxTree.fromText('<?php $a;');
      assert.equal(tree.root.hasError, false);
    });
    it('error diagnostic', () => {
      // ERR_SemicolonExpected: ';' expected
      let tree = PhpSyntaxTree.fromText('<?php $a');
      assert.equal(tree.root.hasError, true);
    });
    it('warning diagnostic', () => {
      // WRN_UnsetCast: The '(unset)' type cast is deprecated, use 'null' instead
      let tree = PhpSyntaxTree.fromText('<?php (unset)$a;');
      assert.equal(tree.root.hasError, false);
    });
  });

  describe('#hasLeadingTrivia', function() {
    it('should have leading trivia', () => {
      let tree = PhpSyntaxTree.fromText('<?php ;');
      assert.equal(tree.root.hasLeadingTrivia, true);
    });
    it('should not have leading trivia', () => {
      let tree = PhpSyntaxTree.fromText('hello world');
      assert.equal(tree.root.hasLeadingTrivia, false);
    });
  });

  describe('#isMissing', function() {
    it('should be missing if all tokens are missing', () => {
      let tree = PhpSyntaxTree.fromText('<?php if () {}');
      let statements = tree.root.childNodes();
      let ifNode = <IfSyntaxNode>statements[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      assert.equal(ifNode.condition.isMissing, true);  // LocalVariableSyntaxNode
    });
    it('should not be missing if at least one token is present', () => {
      let tree = PhpSyntaxTree.fromText('<?php if ($a) {}');
      let statements = tree.root.childNodes();
      let ifNode = <IfSyntaxNode>statements[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      assert.equal(ifNode.condition.isMissing, false);  // LocalVariableSyntaxNode
    });
  });

  describe('#span', function() {
    it('should not include leading trivia', () => {
      let tree = PhpSyntaxTree.fromText('<?php if() {}');
      let statements = tree.root.childNodes();
      let node = <IfSyntaxNode>statements[0];
      assert.equal(node instanceof IfSyntaxNode, true);
      assert.equal(node.span.equals(new TextSpan(6, 7)), true);
    });
    it('empty span', () => {
      let tree = PhpSyntaxTree.fromText('<?php if() {}');
      let statements = tree.root.childNodes();
      let node = <IfSyntaxNode>statements[0];
      assert.equal(node instanceof IfSyntaxNode, true);
      assert.equal(node.condition.span.equals(new TextSpan(9, 0)), true);
    });
  });

  describe('#ancestors()', function() {
    it('should return a list of parent nodes', () => {
      let tree = PhpSyntaxTree.fromText('<?php if ($a == 1) {}');
      let node = tree.root.findChildNode(new TextSpan(10, 2));
      assert.equal(node instanceof LocalVariableSyntaxNode, true);
      let ancestors = node.ancestors();
      assert.equal(ancestors.length, 3);
    });
    it('should return an empty list for root nodes', () => {
      let tree = PhpSyntaxTree.fromText('<?php $a = 1;');
      let ancestors = tree.root.ancestors();
      assert.equal(ancestors.length, 0);
    });
  });

  describe('#ancestorsAndSelf()', function() {
    it('should return the current node and its parents', () => {
      let tree = PhpSyntaxTree.fromText('<?php if ($a) {}');
      let statements = tree.root.childNodes();
      let ifNode = <IfSyntaxNode>statements[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      let ancestors = ifNode.ancestorsAndSelf();
      assert.equal(ancestors.length, 2);
      assert.strictEqual(ancestors[0], ifNode);
      assert.strictEqual(ancestors[1], tree.root);
    });
  });

  describe('#contains()', function() {
    it('should contain child node', () => {
      let tree = PhpSyntaxTree.fromText('<?php if ($a) {}');
      let statements = tree.root.childNodes();
      let ifNode = <IfSyntaxNode>statements[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      assert.equal(ifNode.contains(ifNode.condition), true);
    });
    it('should contain itself', () => {
      let tree = PhpSyntaxTree.fromText('<?php if ($a) {}');
      let statements = tree.root.childNodes();
      let ifNode = <IfSyntaxNode>statements[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      assert.equal(ifNode.contains(ifNode), true);
    });
    it('should not contain sibling', () => {
      let tree = PhpSyntaxTree.fromText('<?php $a = 1; $b = 2;');
      let statements = tree.root.childNodes();
      let firstExpr = <ExpressionStatementSyntaxNode>statements[0];
      assert.equal(firstExpr instanceof ExpressionStatementSyntaxNode, true);
      let secondExpr = <ExpressionStatementSyntaxNode>statements[1];
      assert.equal(secondExpr instanceof ExpressionStatementSyntaxNode, true);
      assert.equal(firstExpr.contains(secondExpr), false);
    });
    it('should not contain parent', () => {
      let tree = PhpSyntaxTree.fromText('<?php if ($a) {}');
      let statements = tree.root.childNodes();
      let ifNode = <IfSyntaxNode>statements[0];
      assert.equal(ifNode instanceof IfSyntaxNode, true);
      assert.equal(ifNode.contains(tree.root), false);
    });
  });

  describe('#findChildNode()', function() {
    // @todo Disabled. Works when debugging, fails otherwise???
    // it('should get root node if span is at eof', function() {
    //   let tree = PhpSyntaxTree.fromText('<?php if($a){}');
    //   let node = tree.root.findChildNode(new TextSpan(14, 0));
    //   assert.equal(node instanceof SourceTextSyntaxNode, true);
    // });

    it('should get parent node if span does not contain child', function() {
      let tree = PhpSyntaxTree.fromText('<?php if($a){}');
      let node = tree.root.findChildNode(new TextSpan(10, 2));  // "a)"
      assert.equal(node instanceof IfSyntaxNode, true);
    });
    it('should get parent node if span contains multiple children', function() {
      let tree = PhpSyntaxTree.fromText('<?php if($a){}');
      let node = tree.root.findChildNode(new TextSpan(10, 3));  // "a){"
      assert.equal(node instanceof IfSyntaxNode, true);
    });
    it('should get child node', function() {
      let tree = PhpSyntaxTree.fromText('<?php if($a){}');
      let node = tree.root.findChildNode(new TextSpan(9, 2));  // "$a"
      assert.equal(node instanceof LocalVariableSyntaxNode, true);
    });

    it('should get node if span is empty', function() {
      let tree = PhpSyntaxTree.fromText('<?php if($a){}');
      let node = tree.root.findChildNode(new TextSpan(9, 0));  // ""
      assert.equal(node instanceof LocalVariableSyntaxNode, true);
    });
    it('should get node if span contains trivia', function() {
      let tree = PhpSyntaxTree.fromText('<?php if( $a){}');
      let node = tree.root.findChildNode(new TextSpan(9, 1));  // " "
      assert.equal(node instanceof LocalVariableSyntaxNode, true);
    });
    it('should get node if span partially contains token', function() {
      let tree = PhpSyntaxTree.fromText('<?php if($a){}');
      let node = tree.root.findChildNode(new TextSpan(9, 1));  // "$"
      assert.equal(node instanceof LocalVariableSyntaxNode, true);
    });

    // ConstantSyntaxNode -> PartiallyQualifiedSyntaxNode -> SyntaxList -> SyntaxToken

    it('should get outermost node', function() {
      let tree = PhpSyntaxTree.fromText('<?php if(A){}');
      let node = tree.root.findChildNode(new TextSpan(9, 1));  // "A"
      assert.equal(node instanceof ConstantSyntaxNode, true);
    });
    it('should get innermost node', function() {
      let tree = PhpSyntaxTree.fromText('<?php if(A){}');
      let node = tree.root.findChildNode(new TextSpan(9, 1), true);  // "A"
      assert.equal(node instanceof SyntaxList, true);
    });
  });

  describe('#findChildToken()', function() {
    it('should get token at start of file', function() {
      let text = 'hello world';
      let tree = PhpSyntaxTree.fromText(text);
      Test.assertSyntaxToken(tree.root.findChildToken(0), text, TokenKind.InlineText, 'hello world');
    });

    it('should get token at end of file', function() {
      let text = '<?php $x = 1;';
      let tree = PhpSyntaxTree.fromText(text);
      Test.assertSyntaxToken(tree.root.findChildToken(12), text, TokenKind.Semicolon, ';');
      // The EOF token never contains the given offset, but still needs to be
      // reachable since it is not considered to be "missing".
      Test.assertSyntaxToken(tree.root.findChildToken(13), text, TokenKind.EOF, '');
    });

    it('should get token if offset is in trivia', function() {
      let text = '<?php $x = 1;';
      let tree = PhpSyntaxTree.fromText(text);
      Test.assertSyntaxToken(tree.root.findChildToken(0), text, TokenKind.Variable, '$x');
      Test.assertSyntaxToken(tree.root.findChildToken(3), text, TokenKind.Variable, '$x');
      Test.assertSyntaxToken(tree.root.findChildToken(6), text, TokenKind.Variable, '$x');
    });

    it('should not get token outside of node span', function() {
      let text = '<?php $x = 1; $y = 2;';
      let tree = PhpSyntaxTree.fromText(text);
      let statements = tree.root.childNodes();

      let firstExpr = statements[0];
      assert.equal(firstExpr instanceof ExpressionStatementSyntaxNode, true);
      assert.throws(() => firstExpr.findChildToken(14));  // "$y"

      let secondExpr = statements[1];
      assert.equal(secondExpr instanceof ExpressionStatementSyntaxNode, true);
      assert.throws(() => secondExpr.findChildToken(12));  // ";"
      assert.throws(() => secondExpr.findChildToken(21));  // EOF
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

  describe('#getAncestors()', function() {
    it('should return a list of parent nodes', () => {
      let tree = PhpSyntaxTree.fromText('<?php if ($a == 1) {}');
      let node = tree.root.findChildNode(new TextSpan(10, 2));
      assert.equal(node instanceof LocalVariableSyntaxNode, true);
      let ancestors = Array.from(node.getAncestors());
      assert.equal(ancestors.length, 3);
    });
    it('should return an empty list for root nodes', () => {
      let tree = PhpSyntaxTree.fromText('<?php $a = 1;');
      let ancestors = Array.from(tree.root.getAncestors());
      assert.equal(ancestors.length, 0);
    });
  });

  describe('#getChildNodes()', function() {
    it('should return child node', () => {
      let tree = PhpSyntaxTree.fromText('<?php $a = 1;');
      let children = Array.from(tree.root.getChildNodes());
      // The nested AssignmentSyntaxNode should not be returned.
      assert.equal(children.length, 1);
      assert.equal(children[0] instanceof ExpressionStatementSyntaxNode, true);
    });
    it('should return multiple child nodes', () => {
      let tree = PhpSyntaxTree.fromText('<?php $a = 1; if ($a) { return; }');
      let children = Array.from(tree.root.getChildNodes());
      assert.equal(children.length, 2);
      assert.equal(children[0] instanceof ExpressionStatementSyntaxNode, true);
      assert.equal(children[1] instanceof IfSyntaxNode, true);
    });
    it('should not return nodes if there are no children', () => {
      let tree = PhpSyntaxTree.fromText('');
      let children = Array.from(tree.root.getChildNodes());
      assert.equal(children.length, 0);
    });
  });

  describe('#getChildTokens()', function() {
    it('should return child token', () => {
      let tree = PhpSyntaxTree.fromText('<?php 1;');
      let tokens = Array.from(tree.root.getChildTokens());
      // There shouldn't be any tokens from child nodes.
      assert.equal(tokens.length, 1);
      assert.equal(tokens[0].kind, TokenKind.EOF);
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
