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

import { CompositeText } from './CompositeText';
import { ISourceText } from './SourceText';
import { StringText } from './StringText';

/**
 * @todo Document SourceTextFactory.
 */
export class SourceTextFactory {

  /**
   * The maximum length of a string before a more efficient source text
   * container is created.
   *
   * @todo Experimental.
   * @todo Unused.
   */
  protected static readonly LargeTextLimit: number = 4 * 1024;  // 4KB

  /**
   * An empty source text container.
   */
  public static readonly EmptyText: ISourceText = new StringText('');

  /**
   * Creates a source text object from a string.
   *
   * @param {string} text
   *   A string containing source code.
   */
  public static from(text: string /* , encoding: any */): ISourceText {
    // if (text.length > SourceText.LargeTextLimit) {
    //   return LargeText.decode(text, encoding);
    // }
    return new StringText(text);
  }

  /**
   * Creates a source text container from other source texts.
   *
   * @param {ReadonlyArray<ISourceText>} sources
   *   A list of text segments.
   * @param {number} sourceLength
   *   The total length of the stored text. This may be greater than the length
   *   of the text.
   *
   * @internal
   */
  public static createContainer(sources: ReadonlyArray<ISourceText>, sourceLength: number): ISourceText {
    return CompositeText.from(sources, sourceLength);
  }

}
