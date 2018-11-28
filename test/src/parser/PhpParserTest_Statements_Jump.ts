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
  DiagnosticTestArgs,
  ParserTestArgs,
  Test
} from '../Test';

import {
  BreakSyntaxNode,
  ContinueSyntaxNode,
  ExpressionGroupSyntaxNode,
  GoToSyntaxNode,
  LiteralSyntaxNode,
  LocalVariableSyntaxNode,
  ReturnSyntaxNode,
  ThrowSyntaxNode
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';

describe('PhpParser', function() {

  describe('jump-statement', function() {

    describe('break-statement', function() {
      let tests = [
        new ParserTestArgs('break;', 'should parse a break statement', (statements) => {
          let breakNode = <BreakSyntaxNode>statements[0];
          assert.equal(breakNode instanceof BreakSyntaxNode, true, 'BreakSyntaxNode');
          assert.strictEqual(breakNode.depth, null);
        }),
        new ParserTestArgs('break 1;', 'should parse a break statement with a depth', (statements) => {
          let breakNode = <BreakSyntaxNode>statements[0];
          assert.equal(breakNode instanceof BreakSyntaxNode, true, 'BreakSyntaxNode');
          assert.equal(breakNode.depth instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('break (1);', 'should parse a break statement with a depth (expression group with integer)', (statements) => {
          let breakNode = <BreakSyntaxNode>statements[0];
          assert.equal(breakNode instanceof BreakSyntaxNode, true, 'BreakSyntaxNode');
          let exprGroup = <ExpressionGroupSyntaxNode>breakNode.depth;
          assert.equal(exprGroup instanceof ExpressionGroupSyntaxNode, true);
          assert.equal(exprGroup.expression instanceof LiteralSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(tests);

      let diagnosticTests = [
        new DiagnosticTestArgs('break', 'missing depth or semicolon', [ErrorCode.ERR_IterationDepthOrSemicolonExpected], [5]),
        new DiagnosticTestArgs('break 1', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [7]),
        new DiagnosticTestArgs('break $a;', 'invalid depth', [ErrorCode.ERR_InvalidIterationDepth], [6]),
        new DiagnosticTestArgs('break 1 + 1;', 'invalid depth (binary expression)', [ErrorCode.ERR_InvalidIterationDepth], [6]),
        new DiagnosticTestArgs('break -1;', 'invalid depth (unary expression)', [ErrorCode.ERR_InvalidIterationDepth], [6]),
        new DiagnosticTestArgs('break (1 + 1);', 'invalid depth (expression group with binary expression)', [ErrorCode.ERR_InvalidIterationDepth], [7]),
        new DiagnosticTestArgs('break (+1);', 'invalid depth (expression group with unary expression)', [ErrorCode.ERR_InvalidIterationDepth], [7]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('continue-statement', function() {
      let tests = [
        new ParserTestArgs('continue;', 'should parse a continue statement', (statements) => {
          let continueNode = <ContinueSyntaxNode>statements[0];
          assert.equal(continueNode instanceof ContinueSyntaxNode, true, 'ContinueSyntaxNode');
          assert.strictEqual(continueNode.depth, null);
        }),
        new ParserTestArgs('continue 1;', 'should parse a continue statement with a depth', (statements) => {
          let continueNode = <ContinueSyntaxNode>statements[0];
          assert.equal(continueNode instanceof ContinueSyntaxNode, true, 'ContinueSyntaxNode');
          assert.equal(continueNode.depth instanceof LiteralSyntaxNode, true);
        }),
        new ParserTestArgs('continue (1);', 'should parse a continue statement with a depth (expression group with integer)', (statements) => {
          let continueNode = <ContinueSyntaxNode>statements[0];
          assert.equal(continueNode instanceof ContinueSyntaxNode, true, 'ContinueSyntaxNode');
          let exprGroup = <ExpressionGroupSyntaxNode>continueNode.depth;
          assert.equal(exprGroup instanceof ExpressionGroupSyntaxNode, true);
          assert.equal(exprGroup.expression instanceof LiteralSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(tests);

      let diagnosticTests = [
        new DiagnosticTestArgs('continue', 'missing depth or semicolon', [ErrorCode.ERR_IterationDepthOrSemicolonExpected], [8]),
        new DiagnosticTestArgs('continue 1', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [10]),
        new DiagnosticTestArgs('continue $a;', 'invalid depth', [ErrorCode.ERR_InvalidIterationDepth], [9]),
        new DiagnosticTestArgs('continue 1 + 1;', 'invalid depth (binary expression)', [ErrorCode.ERR_InvalidIterationDepth], [9]),
        new DiagnosticTestArgs('continue -1;', 'invalid depth (unary expression)', [ErrorCode.ERR_InvalidIterationDepth], [9]),
        new DiagnosticTestArgs('continue (1 + 1);', 'invalid depth (expression group with binary expression)', [ErrorCode.ERR_InvalidIterationDepth], [10]),
        new DiagnosticTestArgs('continue (+1);', 'invalid depth (expression group with unary expression)', [ErrorCode.ERR_InvalidIterationDepth], [10]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('goto-statement', function() {
      let tests = [
        new ParserTestArgs('goto label;', 'should parse a goto statement', (statements) => {
          let gotoNode = <GoToSyntaxNode>statements[0];
          assert.equal(gotoNode instanceof GoToSyntaxNode, true, 'GoToSyntaxNode');
        }),
      ];
      Test.assertSyntaxNodes(tests);

      let diagnosticTests = [
        new DiagnosticTestArgs('goto', 'missing label', [ErrorCode.ERR_IdentifierExpected], [4]),
        new DiagnosticTestArgs('goto label', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [10]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('return-statement', function() {
      let tests = [
        new ParserTestArgs('return;', 'should parse a return statement', (statements) => {
          let returnNode = <ReturnSyntaxNode>statements[0];
          assert.equal(returnNode instanceof ReturnSyntaxNode, true, 'ReturnSyntaxNode');
          assert.strictEqual(returnNode.expression, null);
        }),
        new ParserTestArgs('return 1;', 'should parse a return statement with an expression', (statements) => {
          let returnNode = <ReturnSyntaxNode>statements[0];
          assert.equal(returnNode instanceof ReturnSyntaxNode, true, 'ReturnSyntaxNode');
          assert.equal(returnNode.expression instanceof LiteralSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(tests);

      let diagnosticTests = [
        new DiagnosticTestArgs('return', 'missing expression or semicolon', [ErrorCode.ERR_ExpressionOrSemicolonExpected], [6]),
        new DiagnosticTestArgs('return 1', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [8]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('throw-statement', function() {
      let tests = [
        new ParserTestArgs('throw $e;', 'should parse a throw statement', (statements) => {
          let throwNode = <ThrowSyntaxNode>statements[0];
          assert.equal(throwNode instanceof ThrowSyntaxNode, true, 'ThrowSyntaxNode');
          assert.equal(throwNode.expression instanceof LocalVariableSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(tests);

      let diagnosticTests = [
        new DiagnosticTestArgs('throw', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [5]),
        new DiagnosticTestArgs('throw $e', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [8]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

  });

});
