# Activate Window By Title

This is a GNOME Shell extension to activate (focus, bring to the foreground) a window
based on its title (or `WM_CLASS`, see below).
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
