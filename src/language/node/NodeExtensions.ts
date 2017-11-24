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

import { INode } from './INode';

/**
 * Provides helper methods for working with `INode` objects.
 */
export class NodeExtensions {

  /**
   * Determines the number of children contained in a parent node after
   * including the length of child lists.
   *
   * @param {INode} node
   *   The parent node.
   */
  public static childCount(node: INode): number {
    let n = 0, count = node.count;
    for (let i = 0; i < count; i++) {
      let child = node.childAt(i);
      if (child) {
        n += child.isList ? child.count : 1;
      }
    }
    return n;
  }

  /**
   * Determines if two nodes are equal.
   */
  public static equals(a: INode | null, b: INode | null): boolean {
    // Reference equality.
    if (a === b) {
      return true;
    }
    // One has a node, but the other does not.
    if ((a != null) != (b != null)) {
      return false;
    }
    // Both have nodes, but they are not equal.
    if (a && b && !a.equals(b)) {
      return false;
    }
    // Neither have nodes, or both have nodes and they are equal.
    return true;
  }

}
