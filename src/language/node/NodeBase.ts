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

import {
  ArgumentOutOfRangeException,
  Debug,
  Exception
} from '@mattacosta/php-common';

import { INode } from './INode';
import { ISyntaxNode } from '../syntax/ISyntaxNode';
import { NodeFlags } from './NodeFlags';
import { SyntaxDiagnostic } from '../../diagnostics/SyntaxDiagnostic';
import { SyntaxNodeBase } from '../syntax/SyntaxNodeBase';

/**
 * Provides a base class for all nodes in a tree (both terminal and non-terminal).
 */
export abstract class NodeBase implements INode {

  /**
   * A bit field storing information about this node.
   *
   * IMPORTANT: Do not initialize this property! See constructor.
   */
  protected _flags: NodeFlags;

  /**
   * The width of the token or token collection, with trivia.
   *
   * IMPORTANT: Do not initialize this property! See constructor.
   */
  protected _fullWidth: number;

  /**
   * Stores the hash code of the node.
   *
   * This prevents recalculating the hash code of every child on every lookup.
   *
   * Fun fact: The .NET CLR saves space by storing an object's hash code in
   * what is usually an unused chunk of memory that was already allocated as
   * part of the object's overhead.
   *
   * IMPORTANT: Do not initialize this property! See constructor.
   */
  protected hash: number;

  /**
   * A map of all diagnostics attached to nodes.
   *
   * Since nodes are more likely to not contain any diagnostics, this saves
   * memory by not adding a diagnostic field to every node. Diagnostics are
   * instead maintained using a weak reference to the associated node, so that
   * they can still be reclaimed automatically when the node is no longer
   * referenced.
   */
  protected static readonly DiagnosticWeakMap = new WeakMap<NodeBase, ReadonlyArray<SyntaxDiagnostic>>();

  /**
   * An empty diagnostic array.
   */
  protected static readonly EmptyDiagnosticList: ReadonlyArray<SyntaxDiagnostic> = [];

  /**
   * Constructs a `NodeBase` object.
   *
   * @param {SyntaxDiagnostic[]=} diagnostics
   *   A list of diagnostics associated with the token or token collection.
   */
  constructor(diagnostics?: ReadonlyArray<SyntaxDiagnostic>) {
    // IMPORTANT: This is a performance critical method.

    // Ideally, setting the width and flags would be performed here, but
    // everything inherits this class, so any operation that would cause
    // `this` to be dereferenced would also cause V8 to perform a map check,
    // which would fail. In terms of parse time, this is apparently the
    // second largest loss caused by the JS engine.

    if (diagnostics && diagnostics.length > 0) {
      NodeBase.DiagnosticWeakMap.set(this, diagnostics);
    }
  }

  /**
   * @inheritDoc
   */
  public get containsDiagnostics(): boolean {
    return (this._flags & NodeFlags.ContainsDiagnostics) != 0;
  }

  /**
   * @inheritDoc
   */
  public get containsSkippedText(): boolean {
    return (this._flags & NodeFlags.ContainsSkippedText) != 0;
  }

  /**
   * @inheritDoc
   */
  public get count(): number {
    return 0;
  }

  /**
   * @inheritDoc
   */
  public get diagnostics(): ReadonlyArray<SyntaxDiagnostic> {
    if (NodeBase.DiagnosticWeakMap.has(this)) {
      // Suppress TS2322: Result cannot be undefined due to if-condition.
      return <SyntaxDiagnostic[]>NodeBase.DiagnosticWeakMap.get(this);
    }
    // Do not create a new array on every call.
    return NodeBase.EmptyDiagnosticList;
  }

  /**
   * Gets the flags used to store metadata about this node and its children.
   */
  public abstract get flags(): NodeFlags;

  /**
   * @inheritDoc
   */
  public abstract get fullWidth(): number;

  /**
   * @inheritDoc
   */
  public get isMissing(): boolean {
    return (this._flags & NodeFlags.IsMissing) != 0;
  }

  /**
   * @inheritDoc
   */
  public get isList(): boolean {
    return false;
  }

  /**
   * @inheritDoc
   */
  public get isToken(): boolean {
    return false;
  }

