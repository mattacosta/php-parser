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
  Hash,
  InvalidOperationException
} from '@mattacosta/php-common';

import { ISyntaxNode } from '../syntax/ISyntaxNode';
import {
  ManyChildSyntaxList,
  SingleChildSyntaxList,
  TwoChildSyntaxList
} from '../syntax/SyntaxList';
import { Node } from './Node';
import { NodeBase } from './NodeBase';
import { NodeFlags } from './NodeFlags';
import { SyntaxDiagnostic } from '../../diagnostics/SyntaxDiagnostic';

/**
 * Provides a base class for nodes that contain a list of child nodes.
 */
export abstract class NodeList extends NodeBase {

  /**
   * Constructs a `NodeList` object.
   *
   * NOTE: This constructor prevents TypeScript from emitting one with an
   *   unnecessary (and slow) rest parameter.
   */
  constructor(diagnostics?: ReadonlyArray<SyntaxDiagnostic>) {
    super(diagnostics);
  }

  /**
   * @inheritDoc
   */
  public get isList(): boolean {
    return true;
  }

  /**
   * @inheritDoc
   */
  public equals(value: NodeList): boolean {
    if (this == value) {
      return true;
    }

    const count = this.count;
    if (this._flags == value.flags && this._fullWidth == value.fullWidth && count == value.count) {
      for (let i = 0; i < count; i++) {
        const child1 = this.childAt(i);
        const child2 = value.childAt(i);
        if ((child1 !== null) != (child2 !== null)) {
          return false;
        }
        if (child1 && child2 && !child1.equals(child2)) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

}

/**
 * A node that only contains a single child.
 *
 * @internal
 */
export class SingleChildListNode extends NodeList {

  /**
   * The only child.
   */
  protected child: Node;

  /**
   * Constructs a `SingleChildListNode` object.
   */
  constructor(child: Node, diagnostics?: SyntaxDiagnostic[]) {
    super(diagnostics);
    this._flags = NodeFlags.None;
    this._fullWidth = 0;
    this.hash = 0;

    this.child = child;
    if (child.isToken) {
      this.updateFromToken(child);
    }
    else if (child.isTrivia) {
      this.updateFromTrivia(child);
    }
    else {
      this.updateFromNode(child);
    }

    if (diagnostics !== void 0 && diagnostics.length > 0) {
      this._flags = this._flags | NodeFlags.ContainsDiagnostics;
    }
  }

  /**
   * @inheritDoc
   */
  public get count(): number {
    return 1;
  }

  /**
   * @inheritDoc
   */
  public get flags(): NodeFlags {
    return this._flags;
  }

  /**
   * @inheritDoc
   */
  public get fullWidth(): number {
    return this._fullWidth;
  }

  /**
   * @inheritDoc
   */
  public createSyntaxNode(parent: ISyntaxNode, offset: number): SingleChildSyntaxList {
    return new SingleChildSyntaxList(this, parent, offset);
  }

  /**
   * @inheritDoc
   */
  public childAt(index: number): Node | null {
    return index == 0 ? this.child : null;
  }

  /**
   * @inheritDoc
   */
  public hashCode(): number {
    if (this.hash === 0) {
      let hash = Hash.combine(this._flags, this._fullWidth);
      this.hash = Hash.combine(this.getChildHashCode(), hash);
    }
    return this.hash;
  }

  /**
   * @inheritDoc
   */
  public withDiagnostics(diagnostics: SyntaxDiagnostic[]): SingleChildListNode {
    return new SingleChildListNode(this.child, diagnostics);
  }

  /**
   * Isolates the `hashCode()` call of a child for V8 optimization.
   */
  protected getChildHashCode(): number {
    return this.child.hashCode();
  }

  /**
   * @inheritDoc
   */
  protected updateFromNode(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

  /**
   * @inheritDoc
   */
  protected updateFromNodeList(child: NodeBase) {
    throw new InvalidOperationException('Unreachable');
  }

  /**
   * @inheritDoc
   */
  protected updateFromToken(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

  /**
   * @inheritDoc
   */
  protected updateFromTrivia(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

}

/**
 * A node that contains two children.
 *
 * @internal
 */
export class TwoChildListNode extends NodeList {

  /**
   * The first child node.
   */
  protected firstChild: Node;

  /**
   * The second child node.
   */
  protected secondChild: Node | null;

  /**
   * Constructs a `TwoChildListNode` object.
   */
  constructor(firstChild: Node, secondChild: Node | null, diagnostics?: SyntaxDiagnostic[]) {
    super(diagnostics);
    this._flags = NodeFlags.None;
    this._fullWidth = 0;
    this.hash = 0;

    this.firstChild = firstChild;
    if (firstChild.isToken) {
      this.updateFromToken(firstChild);
    }
    else if (firstChild.isTrivia) {
      this.updateFromTrivia(firstChild);
    }
    else {
      this.updateFromNode(firstChild);
    }
    this.secondChild = secondChild;
    if (secondChild) {
      if (secondChild.isToken) {
        this.updateFromToken(secondChild);
      }
      else if (secondChild.isTrivia) {
        this.updateFromTrivia(secondChild);
      }
      else {
        this.updateFromNode(secondChild);
      }
    }

    if (diagnostics !== void 0 && diagnostics.length > 0) {
      this._flags = this._flags | NodeFlags.ContainsDiagnostics;
    }
  }

  /**
   * @inheritDoc
   */
  public get count(): number {
    return 2;
  }

  /**
   * @inheritDoc
   */
  public get flags(): NodeFlags {
    return this._flags;
  }

  /**
   * @inheritDoc
   */
  public get fullWidth(): number {
    return this._fullWidth;
  }

  /**
   * @inheritDoc
   */
  public createSyntaxNode(parent: ISyntaxNode, offset: number): TwoChildSyntaxList {
    return new TwoChildSyntaxList(this, parent, offset);
  }

  /**
   * @inheritDoc
   */
  public childAt(index: number): Node | null {
    switch (index) {
      case 0:
        return this.firstChild;
      case 1:
        return this.secondChild;
      default:
        return null;
    }
  }

  /**
   * @inheritDoc
   */
  public hashCode(): number {
    if (this.hash === 0) {
      let hash = Hash.combine(this._flags, this._fullWidth);
      hash = Hash.combine(this.getFirstChildHashCode(), hash);
      hash = Hash.combine(this.getSecondChildHashCode(), hash);
      this.hash = hash;
    }
    return this.hash;
  }

  /**
   * @inheritDoc
   */
  public withDiagnostics(diagnostics: SyntaxDiagnostic[]): TwoChildListNode {
    return new TwoChildListNode(this.firstChild, this.secondChild, diagnostics);
  }

  /**
   * Isolates the `hashCode()` call of the first child for V8 optimization.
   */
  protected getFirstChildHashCode(): number {
    return this.firstChild.hashCode();
  }

  /**
   * Isolates the `hashCode()` call of the second child for V8 optimization.
   */
  protected getSecondChildHashCode(): number {
    return this.secondChild !== null ? this.secondChild.hashCode() : 0;
  }

  /**
   * @inheritDoc
   */
  protected updateFromNode(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

  /**
   * @inheritDoc
   */
  protected updateFromNodeList(child: NodeBase) {
    throw new InvalidOperationException('Unreachable');
  }

  /**
   * @inheritDoc
   */
  protected updateFromToken(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

  /**
   * @inheritDoc
   */
  protected updateFromTrivia(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

}

/**
 * Provides a base class for nodes that contains an arbitrary number of
 * children.
 *
 * @internal
 */
abstract class ManyChildListNode extends NodeList {

  /**
   * A list of child nodes.
   */
  protected children: Node[];

  /**
   * Constructs a `ManyChildListNode` object.
   */
  constructor(children: Node[], diagnostics?: SyntaxDiagnostic[]) {
    super(diagnostics);
    this._flags = NodeFlags.None;
    this._fullWidth = 0;
    this.hash = 0;

    this.children = children;
    this.updateFromChildren(children);

    if (diagnostics !== void 0 && diagnostics.length > 0) {
      this._flags = this._flags | NodeFlags.ContainsDiagnostics;
    }
  }

  /**
   * @inheritDoc
   */
  public get count(): number {
    return this.children.length;
  }

  /**
   * @inheritDoc
   */
  public createSyntaxNode(parent: ISyntaxNode, offset: number): ManyChildSyntaxList {
    return new ManyChildSyntaxList(this, parent, offset);
  }

  /**
   * @inheritDoc
   */
  public childAt(index: number): Node | null {
    if (index >= 0 && index < this.children.length) {
      const child = this.children[index];
      return this.children[index];
    }
    return null;
  }

  /**
   * @inheritDoc
   */
  public equals(value: ManyChildListNode): boolean {
    if (this == value) {
      return true;
    }

    const count = this.children.length;
    if (this._flags == value.flags && this._fullWidth == value.fullWidth && count == value.count) {
      for (let i = 0; i < count; i++) {
        if (!this.equalsChildInList(value, i)) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  public hashCode(): number {
    // IMPORTANT: This is a performance critical method.
    if (this.hash === 0) {
      let hash = Hash.combine(this._fullWidth, this._flags);
      const length = this.count;
      for (let i = 0; i < length; i++) {
        const child = this.childAt(i);
        if (child !== null) {
          hash = Hash.combine(this.getChildHashCode(child), hash);
        }
      }
      this.hash = hash;
    }
    return this.hash;
  }

  /**
   * Compares the children of two lists at a given index.
   *
   * @todo Determine V8 optimization and possibly merge back into `equals()`.
   */
  protected equalsChildInList(list: ManyChildListNode, index: number): boolean {
    const firstChild = this.childAt(index);
    const secondChild = list.childAt(index);
    if ((firstChild !== null) !== (secondChild !== null)) {
      return false;
    }
    if (firstChild && secondChild && !firstChild.equals(secondChild)) {
      return false;
    }
    return true;
  }

  /**
   * Isolates the `hashCode()` call of a child for V8 optimization.
   */
  protected getChildHashCode(child: Node): number {
    return child.hashCode();
  }

  /**
   * Updates the flags and width of the node list.
   *
   * @param {Node[]} children
   *   A list of child nodes.
   */
  protected abstract updateFromChildren(children: Node[]): void;

}

/**
 * A node with an arbitrarily long list of children.
 *
 * If this list is very long, use `LongChildListNode` instead to increase
 * performance of node lookups.
 *
 * @internal
 */
export class ShortChildListNode extends ManyChildListNode {

  /**
   * Constructs a `ShortChildListNode` object.
   */
  constructor(children: Node[], diagnostics?: SyntaxDiagnostic[]) {
    super(children, diagnostics);
  }

  /**
   * @inheritDoc
   */
  public get flags(): NodeFlags {
    return this._flags;
  }

  /**
   * @inheritDoc
   */
  public get fullWidth(): number {
    return this._fullWidth;
  }

  /**
   * @inheritDoc
   */
  protected updateFromChildren(children: Node[]) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child !== null) {
        if (child.isToken) {
          this.updateFromToken(child);
        }
        else if (child.isTrivia) {
          this.updateFromTrivia(child);
        }
        else {
          this.updateFromNode(child);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  protected updateFromNode(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

  /**
   * @inheritDoc
   */
  protected updateFromNodeList(child: NodeBase) {
    throw new InvalidOperationException('Unreachable');
  }

  /**
   * @inheritDoc
   */
  protected updateFromToken(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

  /**
   * @inheritDoc
   */
  protected updateFromTrivia(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

  /**
   * @inheritDoc
   */
  public withDiagnostics(diagnostics: SyntaxDiagnostic[]): ShortChildListNode {
    return new ShortChildListNode(this.children, diagnostics);
  }

}

/**
 * A node that contains an arbitrary number of children and stores pre-computed
 * offsets for each child.
 *
 * NOTE: Long lists are never cached, so for the time being, `IHashable<T>`
 * methods may remain on the parent class.
 *
 * @internal
 */
export class LongChildListNode extends ManyChildListNode {

  /**
   * A list of pre-computed child offsets.
   */
  protected offsets!: number[];

  /**
   * Constructs a `LongChildListNode` object.
   */
  constructor(children: Node[], diagnostics?: SyntaxDiagnostic[]) {
    super(children, diagnostics);
  }

  /**
   * @inheritDoc
   */
  public get flags(): NodeFlags {
    return this._flags;
  }

  /**
   * @inheritDoc
   */
  public get fullWidth(): number {
    return this._fullWidth;
  }

  /**
   * @inheritDoc
   */
  public indexAtOffset(relativeOffset: number): number {
    if (relativeOffset < 0 || relativeOffset >= this._fullWidth) {
      throw new ArgumentOutOfRangeException();
    }

    let low = 0;
    let high = this.offsets.length;
    while (low <= high) {
      let middle = low + ((high - low) >> 1);
      if (this.offsets[middle] > relativeOffset) {
        high = middle - 1;
      }
      else {
        low = middle + 1;
      }
    }

    return low - 1;
  }

  /**
   * @inheritDoc
   */
  public offsetAt(index: number): number {
    if (index < 0 || index >= this.children.length) {
      throw new ArgumentOutOfRangeException();
    }
    return this.offsets[index];
  }

  /**
   * @inheritDoc
   */
  public withDiagnostics(diagnostics: SyntaxDiagnostic[]): LongChildListNode {
    return new LongChildListNode(this.children, diagnostics);
  }

  /**
   * @inheritDoc
   */
  protected updateFromChildren(children: Node[]) {
    this.offsets = new Array(children.length);

    let offset = 0;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child !== null) {
        if (child.isToken) {
          this.updateFromToken(child);
        }
        else if (child.isTrivia) {
          this.updateFromTrivia(child);
        }
        else {
          this.updateFromNode(child);
        }
      }
      this.offsets[i] = offset;
      offset += child ? child.fullWidth : 0;
    }
  }

  /**
   * @inheritDoc
   */
  protected updateFromNode(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

  /**
   * @inheritDoc
   */
  protected updateFromNodeList(child: NodeBase) {
    throw new InvalidOperationException('Unreachable');
  }

  /**
   * @inheritDoc
   */
  protected updateFromToken(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

  /**
   * @inheritDoc
   */
  protected updateFromTrivia(child: Node) {
    this._flags = this._flags | (child.flags & NodeFlags.InheritMask);
    this._fullWidth = this._fullWidth + child.fullWidth;
  }

}
