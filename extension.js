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

import Gio from 'gi://Gio';

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
    <method name="activateByWmClass">
      <arg name="name" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
    <method name="activateByWmClassInstance">
      <arg name="instance" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
    <method name="setSortOrder">
      <arg name="newSortOrder" type="s" direction="in" />
      <arg name="oldSortOrder" type="s" direction="out" />
    </method>
  </interface>
</node>
`;

export default class ActivateWindowByTitle {
    #dbus;
    #sortOrder = 'default';
    static #sortOrders = new Set([
        'default',
        'lowest_user_time',
        'highest_user_time',
        'lowest_window_id',
        'highest_window_id',
    ]);

    enable() {
        this.#dbus = Gio.DBusExportedObject.wrapJSObject(
            ActivateWindowByTitleInterface,
            this,
        );
        this.#dbus.export(
            Gio.DBus.session,
            '/de/lucaswerkmeister/ActivateWindowByTitle',
        );
    }

    disable() {
        this.#dbus.unexport_from_connection(
            Gio.DBus.session,
        );
        this.#dbus = undefined;
    }

    /**
     * @param {MetaWindow} window
     * @see https://gnome.pages.gitlab.gnome.org/mutter/meta/class.Window.html
     */
    #activate(window) {
        const now = global.get_current_time();
        const workspace = window.get_workspace();
        if (workspace) {
            workspace.activate_with_focus(window, now);
        } else {
            window.activate(now);
        }
    }

    *#getWindows() {
        const actors = global.get_window_actors();

        if (this.#sortOrder === 'default') {
            for (const actor of actors) {
                yield actor.get_meta_window();
            }
            return;
        }

        const windows = actors.map(actor => actor.get_meta_window());
        let sorter = null;

        switch (this.#sortOrder) {
            case 'lowest_user_time':
                sorter = (w1, w2) => w1.get_user_time() - w2.get_user_time();
                break;
            case 'highest_user_time':
                sorter = (w1, w2) => w2.get_user_time() - w1.get_user_time();
                break;
            case 'lowest_window_id':
                sorter = (w1, w2) => w1.get_id() - w2.get_id();
                break;
            case 'highest_window_id':
                sorter = (w1, w2) => w2.get_id() - w1.get_id();
                break;
            default:
                throw new Error(
                    `Unknown sort order ${this.#sortOrder}, ` +
                    `expected one of ${[...ActivateWindowByTitle.#sortOrders].join(', ')}`
                );
        }

        windows.sort(sorter);

        yield* windows;
    }

    #activateByPredicate(predicate) {
        for (const window of this.#getWindows()) {
            if (predicate(window)) {
                this.#activate(window);
                return true;
            }
        }
        return false;
    }

    #activateByTitlePredicate(predicate) {
        return this.#activateByPredicate((window) => {
            const title = window.get_title();
            if (title === null) {
                return false;
            }
            return predicate(title);
        });
    }

    activateByTitle(fullTitle) {
        return this.#activateByTitlePredicate(
            (title) => title === fullTitle,
        );
    }

    activateByPrefix(prefix) {
        return this.#activateByTitlePredicate(
            (title) => title.startsWith(prefix),
        );
    }

    activateBySuffix(suffix) {
        return this.#activateByTitlePredicate(
            (title) => title.endsWith(suffix),
        );
    }

    activateBySubstring(substring) {
        return this.#activateByTitlePredicate(
            (title) => title.includes(substring),
        );
    }

    // note: we don’t offer activateByRegExp,
    // because that would be vulnerable to ReDoS attacks

    activateByWmClass(name) {
        return this.#activateByPredicate(
            (window) => window.get_wm_class() === name,
        );
    }

    activateByWmClassInstance(instance) {
        return this.#activateByPredicate(
            (window) => window.get_wm_class_instance() === instance,
        );
    }

    setSortOrder(newSortOrder) {
        if (!ActivateWindowByTitle.#sortOrders.has(newSortOrder)) {
            throw new Error(
                `Unknown sort order ${newSortOrder}, ` +
                `expected one of ${[...ActivateWindowByTitle.#sortOrders].join(', ')}`
            );
        }
        const oldSortOrder = this.#sortOrder;
        this.#sortOrder = newSortOrder;
        return oldSortOrder;
    }
}
