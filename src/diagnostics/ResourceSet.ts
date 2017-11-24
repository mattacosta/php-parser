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

declare function require(path: string): any;

/**
 * Provides access to a lazily loaded external resource.
 *
 * @template T
 */
export class ResourceSet<T> {

  /**
   * The location of the resource.
   */
  protected resourcePath: string;

  /**
   * A key-value store for the resource data.
   */
  protected resources: { [key: string]: T };

  /**
   * Constructs a `ResourceSet` object.
   *
   * @param {string} resourcePath
   *   The location of the resource.
   */
  constructor(resourcePath: string) {
    this.resourcePath = resourcePath;
  }

  /**
   * Retrieves data from the external resource.
   *
   * @param {string} key
   *   The identifier of the object in the resource set.
   */
  public get(key: string): T {
    if (!this.resources) {
      // NOTE: The type used here is a pretty big assumption...
      this.resources = require(this.resourcePath);
    }
    return this.resources[key];
  }

}
