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

import { ISourceTextSyntaxNode } from './SourceTextSyntaxNode';

/**
 * Provides helper methods for working with `ISyntaxNode` objects.
 */
export class SyntaxNodeExtensions {

  /**
   * Determines if the given object is shaped like `ISourceTextSyntaxNode`.
   */
  public static isSourceTextSyntaxNode(node: object): node is ISourceTextSyntaxNode {
    return (<ISourceTextSyntaxNode>node).eof !== void 0;
  }

}
