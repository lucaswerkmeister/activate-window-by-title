# Activate Window By Title

This is a GNOME Shell extension to activate (focus, bring to the foreground) a window
based on its title (or `WM_CLASS`/`ID`, see below).
It exposes a D-Bus interface with methods for this purpose;
it has no user interface of its own,
but can be called from the command line or other programs.

## D-Bus usage

The extension, when activated, extends the `org.gnome.Shell` service on the session bus
with a `/de/lucaswerkmeister/ActivateWindowByTitle` object,
which implements the `de.lucaswerkmeister.ActivateWindowByTitle` interface containing the following methods:

- **activateByTitle**, to activate the window with the given full, exact title
- **activateByPrefix**, to activate the window whose title starts with the given prefix
- **activateBySuffix**, to activate the window whose title ends with the given suffix
- **activateBySubstring**, to activate the window whose title contains the given string
- **activateByWmClass**, to activate the window with the given full, exact name part of its `WM_CLASS`
- **activateByWmClassInstance**, to activate the window with the given full, exact instance part of its `WM_CLASS`
- **activateById**, to activate the window with the given its window ID

Each method takes a single string argument,
and returns a single boolean indicating whether such a window was found or not.
Strings are matched case-sensitively.
Furthermore, activating a window also activates its workspace.

The `WM_CLASS` is originally an X concept, but is available under Wayland as well
(exposed via `get_wm_class()` and `get_wm_class_instance()` on a `Meta.Window`).
It’s a pair of strings (name, instance) forming a kind of “application name”,
and both are more “stable” than the title (which may include changing details);
I believe the name is supposed to be more general than the instance,
but looking at some windows on my system I can’t really tell a difference,
both components seem mostly the same apart from arbitrary capitalization or punctuation differences.
Still, the `WM_CLASS` may be useful for activating a certain application regardless of its current window title
(e.g. GNOME Terminal does not include an application name in the window title).
You can see current name and instance strings in Looking Glass (<kbd>Alt</kbd>+<kbd>F2</kbd> `lg`):
```js
global.get_window_actors().map(a => a.get_meta_window()).map(w => `${w.get_wm_class()} (${w.get_wm_class_instance()})`)
```

The window ID lets us target an specific window from a set where their `WM_CLASS` may be the same.
Again, we can find the window IDs in Looking Glass:
```js
global.get_window_actors().map(a => a.get_meta_window()).map(w => `${w.get_wm_class()} (${w.get_id()})`)
```
Alternatively, the [Window Calls Extended extension](https://extensions.gnome.org/extension/4974/window-calls-extended/)
can be used to obtain the window IDs using its `List` method.
(Due to limitations of the JavaScript `number` type, IDs above ca. 2^54 will not work reliably.)

By default, the extension goes through the windows in the order in which Mutter returns them
and activates the first one that matches the criterion.
If you are often working with ambiguous titles and need more control over this,
you can change the behavior by calling the **setSortOrder** method with one of the following strings:

- *default*: no sorting.
  This is intended for users who expect the match to be unambiguous anyways,
  and removes the overhead of sorting the list of windows.
  As of GNOME 46, it appears to be equivalent to *lowest_user_time* in practice.
- *lowest_user_time*: sort by ascending [user time](https://gnome.pages.gitlab.gnome.org/mutter/meta/method.Window.get_user_time.html).
  The user time is updated each time you interact with a window,
  so the window with the lowest user time will be the one you least recently interacted with.
- *highest_user_time*: sort by descending user time.
  This will be the matching window you most recently interacted with.
- *lowest_window_id*: sort by ascending [window ID](https://gnome.pages.gitlab.gnome.org/mutter/meta/method.Window.get_id.html).
  Mutter makes few guarantees about the window ID,
  but it’s usually monotonically increasing (though it [can overflow](https://gitlab.gnome.org/GNOME/mutter/-/blob/a68385a179/src/core/display.c#L3507)),
  which means the window with the lowest window ID should be the “oldest” one.
- *highest_window_id*: sort by descending window ID.
  This will usually be the matching window that was most recently created.

The method also returns the previous sort order, in case you want to restore it later.
Note that the sort order is currently not persisted anywhere
(it will start as *default* in each new GNOME Shell session).

## Command line usage

You can call these methods using your favorite D-Bus command line tool, for example:

```sh
busctl --user call \
    org.gnome.Shell \
    /de/lucaswerkmeister/ActivateWindowByTitle \
    de.lucaswerkmeister.ActivateWindowByTitle \
    activateBySubstring \
    s 'Firefox'
```

```sh
gdbus call --session \
    --dest org.gnome.Shell \
    --object-path /de/lucaswerkmeister/ActivateWindowByTitle \
    --method de.lucaswerkmeister.ActivateWindowByTitle.activateBySubstring \
    'Firefox'
```

## License

GNU GPL v2 or later.
