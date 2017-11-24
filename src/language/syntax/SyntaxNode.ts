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

import { ISyntaxVisitorAccess } from './ISyntaxVisitorAccess';
import { SyntaxNodeBase } from './SyntaxNodeBase';
import { SyntaxTransform } from './SyntaxTransform.Generated';
import { SyntaxVisitor } from './SyntaxVisitor.Generated';

/**
 * A non-terminal node in a syntax tree.
 */
export abstract class SyntaxNode extends SyntaxNodeBase implements ISyntaxVisitorAccess {

  /**
   * @inheritDoc
   */
  public abstract accept(visitor: SyntaxVisitor): void;

  /**
   * @inheritDoc
   */
  public abstract acceptResult<T>(visitor: SyntaxTransform<T>): T;

}
