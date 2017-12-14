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

import { IEquatable } from '@mattacosta/php-common';

import { ISyntaxNodeQueryable } from './ISyntaxNodeQueryable';
import { ISyntaxToken } from './ISyntaxToken';
import { ISyntaxVisitorAccess } from './ISyntaxVisitorAccess';
import { SyntaxDiagnostic } from '../../diagnostics/SyntaxDiagnostic';
import { TextSpan } from '../../text/TextSpan';

/**
 * Defines an interface for the non-terminal nodes of a syntax tree.
 */
export interface ISyntaxNodeOrList extends IEquatable<ISyntaxNodeOrList>, ISyntaxNodeQueryable<ISyntaxNodeOrList> {

  /**
   * Determines if a diagnostic was generated for this node, its descendant
   * nodes, or any tokens/trivia within one of those nodes.
   */
  readonly containsDiagnostics: boolean;

  /**
   * Determines if the text represented by this node, or any of its descendants,
   * was skipped in order to successfully parse the source code.
   */
  readonly containsSkippedText: boolean;

  /**
   * The location and width of the node, including trivia.
   */
  readonly fullSpan: TextSpan;

  /**
   * The syntax node containing this node, if any.
   */
  readonly parent: ISyntaxNode | null;

  /**
   * The location and width of the node, without trivia.
   */
  readonly span: TextSpan;

  /**
   * Gets all child nodes and tokens belonging to the current node.
   */
  allChildren(): Array<ISyntaxNode | ISyntaxToken>;

  /**
   * Gets all ancestors of the current node.
   *
   * @deprecated
   */
  ancestors(): ISyntaxNodeOrList[];

  /**
   * Gets the current node and all of its ancestors.
   *
   * @deprecated
   */
  ancestorsAndSelf(): ISyntaxNodeOrList[];

  /**
   * Gets all descendants of the current node.
   *
   * @deprecated
   */
  descendants(): ISyntaxNodeOrList[];

  /**
   * Gets the current node and all of its descendants.
   *
   * @deprecated
   */
  descendantsAndSelf(): ISyntaxNodeOrList[];

  /**
   * Gets all child nodes belonging to the current node.
   */
  childNodes(): ISyntaxNode[];

  /**
   * Gets all child tokens belonging to the current node.
   */
  childTokens(): ISyntaxToken[];

  /**
   * Determines if this node is a parent of the given node.
   */
  contains(node: ISyntaxNode | null): boolean;

  /**
   * Gets an iterator that lists all child nodes and tokens of the current node.
   */
  getAllChildren(): IterableIterator<ISyntaxNode | ISyntaxToken>;

  /**
   * Gets an iterator that lists all child nodes and tokens of the current node
   * in reversed order.
   */
  getAllChildrenReversed(): IterableIterator<ISyntaxNode | ISyntaxToken>;

  /**
   * Gets an iterator that lists all child nodes belonging to the current node.
   */
  getChildNodes(): IterableIterator<ISyntaxNode>;

  /**
   * Gets an iterator that lists all child tokens belonging to the current node.
   */
  getChildTokens(): IterableIterator<ISyntaxToken>;

  /**
   * Gets all diagnostics found in any child node or token.
   */
  getDiagnostics(): IterableIterator<SyntaxDiagnostic>;

  /**
   * Finds the child node that contains the given span.
   *
   * @param {TextSpan} span
   *   A span within a child node.
   * @param {boolean=} innermostNode
   *   If `true` and a parent has the same span as a child, the first child
   *   node is returned. Defaults to `false`.
   */
  findChildNodeAt(span: TextSpan, innermostNode?: boolean): ISyntaxNodeOrList;

  /**
   * Finds the first token within the node.
   *
   * @param {boolean=} includeZeroWidth
   *   If `true` zero-width tokens may be returned. Defaults to `false`.
   */
  firstToken(includeZeroWidth?: boolean): ISyntaxToken | null;

  /**
   * Finds the last token within the node.
   *
   * @param {boolean=} includeZeroWidth
   *   If `true` zero-width tokens may be returned. Defaults to `false`.
   */
  lastToken(includeZeroWidth?: boolean): ISyntaxToken | null;

}

/**
 * Defines an interface for the non-terminal nodes of a syntax tree that can be
 * accessed by visitors.
 */
export interface ISyntaxNode extends ISyntaxNodeOrList, ISyntaxVisitorAccess {}
