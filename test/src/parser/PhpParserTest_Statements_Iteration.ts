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

import {
  DiagnosticTestArgs,
  ParserTestArgs,
  Test
} from '../Test';

import {
  ArraySyntaxNode,
  DoWhileSyntaxNode,
  ExpressionStatementSyntaxNode,
  ForBlockSyntaxNode,
  ForEachBlockSyntaxNode,
  ForEachSyntaxNode,
  ForSyntaxNode,
  ListDestructureSyntaxNode,
  LocalVariableSyntaxNode,
  WhileBlockSyntaxNode,
  WhileSyntaxNode
} from '../../../src/language/syntax/SyntaxNode.Generated';

import { ErrorCode } from '../../../src/diagnostics/ErrorCode.Generated';
import { ISyntaxNode } from '../../../src/language/syntax/ISyntaxNode';
import { SyntaxList } from '../../../src/language/syntax/SyntaxList';

function assertForEach(statements: ISyntaxNode[], hasKey: boolean, hasAmpersand: boolean): ForEachSyntaxNode {
  let forEachNode = <ForEachSyntaxNode>statements[0];
  assert.equal(forEachNode instanceof ForEachSyntaxNode, true, 'is a ForEachSyntaxNode');
  assert.equal(forEachNode.source instanceof LocalVariableSyntaxNode, true);
  if (hasKey) {
    assert.equal(forEachNode.key instanceof LocalVariableSyntaxNode, true, 'LocalVariableSyntaxNode');
  }
  else {
    assert.strictEqual(forEachNode.key, null);
  }
  if (hasAmpersand) {
    assert.notStrictEqual(forEachNode.ampersand, null);
  }
  else {
    assert.strictEqual(forEachNode.ampersand, null);
  }
  assert.equal(forEachNode.statement instanceof ExpressionStatementSyntaxNode, true);
  return forEachNode;
}

