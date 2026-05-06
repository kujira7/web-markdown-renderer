const assert = require("node:assert/strict");
const { renderMarkdown } = require("../renderer");

const SPEC_VERSION = "0.31.2";

const cases = [
  {
    example: 43,
    section: "Thematic breaks",
    markdown: "***\n---\n___\n",
    html: "<hr />\n<hr />\n<hr />\n"
  },
  {
    example: 44,
    section: "Thematic breaks",
    markdown: "+++\n",
    html: "<p>+++</p>\n"
  },
  {
    example: 45,
    section: "Thematic breaks",
    markdown: "===\n",
    html: "<p>===</p>\n"
  },
  {
    example: 62,
    section: "ATX headings",
    markdown: "# foo\n## foo\n### foo\n#### foo\n##### foo\n###### foo\n",
    html: "<h1>foo</h1>\n<h2>foo</h2>\n<h3>foo</h3>\n<h4>foo</h4>\n<h5>foo</h5>\n<h6>foo</h6>\n"
  },
  {
    example: 63,
    section: "ATX headings",
    markdown: "####### foo\n",
    html: "<p>####### foo</p>\n"
  },
  {
    example: 64,
    section: "ATX headings",
    markdown: "#5 bolt\n\n#hashtag\n",
    html: "<p>#5 bolt</p>\n<p>#hashtag</p>\n"
  },
  {
    example: 80,
    section: "Setext headings",
    markdown: "Foo *bar*\n=========\n\nFoo *bar*\n---------\n",
    html: "<h1>Foo <em>bar</em></h1>\n<h2>Foo <em>bar</em></h2>\n"
  },
  {
    example: 81,
    section: "Setext headings",
    markdown: "Foo *bar\nbaz*\n====\n",
    html: "<h1>Foo <em>bar\nbaz</em></h1>\n"
  },
  {
    example: 82,
    section: "Setext headings",
    markdown: "  Foo *bar\nbaz*\t\n====\n",
    html: "<h1>Foo <em>bar\nbaz</em></h1>\n"
  },
  {
    example: 107,
    section: "Indented code blocks",
    markdown: "    a simple\n      indented code block\n",
    html: "<pre><code>a simple\n  indented code block\n</code></pre>\n"
  },
  {
    example: 110,
    section: "Indented code blocks",
    markdown: "    <a/>\n    *hi*\n\n    - one\n",
    html: "<pre><code>&lt;a/&gt;\n*hi*\n\n- one\n</code></pre>\n"
  },
  {
    example: 119,
    section: "Fenced code blocks",
    markdown: "```\n<\n >\n```\n",
    html: "<pre><code>&lt;\n &gt;\n</code></pre>\n"
  },
  {
    example: 120,
    section: "Fenced code blocks",
    markdown: "~~~\n<\n >\n~~~\n",
    html: "<pre><code>&lt;\n &gt;\n</code></pre>\n"
  },
  {
    example: 121,
    section: "Fenced code blocks",
    markdown: "``\nfoo\n``\n",
    html: "<p><code>foo</code></p>\n"
  },
  {
    example: 124,
    section: "Fenced code blocks",
    markdown: "````\naaa\n```\n``````\n",
    html: "<pre><code>aaa\n```\n</code></pre>\n"
  },
  {
    example: 328,
    section: "Code spans",
    markdown: "`foo`\n",
    html: "<p><code>foo</code></p>\n"
  },
  {
    example: 329,
    section: "Code spans",
    markdown: "`` foo ` bar ``\n",
    html: "<p><code>foo ` bar</code></p>\n"
  },
  {
    example: 330,
    section: "Code spans",
    markdown: "` `` `\n",
    html: "<p><code>``</code></p>\n"
  },
  {
    example: 228,
    section: "Block quotes",
    markdown: "> # Foo\n> bar\n> baz\n",
    html: "<blockquote>\n<h1>Foo</h1>\n<p>bar\nbaz</p>\n</blockquote>\n"
  },
  {
    example: 229,
    section: "Block quotes",
    markdown: "># Foo\n>bar\n> baz\n",
    html: "<blockquote>\n<h1>Foo</h1>\n<p>bar\nbaz</p>\n</blockquote>\n"
  },
  {
    example: 230,
    section: "Block quotes",
    markdown: "   > # Foo\n   > bar\n > baz\n",
    html: "<blockquote>\n<h1>Foo</h1>\n<p>bar\nbaz</p>\n</blockquote>\n"
  },
  {
    example: 301,
    section: "Lists",
    markdown: "- foo\n- bar\n+ baz\n",
    html: "<ul>\n<li>foo</li>\n<li>bar</li>\n</ul>\n<ul>\n<li>baz</li>\n</ul>\n"
  },
  {
    example: 302,
    section: "Lists",
    markdown: "1. foo\n2. bar\n3) baz\n",
    html: "<ol>\n<li>foo</li>\n<li>bar</li>\n</ol>\n<ol start=\"3\">\n<li>baz</li>\n</ol>\n"
  },
  {
    example: 303,
    section: "Lists",
    markdown: "Foo\n- bar\n- baz\n",
    html: "<p>Foo</p>\n<ul>\n<li>bar</li>\n<li>baz</li>\n</ul>\n"
  },
  {
    example: 350,
    section: "Emphasis and strong emphasis",
    markdown: "*foo bar*\n",
    html: "<p><em>foo bar</em></p>\n"
  },
  {
    example: 351,
    section: "Emphasis and strong emphasis",
    markdown: "a * foo bar*\n",
    html: "<p>a * foo bar*</p>\n"
  },
  {
    example: 352,
    section: "Emphasis and strong emphasis",
    markdown: "a*\"foo\"*\n",
    html: "<p>a*&quot;foo&quot;*</p>\n"
  },
  {
    example: 13,
    section: "Backslash escapes",
    markdown: "\\\t\\A\\a\\ \\3\\φ\\«\n",
    html: "<p>\\\t\\A\\a\\ \\3\\φ\\«</p>\n"
  },
  {
    example: 14,
    section: "Backslash escapes",
    markdown:
      "\\*not emphasized*\n\\<br/> not a tag\n\\[not a link](/foo)\n\\`not code`\n1\\. not a list\n\\* not a list\n\\# not a heading\n\\[foo]: /url \"not a reference\"\n\\&ouml; not a character entity\n",
    html:
      "<p>*not emphasized*\n&lt;br/&gt; not a tag\n[not a link](/foo)\n`not code`\n1. not a list\n* not a list\n# not a heading\n[foo]: /url &quot;not a reference&quot;\n&amp;ouml; not a character entity</p>\n"
  },
  {
    example: 15,
    section: "Backslash escapes",
    markdown: "\\\\*emphasis*\n",
    html: "<p>\\<em>emphasis</em></p>\n"
  },
  {
    example: 219,
    section: "Paragraphs",
    markdown: "aaa\n\nbbb\n",
    html: "<p>aaa</p>\n<p>bbb</p>\n"
  },
  {
    example: 220,
    section: "Paragraphs",
    markdown: "aaa\nbbb\n\nccc\nddd\n",
    html: "<p>aaa\nbbb</p>\n<p>ccc\nddd</p>\n"
  },
  {
    example: 227,
    section: "Blank lines",
    markdown: "  \n\naaa\n  \n\n# aaa\n\n  \n",
    html: "<p>aaa</p>\n<h1>aaa</h1>\n"
  }
];

function normalizeHtml(html) {
  return String(html || "")
    .trim()
    .replace(/<hr \/>/g, "<hr>");
}

for (const testCase of cases) {
  assert.equal(
    normalizeHtml(renderMarkdown(testCase.markdown)),
    normalizeHtml(testCase.html),
    `CommonMark ${SPEC_VERSION} example ${testCase.example} (${testCase.section})`
  );
}

console.log(`commonmark ${SPEC_VERSION} subset tests passed`);
