# htmlsync

Synchronize the HTML header and footer to all your HTML files.

A true static site should not require building at all. There is one problem, how do you
configure the same header and footer on every HTML file? You could copy and paste, however that
is a manual process which can introduce errors.

Using `htmlsync` you can specify a source HTML file, which holds the header and footer you want synchronized,
and it will replace the header and footer in every HTML file.

## How does it work?

The `htmlsync` script looks for two specific token strings in the HTML files. The first string is
required to define the header of the HTML document. The second string is optional and defines the footer of the HTML document.

Here are what the token strings look like in a valid `htmlsync` file:

```html
<!--
  Any text above the head token is defined as the htmlsync header content.
  The head token is required for htmlsync to process this file.
  -->

@SyncTokenHead

<!--
  Any text between the head token and the foot token is the page content.
  This content will be ignored by htmlsync.
  -->

@SyncTokenFoot

<!--
  Any text after the foot token is defined as the htmlsync footer content.
  The foot token is optional.
  -->
```

All content from the start of the `.html` file up to and including the line with the head token
is defined as the header.

All content from the line with the foot token to the end of the `.html` file is defined as the
footer.

The `htmlsync` script only supports files that meet the following criteria:

* The file is in the same directory that `htmlsync` was executed in.
* The file has an extension of `.html`.
* The file has the `@SyncTokenHead` string in its content.

There are two uses for `htmlsync`:

1. Synchronize the header and footer from the source file to all supported files.
1. Create a new file with the header and footer from the source file as its content.

## Getting Started

Make sure you have the latest version of [Deno](https://deno.land/) installed.

Edit all your HTML files and ensure you have at least a head token and optionally a foot token.

To execute `htmlsync` use the following command:

```batch
deno run --unstable --allow-read=. --allow-write=. https://raw.githubusercontent.com/grantcarthew/deno-htmlsync/v1.0.0/htmlsync.js [-h | --help] <source file> [new file]
```

The only currently supported option is `-h` or `--help` which displays the command line help.

_Suggestion: It's a long command. Place it into a `bash` file to make repeated use easier._

### Valid HTML file examples

The `@SyncTokenHead` string is required for a `.html` file to be processed by `htmlsync`. Following is an example of a valid `htmlsync` source or destination file. Only the header content will by synchronized:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Valid htmlsync file</title>
    </head>
    <body>
        <h1>Hello World</h1>
        <!-- Some common navigation markup. Anything really. -->
        <!-- All content up to and including the next line is defined as header content -->
        <!-- Start Page Content @SyncTokenHead -->
        <p>
          Page specific content.
        </p>
    </body>
</html>
```

The `@SyncTokenFoot` string is optional for a `.html` file. Add it if you want the footer section of the page synchronized. Again the `@SyncTokenHead` string is required for `htmlsync` to process this file:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Valid htmlsync file</title>
    </head>
    <body>
        <h1>Hello World</h1>
        <!-- Some common navigation markup. Anything really. -->
        <!-- All content up to and including the next line is defined as header content -->
        <!-- Start Page Content @SyncTokenHead -->
        <p>
          Page specific content.
        </p>
        <!-- End Page Content @SyncTokenFoot -->
        <!-- All content from the above line to the end of file is defined as the footer content -->
        <!-- Footer content follows. Disclaimers, links or other common content. -->
        <p>
          Footer content.
        </p>
    </body>
</html>
```

### How to sync the header and footer

To synchronize the header and footer from a `source file` to all `.html` files in your current directory simply specify a source file name only. For example:

```batch
deno run --unstable --allow-read=. --allow-write=. https://raw.githubusercontent.com/grantcarthew/deno-htmlsync/v1.0.0/htmlsync.js index.html
```

The above command will read the header and footer from the `index.html` file and apply that header and footer to
all `.html` files found in the same directory.

It is worth noting here that any `.html` files that do not have a head token will be ignored.

### Creating a new HTML file

Here is an example of using `htmlsync` to create a new `.html` file:

```batch
deno run --unstable --allow-read=. --allow-write=. https://raw.githubusercontent.com/grantcarthew/deno-htmlsync/v1.0.0/htmlsync.js index.html about.html
```

The above command will read the header and footer content from the `index.html` file and create a new file named `about.html` that contains the header and footer content. The new file will have both the head and foot tokens.

## Testing

The unit tests creates three temporary files being `index.html`, `test1.html`, and `test2.html`. If any tests fail these residual files will be left on the file system for examination.

To run the unit tests execute the following command:

```bash
deno test --unstable --allow-write=. --allow-read=. --allow-run
```

The console output should look similar to the following:

```text
running 11 tests
test Missing source file argument ... ok (38ms)
test CLI help -h ... ok (35ms)
test CLI help --help ... ok (33ms)
test Invalid source file extension ... ok (35ms)
test Source file not found ... ok (33ms)
test Create new file header only ... ok (38ms)
test Create new file header and footer ... ok (37ms)
test Sync html header only ... ok (41ms)
test Sync html header and footer ... ok (40ms)
test Ignore files missing the head token ... ok (40ms)
test Ignore syncing the footer if file is missing the foot token ... ok (43ms)

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out (414ms)
```

## Contributing

If you find a bug please open an issue or send a pull request.

Review the [Code of Conduct](CONTRIBUTING.md) document.

## ChangeLog

* 2020-01-16: v1.0.0 - Initial release.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
