/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const { Gio } = imports.gi;

const ActivateWindowByTitleInterface = `
<node>
  <interface name="de.lucaswerkmeister.ActivateWindowByTitle">
    <method name="activateByTitle">
      <arg name="fullTitle" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
    <method name="activateByPrefix">
      <arg name="prefix" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
    <method name="activateBySuffix">
      <arg name="suffix" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
    <method name="activateBySubstring">
      <arg name="substring" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
  </interface>
</node>
`;

class ActivateWindowByTitle {
    #dbus;

    constructor() {
        this.#dbus = Gio.DBusExportedObject.wrapJSObject(
            ActivateWindowByTitleInterface,
            this,
        );
    }

    enable() {
        this.#dbus.export(
            Gio.DBus.session,
            '/de/lucaswerkmeister/ActivateWindowByTitle',
        );
    }

    disable() {
        this.#dbus.unexport_from_connection(
            Gio.DBus.session,
        );
    }

    #activateByPredicate(predicate) {
        for (const actor of global.get_window_actors()) {
            const window = actor.get_meta_window(),
                title = window.get_title();
            if (predicate(title)) {
                window.activate(global.get_current_time());
                return true;
            }
        }
        return false;
    }

    activateByTitle(fullTitle) {
        return this.#activateByPredicate(
            (title) => title === fullTitle,
        );
    }

    activateByPrefix(prefix) {
        return this.#activateByPredicate(
            (title) => title.startsWith(prefix),
        );
    }

    activateBySuffix(suffix) {
        return this.#activateByPredicate(
            (title) => title.endsWith(suffix),
        );
    }

    activateBySubstring(substring) {
        return this.#activateByPredicate(
            (title) => title.includes(substring),
        );
    }

    // note: we don’t offer activateByRegExp,
    // because that would be vulnerable to ReDoS attacks
}

function init() {
    return new ActivateWindowByTitle();
}
