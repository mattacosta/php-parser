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

import { ISourceText, SourceTextBase } from './SourceText';
import { TextSpan } from './TextSpan';

/**
 * A source code container based on a string.
 *
 * @internal
 */
export class StringText extends SourceTextBase {

  /**
   * A string containing the source code.
   */
  protected readonly text: string;

  /**
   * Constructs a `StringText` object.
   *
   * @param {string} text
   *   A string containing the source code.
   */
  constructor(text: string /* , encoding? = 'utf8' */) {
    super();
    this.text = text;
  }

  /**
   * @inheritDoc
   */
  public get length(): number {
    return this.text.length;
  }

  /**
   * @inheritDoc
   */
  public charCodeAt(index: number): number {
    return this.text.charCodeAt(index);
  }

  /**
   * @inheritDoc
   */
  public slice(span: TextSpan): ISourceText
  public slice(position: number): ISourceText
  public slice(spanOrPosition: TextSpan | number): ISourceText {
    if (typeof spanOrPosition === 'number') {
      spanOrPosition = TextSpan.fromBounds(spanOrPosition, this.text.length);
    }
    return new StringText(this.text.substr(spanOrPosition.start, spanOrPosition.length) /* , this.encoding */);
  }

  /**
   * @inheritDoc
   */
  public substring(start: number, length?: number): string {
    return this.text.substr(start, length);
  }

}
