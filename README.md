# Activate Window By Title

This is a Gnome Shell extension to activate (focus, bring to the foreground) a window based on its title.
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

Each method takes a single string argument,
and returns a single boolean indicating whether such a window was found or not.
The title is matched case-sensitively.

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