describe('PhpParser', function() {

  describe('iteration-statement', function() {

    describe('while-statement', function() {
      let syntaxTests = [
        new ParserTestArgs('while ($a) 1;', 'should parse a while statement', (statements) => {
          let whileNode = <WhileSyntaxNode>statements[0];
          assert.equal(whileNode instanceof WhileSyntaxNode, true, 'is a WhileSyntaxNode');
          assert.equal(whileNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.equal(whileNode.statement instanceof ExpressionStatementSyntaxNode, true);
        }),
        new ParserTestArgs('while ($a): endwhile;', 'should parse a while statement (alternate syntax)', (statements) => {
          let whileNode = <WhileBlockSyntaxNode>statements[0];
          assert.equal(whileNode instanceof WhileBlockSyntaxNode, true, 'is a WhileBlockSyntaxNode');
          assert.equal(whileNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(whileNode.statements, null);
        }),
        new ParserTestArgs('while ($a): 1; endwhile;', 'should parse a while statement (alternate syntax; with child statement)', (statements) => {
          let whileNode = <WhileBlockSyntaxNode>statements[0];
          assert.equal(whileNode instanceof WhileBlockSyntaxNode, true, 'is a WhileBlockSyntaxNode');
          assert.equal(whileNode.condition instanceof LocalVariableSyntaxNode, true);
          assert.equal(whileNode.statements instanceof SyntaxList, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('while', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [5]),
        new DiagnosticTestArgs('while (', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [7]),
        new DiagnosticTestArgs('while ($a', 'missing close paren', [ErrorCode.ERR_CloseParenExpected], [9]),
        // NOTE: An open brace is NOT required, only an embedded statement.
        new DiagnosticTestArgs('while ($a)', 'missing statement or colon', [ErrorCode.ERR_StatementOrColonExpected], [10]),
        new DiagnosticTestArgs('while ($a):', 'missing statement or endwhile', [ErrorCode.ERR_Syntax], [11]),
        new DiagnosticTestArgs('while ($a): endwhile', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [20]),
        new DiagnosticTestArgs('while ($a);', 'should warn if empty statement', [ErrorCode.WRN_PossibleMistakenEmptyStatement], [10]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('do-while-statement', function() {
      let syntaxTests = [
        new ParserTestArgs('do ; while ($a);', 'should parse a do-while statement', (statements) => {
          let doWhileNode = <DoWhileSyntaxNode>statements[0];
          assert.equal(doWhileNode instanceof DoWhileSyntaxNode, true, 'is a DoWhileSyntaxNode');
          assert.equal(doWhileNode.statement instanceof ExpressionStatementSyntaxNode, true);
          assert.equal(doWhileNode.condition instanceof LocalVariableSyntaxNode, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('do', 'missing statement', [ErrorCode.ERR_StatementExpected], [2]),
        new DiagnosticTestArgs('do {}', 'missing while', [ErrorCode.ERR_Syntax], [5]),
        new DiagnosticTestArgs('do {} while', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [11]),
        new DiagnosticTestArgs('do {} while (', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [13]),
        new DiagnosticTestArgs('do {} while ($a', 'missing close paren', [ErrorCode.ERR_CloseParenExpected], [15]),
        new DiagnosticTestArgs('do {} while ($a)', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [16]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('for-statement', function() {
      let syntaxTests = [
        new ParserTestArgs('for (;;) 1;', 'should parse a for statement', (statements) => {
          let forNode = <ForSyntaxNode>statements[0];
          assert.equal(forNode instanceof ForSyntaxNode, true, 'is a ForSyntaxNode');
          assert.strictEqual(forNode.initializers, null);
          assert.strictEqual(forNode.conditions, null);
          assert.strictEqual(forNode.incrementors, null);
          assert.equal(forNode.statement instanceof ExpressionStatementSyntaxNode, true);
        }),
        new ParserTestArgs('for ($i;;) 1;', 'should parse a for statement with single initializer expression', (statements) => {
          let forNode = <ForSyntaxNode>statements[0];
          assert.equal(forNode instanceof ForSyntaxNode, true, 'is a ForSyntaxNode');
          let initializers = forNode.initializers ? forNode.initializers.childNodes() : [];
          assert.equal(initializers.length, 1);
          assert.equal(initializers[0] instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(forNode.conditions, null);
          assert.strictEqual(forNode.incrementors, null);
          assert.equal(forNode.statement instanceof ExpressionStatementSyntaxNode, true);
        }),
        new ParserTestArgs('for ($i,$j;;) 1;', 'should parse a for statement with multiple initializer expressions', (statements) => {
          let forNode = <ForSyntaxNode>statements[0];
          assert.equal(forNode instanceof ForSyntaxNode, true, 'is a ForSyntaxNode');
          let initializers = forNode.initializers ? forNode.initializers.childNodes() : [];
          assert.equal(initializers.length, 2);
          assert.equal(initializers[0] instanceof LocalVariableSyntaxNode, true);
          assert.equal(initializers[1] instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(forNode.conditions, null);
          assert.strictEqual(forNode.incrementors, null);
          assert.equal(forNode.statement instanceof ExpressionStatementSyntaxNode, true);
        }),
        new ParserTestArgs('for (;$i;) 1;', 'should parse a for statement with single condition expression', (statements) => {
          let forNode = <ForSyntaxNode>statements[0];
          assert.equal(forNode instanceof ForSyntaxNode, true, 'is a ForSyntaxNode');
          assert.strictEqual(forNode.initializers, null);
          let conditions = forNode.conditions ? forNode.conditions.childNodes() : [];
          assert.equal(conditions.length, 1);
          assert.equal(conditions[0] instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(forNode.incrementors, null);
          assert.equal(forNode.statement instanceof ExpressionStatementSyntaxNode, true);
        }),
        new ParserTestArgs('for (;$i,$j;) 1;', 'should parse a for statement with multiple condition expressions', (statements) => {
          let forNode = <ForSyntaxNode>statements[0];
          assert.equal(forNode instanceof ForSyntaxNode, true, 'is a ForSyntaxNode');
          assert.strictEqual(forNode.initializers, null);
          let conditions = forNode.conditions ? forNode.conditions.childNodes() : [];
          assert.equal(conditions.length, 2);
          assert.equal(conditions[0] instanceof LocalVariableSyntaxNode, true);
          assert.equal(conditions[1] instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(forNode.incrementors, null);
          assert.equal(forNode.statement instanceof ExpressionStatementSyntaxNode, true);
        }),
        new ParserTestArgs('for (;;$i) 1;', 'should parse a for statement with single iteration expression', (statements) => {
          let forNode = <ForSyntaxNode>statements[0];
          assert.equal(forNode instanceof ForSyntaxNode, true, 'is a ForSyntaxNode');
          assert.strictEqual(forNode.initializers, null);
          assert.strictEqual(forNode.conditions, null);
          let incrementors = forNode.incrementors ? forNode.incrementors.childNodes() : [];
          assert.equal(incrementors.length, 1);
          assert.equal(incrementors[0] instanceof LocalVariableSyntaxNode, true);
          assert.equal(forNode.statement instanceof ExpressionStatementSyntaxNode, true);
        }),
        new ParserTestArgs('for (;;$i,$j) 1;', 'should parse a for statement with multiple iteration expressions', (statements) => {
          let forNode = <ForSyntaxNode>statements[0];
          assert.equal(forNode instanceof ForSyntaxNode, true, 'is a ForSyntaxNode');
          assert.strictEqual(forNode.initializers, null);
          assert.strictEqual(forNode.conditions, null);
          let incrementors = forNode.incrementors ? forNode.incrementors.childNodes() : [];
          assert.equal(incrementors.length, 2);
          assert.equal(incrementors[0] instanceof LocalVariableSyntaxNode, true);
          assert.equal(incrementors[1] instanceof LocalVariableSyntaxNode, true);
          assert.equal(forNode.statement instanceof ExpressionStatementSyntaxNode, true);
        }),
        new ParserTestArgs('for (;;): endfor;', 'should parse a for statement (alternate syntax)', (statements) => {
          let forNode = <ForBlockSyntaxNode>statements[0];
          assert.equal(forNode instanceof ForBlockSyntaxNode, true, 'is a ForBlockSyntaxNode');
          assert.strictEqual(forNode.initializers, null);
          assert.strictEqual(forNode.conditions, null);
          assert.strictEqual(forNode.incrementors, null);
          assert.strictEqual(forNode.statements, null);
        }),
        new ParserTestArgs('for (;;): ; endfor;', 'should parse a for statement (alternate syntax; with child statement)', (statements) => {
          let forNode = <ForBlockSyntaxNode>statements[0];
          assert.equal(forNode instanceof ForBlockSyntaxNode, true, 'is a ForBlockSyntaxNode');
          assert.strictEqual(forNode.initializers, null);
          assert.strictEqual(forNode.conditions, null);
          assert.strictEqual(forNode.incrementors, null);
          assert.equal(forNode.statements instanceof SyntaxList, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('for', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [3]),
        new DiagnosticTestArgs('for (', 'missing expression or semicolon (initializer)', [ErrorCode.ERR_ExpressionOrSemicolonExpected], [5]),
        new DiagnosticTestArgs('for ($a', 'missing comma or semicolon (initializer)', [ErrorCode.ERR_CommaOrSemicolonExpected], [7]),
        new DiagnosticTestArgs('for (;', 'missing expression or semicolon (condition)', [ErrorCode.ERR_ExpressionOrSemicolonExpected], [6]),
        new DiagnosticTestArgs('for (;$a', 'missing comma or semicolon (condition)', [ErrorCode.ERR_CommaOrSemicolonExpected], [8]),
        new DiagnosticTestArgs('for (;;', 'missing expression or close paren', [ErrorCode.ERR_ExpressionOrCloseParenExpected], [7]),
        new DiagnosticTestArgs('for (;;)', 'missing statement or colon', [ErrorCode.ERR_StatementOrColonExpected], [8]),
        new DiagnosticTestArgs('for (;;):', 'missing statement or endfor', [ErrorCode.ERR_Syntax], [9]),
        new DiagnosticTestArgs('for (;;): endfor', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [16]),
        new DiagnosticTestArgs('for (;;);', 'should warn if empty statement', [ErrorCode.WRN_PossibleMistakenEmptyStatement], [8]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

    describe('foreach-statement', function() {
      let syntaxTests = [
        new ParserTestArgs('foreach ($a as $v) 1;', 'should parse a foreach statement', (statements) => {
          let forEachNode = assertForEach(statements, false, false);
          assert.equal(forEachNode.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('foreach ($a as &$v) 1;', 'should parse a foreach statement with byref value', (statements) => {
          let forEachNode = assertForEach(statements, false, true);
          assert.equal(forEachNode.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('foreach ($a as list($v)) 1;', 'should parse a foreach statement with list value', (statements) => {
          let forEachNode = assertForEach(statements, false, false);
          assert.equal(forEachNode.value instanceof ListDestructureSyntaxNode, true);
        }),
        new ParserTestArgs('foreach ($a as [$v]) 1;', 'should parse a foreach statement with list value (short syntax)', (statements) => {
          let forEachNode = assertForEach(statements, false, false);
          assert.equal(forEachNode.value instanceof ArraySyntaxNode, true);
        }),
        new ParserTestArgs('foreach ($a as $k => $v) 1;', 'should parse a foreach statement with key and value', (statements) => {
          let forEachNode = assertForEach(statements, true, false);
          assert.equal(forEachNode.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('foreach ($a as $k => &$v) 1;', 'should parse a foreach statement with key and byref value', (statements) => {
          let forEachNode = assertForEach(statements, true, true);
          assert.equal(forEachNode.value instanceof LocalVariableSyntaxNode, true);
        }),
        new ParserTestArgs('foreach ($a as $k => list($v)) 1;', 'should parse a foreach statement with key and list value', (statements) => {
          let forEachNode = assertForEach(statements, true, false);
          assert.equal(forEachNode.value instanceof ListDestructureSyntaxNode, true);
        }),
        new ParserTestArgs('foreach ($a as $k => [$v]) 1;', 'should parse a foreach statement with key and list value (short syntax)', (statements) => {
          let forEachNode = assertForEach(statements, true, false);
          assert.equal(forEachNode.value instanceof ArraySyntaxNode, true);
        }),
        new ParserTestArgs('foreach ($a as $v): endforeach;', 'should parse a foreach statement (alternate syntax)', (statements) => {
          let forEachNode = <ForEachBlockSyntaxNode>statements[0];
          assert.equal(forEachNode instanceof ForEachBlockSyntaxNode, true, 'is a ForEachBlockSyntaxNode');
          assert.equal(forEachNode.source instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(forEachNode.key, null);
          assert.strictEqual(forEachNode.ampersand, null);
          assert.equal(forEachNode.value instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(forEachNode.statements, null);
        }),
        new ParserTestArgs('foreach ($a as $v): ; endforeach;', 'should parse a foreach statement (alternate syntax; with child statement)', (statements) => {
          let forEachNode = <ForEachBlockSyntaxNode>statements[0];
          assert.equal(forEachNode instanceof ForEachBlockSyntaxNode, true, 'is a ForEachBlockSyntaxNode');
          assert.equal(forEachNode.source instanceof LocalVariableSyntaxNode, true);
          assert.strictEqual(forEachNode.key, null);
          assert.strictEqual(forEachNode.ampersand, null);
          assert.equal(forEachNode.value instanceof LocalVariableSyntaxNode, true);
          assert.equal(forEachNode.statements instanceof SyntaxList, true);
        }),
      ];
      Test.assertSyntaxNodes(syntaxTests);

      let diagnosticTests = [
        new DiagnosticTestArgs('foreach', 'missing open paren', [ErrorCode.ERR_OpenParenExpected], [7]),
        new DiagnosticTestArgs('foreach (', 'missing expression', [ErrorCode.ERR_ExpressionExpectedEOF], [9]),
        new DiagnosticTestArgs('foreach ($a', 'missing as', [ErrorCode.ERR_Syntax], [11]),
        new DiagnosticTestArgs('foreach ($a as', 'missing key or value expression', [ErrorCode.ERR_ExpressionExpectedEOF], [14]),
        new DiagnosticTestArgs('foreach ($a as $v', 'missing double arrow or close paren', [ErrorCode.ERR_DoubleArrowOrCloseParenExpected], [17]),
        new DiagnosticTestArgs('foreach ($a as $k =>', 'missing value expression', [ErrorCode.ERR_ExpressionExpectedEOF, ErrorCode.ERR_CloseParenExpected], [20, 20]),
        new DiagnosticTestArgs('foreach ($a as $v)', 'missing statement or colon', [ErrorCode.ERR_StatementOrColonExpected], [18]),
        new DiagnosticTestArgs('foreach ($a as $v):', 'missing endforeach', [ErrorCode.ERR_Syntax], [19]),
        new DiagnosticTestArgs('foreach ($a as $v): endforeach', 'missing semicolon', [ErrorCode.ERR_SemicolonExpected], [30]),
        new DiagnosticTestArgs('foreach ($a as 1 => $v) {}', 'should expect explicit key expression', [ErrorCode.ERR_ExpressionNotAddressable], [15]),
        new DiagnosticTestArgs('foreach ($a as $k => 1) {}', 'should expect explicit value expression', [ErrorCode.ERR_ExpressionNotAddressable], [21]),
        new DiagnosticTestArgs('foreach ($a as &$k =>', 'should not parse key-value pair with byref key', [ErrorCode.ERR_CloseParenExpected], [18]),
        new DiagnosticTestArgs('foreach ($a as list($k) =>', 'should not parse key-value pair with list key', [ErrorCode.ERR_CloseParenExpected], [23]),
        new DiagnosticTestArgs('foreach ($a as [$k] =>', 'should not parse key-value pair with list key (short syntax)', [ErrorCode.ERR_CloseParenExpected], [19]),
        new DiagnosticTestArgs('foreach ($a as $v);', 'should warn if empty statement', [ErrorCode.WRN_PossibleMistakenEmptyStatement], [18]),
      ];
      Test.assertDiagnostics(diagnosticTests);
    });

  });

});
