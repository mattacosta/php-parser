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

import { DocumentationMode } from './DocumentationMode';
import { PhpVersion } from './PhpVersion';

/**
 * A set of options for parsing PHP source code.
 */
export class PhpParserOptions /*implements IEquatable<PhpParserOptions>*/ {

  /**
   * A default set of parsing options.
   */
  public static readonly Default = new PhpParserOptions();

  /**
   * Determines how the parser should handle documentation comments.
   */
  public readonly documentationMode: DocumentationMode;

  /**
   * Determines if the parser should scan the text in 64-bit mode.
   */
  public readonly is64Bit: boolean;

  /**
   * The version of PHP containing the desired parsing rules.
   */
  public readonly version: PhpVersion;

  /**
   * A map of enabled parser features.
   */
  public readonly features: ReadonlyMap<string, string>;

  /**
   * Constructs a `PhpParserOptions` object.
   *
   * @param {PhpVersion=} version
   *   The version of PHP containing the desired parsing rules. Defaults to
   *   `PhpVersion.Latest`.
   * @param {boolean=} is64Bit
   *   Determines if the parser should scan the text in 64-bit mode. Defaults
   *   to `true`.
   * @param {DocumentationMode=} documentationMode
   *   Determines how the parser should handle documentation comments. Defaults
   *   to `DocumentationMode.None`.
   * @param {ReadonlyMap<string, string>} features
   *   A map of enabled parser features.
   */
  constructor(version = PhpVersion.Latest, is64Bit = true, documentationMode = DocumentationMode.None, features?: ReadonlyMap<string, string>) {
    this.version = version;
    this.is64Bit = is64Bit;
    this.documentationMode = documentationMode;
    this.features = features ? features : new Map<string, string>();
  }

}