  /**
   * @inheritDoc
   */
  public get isTrivia(): boolean {
    return false;
  }

  /**
   * @inheritDoc
   */
  public get leadingTrivia(): INode | null {
    return null;
  }

  /**
   * @inheritDoc
   */
  public get leadingTriviaWidth(): number {
    return this._fullWidth != 0 ? this.getFirstToken().leadingTriviaWidth : 0;
  }

  /**
   * @inheritDoc
   */
  public get width(): number {
    return this._fullWidth - this.leadingTriviaWidth;
  }

  /**
   * Gets the first node that does not have any children.
   */
  private getFirstToken(): INode {
    let length = this.count;
    let node: INode | null = this;

    // Terminal nodes (tokens and trivia) should not indirectly call this
    // method, as that indicates a missing override.
    Debug.assert(length != 0);

    do {
      let firstChild: INode | null = null;
      for (let i = 0; i < length; i++) {
        const child: INode | null = node.childAt(i);
        if (child) {
          firstChild = child;
          length = child.count;
          break;
        }
      }
      node = firstChild;
    } while (node && length > 0);

    if (!node) {
      // The parser should not have created this node.
      throw new Exception('Child node expected');
    }

    return node;
  }

  /**
   * Gets the last node that does not have any children.
   */
  private getLastToken(): INode {
    let length = this.count;
    let node: INode | null = this;

    // Terminal nodes (tokens and trivia) should not indirectly call this
    // method, as that indicates a missing override.
    Debug.assert(length != 0);

    do {
      let lastChild: INode | null = null;
      for (let i = length - 1; i >= 0; i--) {
        const child: INode | null = node.childAt(i);
        if (child) {
          lastChild = child;
          length = child.count;
          break;
        }
      }
      node = lastChild;
    } while (node && length > 0);

    if (!node) {
      // The parser should not have created this node.
      throw new Exception('Child node expected');
    }

    return node;
  }

  // Normally these 'updateFrom' methods would be a single method, but
  // performance is critical and V8 can better optimize each method if only
  // a subset of each type is given.

  // @todo Determine if this is still necessary once Crankshaft is replaced by TurboFan.

  /**
   * Updates the flags and width of a parent node from a child node.
   */
  protected abstract updateFromNode(child: NodeBase): void;

  /**
   * Updates the flags and width of a parent node from a list of children.
   */
  protected abstract updateFromNodeList(child: NodeBase): void;

  /**
   * Updates the flags and width of a parent node from a child token.
   */
  protected abstract updateFromToken(child: NodeBase): void;

  /**
   * Updates the flags and width of a parent node from its leading trivia.
   */
  protected abstract updateFromTrivia(child: NodeBase): void;

  /**
   * @inheritDoc
   */
  public abstract childAt(index: number): INode | null;

  /**
   * @inheritDoc
   */
  public abstract createSyntaxNode(parent: ISyntaxNode, offset: number): SyntaxNodeBase;

  /**
   * Determines if the current node is equal to a given node.
   */
  public abstract equals(value: NodeBase): boolean;

  /**
   * @inheritDoc
   */
  public abstract hashCode(): number;

  /**
   * @inheritDoc
   */
  public indexAtOffset(relativeOffset: number): number {
    if (relativeOffset < 0 || relativeOffset >= this.fullWidth) {
      throw new ArgumentOutOfRangeException();
    }

    let width = 0;
    const length = this.count;

    for (let i = 0; i < length; i++) {
      const child = this.childAt(i);
      if (child) {
        width += child.fullWidth;
        if (relativeOffset < width) {
          return i;
        }
      }
    }

    // Offset was not within parent node.
    throw new Exception('Child node expected');
  }

  /**
   * @inheritDoc
   */
  public offsetAt(index: number): number {
    if (index < 0 || index >= this.count) {
      throw new ArgumentOutOfRangeException();
    }

    let offset = 0;
    for (let i = 0; i < index; i++) {
      const child = this.childAt(i);
      if (child) {
        offset += child.fullWidth;
      }
    }

    return offset;
  }

  /**
   * @inheritDoc
   */
  public abstract withDiagnostics(diagnostics: SyntaxDiagnostic[]): INode;

}
