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

import { ParseContext } from './ParseContext';

export class ResetPoint<T> {

  public readonly context: ParseContext;

  public readonly lexerState: T;

  public readonly offset: number;

  constructor(context: ParseContext, lexerState: T, offset: number) {
    this.context = context;
    this.lexerState = lexerState;
    this.offset = offset;
  }

}
