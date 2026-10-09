// A small regex-based syntax highlighter for the languages used in the content.
//
// Each language is an ordered list of [tokenClass, pattern]. The patterns are
// joined into one regex; earlier rules win, so comments and strings come first
// (a keyword inside a string must stay a string). Output is escaped HTML with
// <span class="tok-…"> wrappers — safe to assign to innerHTML.

import { escapeHtml } from './util.js';

const NUMBER = String.raw`\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)[lLfFdD]?\b`;
const DQ_STRING = String.raw`"(?:\\.|[^"\\\n])*"`;
const SQ_STRING = String.raw`'(?:\\.|[^'\\\n])*'`;

const JAVA_KEYWORDS = 'abstract assert boolean break byte case catch char class continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record sealed permits yield';

const SQL_KEYWORDS = 'select from where and or not in is null as on join inner left right full outer cross natural using group by having order asc desc nulls first last limit offset fetch next rows row only union all intersect except distinct case when then else end insert into values update set delete returning create table view materialized index unique primary key foreign references constraint check default alter add drop column rename to if exists cascade restrict truncate begin commit rollback savepoint release transaction isolation level read committed uncommitted repeatable serializable with recursive over partition window range groups between preceding following current unbounded exclude ties like ilike similar any some lateral grant revoke function procedure returns language trigger before after for each execute declare return replace do call schema sequence explain analyze costs buffers format vacuum lock share mode nowait skip locked of conflict nothing filter within extract interval and true false generated always identity stored temporary temp boolean integer int bigint smallint serial bigserial numeric decimal real double precision text varchar char character date time timestamp timestamptz jsonb json uuid bytea array enum type domain tablespace owner role user policy enable disable security definer invoker immutable stable volatile strict parallel safe concurrently refresh data no inherits attach detach';

const BASH_KEYWORDS = 'if then else elif fi for while do done case esac in function return export local echo exit cd sudo';

const PSEUDO_KEYWORDS = 'if then else elif for each in to downto from while do repeat until return function procedure algorithm end and or not break continue swap print push pop let set true false null';

// Case-insensitivity comes from the language's regex flags, not from here.
function words(list) {
  return String.raw`\b(?:${list.split(/\s+/).join('|')})\b`;
}

const LANGUAGES = {
  java: {
    rules: [
      ['comment', String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`],
      ['string', String.raw`"""[\s\S]*?"""|${DQ_STRING}|'(?:\\.|[^'\\\n])+'`],
      ['annotation', String.raw`@[A-Za-z_]\w*(?:\.\w+)*`],
      ['keyword', words(JAVA_KEYWORDS)],
      ['literal', String.raw`\b(?:true|false|null)\b`],
      ['number', NUMBER],
      ['type', String.raw`\b[A-Z][A-Za-z0-9_]*\b`],
    ],
  },
  sql: {
    flags: 'i',
    rules: [
      ['comment', String.raw`--[^\n]*|\/\*[\s\S]*?\*\/`],
      ['string', String.raw`\$\w*\$[\s\S]*?\$\w*\$|E?'(?:''|[^'])*'`],
      ['type', String.raw`"(?:""|[^"])*"`],
      ['keyword', words(SQL_KEYWORDS)],
      ['number', NUMBER],
      ['function', String.raw`\b[a-z_][a-z0-9_]*(?=\()`],
    ],
  },
  json: {
    rules: [
      ['property', String.raw`${DQ_STRING}(?=\s*:)`],
      ['string', DQ_STRING],
      ['literal', String.raw`\b(?:true|false|null)\b`],
      ['number', String.raw`-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b`],
    ],
  },
  yaml: {
    flags: 'm',
    rules: [
      ['comment', String.raw`#[^\n]*`],
      ['property', String.raw`^[ \t-]*[\w.\-]+(?=\s*:)`],
      ['string', `${DQ_STRING}|${SQ_STRING}`],
      ['literal', String.raw`\b(?:true|false|null|on|off|yes|no)\b`],
      ['number', NUMBER],
    ],
  },
  properties: {
    flags: 'm',
    rules: [
      ['comment', String.raw`^[ \t]*[#!][^\n]*`],
      ['property', String.raw`^[ \t]*[\w.\-\[\]]+(?=\s*[=:])`],
      ['literal', String.raw`\b(?:true|false)\b`],
      ['number', NUMBER],
    ],
  },
  xml: {
    rules: [
      ['comment', String.raw`<!--[\s\S]*?-->`],
      ['string', `${DQ_STRING}|${SQ_STRING}`],
      ['keyword', String.raw`<\/?[\w:.\-]+|\/?>|<\?xml|\?>`],
      ['property', String.raw`\b[\w:\-]+(?==)`],
    ],
  },
  http: {
    flags: 'm',
    rules: [
      ['keyword', String.raw`^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b|\bHTTP\/\d(?:\.\d)?`],
      ['property', String.raw`^[\w-]+(?=:)`],
      ['string', DQ_STRING],
      ['literal', String.raw`\b(?:true|false|null)\b`],
      ['number', String.raw`\b\d+\b`],
    ],
  },
  bash: {
    rules: [
      ['comment', String.raw`#[^\n]*`],
      ['string', `${DQ_STRING}|${SQ_STRING}`],
      ['annotation', String.raw`\$\w+|\$\{[^}]+\}`],
      ['keyword', words(BASH_KEYWORDS)],
      ['number', String.raw`\b\d+\b`],
    ],
  },
  dockerfile: {
    flags: 'mi',
    rules: [
      ['comment', String.raw`^\s*#[^\n]*`],
      ['keyword', String.raw`^\s*(?:FROM|RUN|CMD|COPY|ADD|ENTRYPOINT|ENV|ARG|EXPOSE|WORKDIR|USER|LABEL|VOLUME|HEALTHCHECK|AS)\b|\bAS\b`],
      ['string', `${DQ_STRING}|${SQ_STRING}`],
      ['number', String.raw`\b\d+\b`],
    ],
  },
  // Nginx configuration (DevOps subject): directives at the start of a line,
  // $variables, quoted strings, sizes/timeouts and on/off.
  nginx: {
    flags: 'm',
    rules: [
      ['comment', String.raw`#[^\n]*`],
      ['string', `${DQ_STRING}|${SQ_STRING}`],
      ['annotation', String.raw`\$\w+`],
      ['keyword', String.raw`^[ \t]*[a-z_0-9]+(?=[ \t{;])`],
      ['literal', String.raw`\b(?:on|off)\b`],
      ['number', String.raw`\b\d+[kmgsKMG]?\b`],
    ],
  },
  // Markdown instruction files (Claude Code subject): CLAUDE.md, rules, SKILL.md
  // and subagent files — HTML comments, headings and frontmatter fences,
  // frontmatter keys, inline code, @imports and $ARGUMENTS-style placeholders,
  // and list markers.
  markdown: {
    flags: 'm',
    rules: [
      ['comment', String.raw`<!--[\s\S]*?-->`],
      ['keyword', String.raw`^#{1,6}[ \t][^\n]*|^---[ \t]*$`],
      ['property', String.raw`^[a-z][a-z0-9_-]*(?=:)`],
      ['string', String.raw`\x60[^\x60\n]+\x60`],
      ['annotation', String.raw`(?<![\w\x60])@[\w./~-]+|\$ARGUMENTS(?:\[\d+\])?|\$\d\b|\$\{CLAUDE_[A-Z_]+\}`],
      ['number', String.raw`^[ \t]*(?:[-*+]|\d+\.)(?=[ \t])`],
    ],
  },
  pseudocode: {
    flags: 'i',
    rules: [
      ['comment', String.raw`\/\/[^\n]*`],
      ['string', `${DQ_STRING}`],
      ['keyword', words(PSEUDO_KEYWORDS)],
      ['number', String.raw`\b\d+(?:\.\d+)?\b`],
    ],
  },
};
LANGUAGES.sh = LANGUAGES.bash;
LANGUAGES.shell = LANGUAGES.bash;
LANGUAGES.yml = LANGUAGES.yaml;
LANGUAGES.md = LANGUAGES.markdown;
// Windows one-liners (installers): comments, strings and $variables read the same.
LANGUAGES.powershell = LANGUAGES.bash;

const compiled = new Map();
function compile(language) {
  if (!compiled.has(language)) {
    const spec = LANGUAGES[language];
    const regex = new RegExp(spec.rules.map(([, pattern]) => `(${pattern})`).join('|'), `g${spec.flags || ''}`);
    compiled.set(language, { regex, classes: spec.rules.map(([name]) => name) });
  }
  return compiled.get(language);
}

export function canHighlight(language) {
  return Boolean(LANGUAGES[language]);
}

/** Returns highlighted, escaped HTML for `code`. Unknown languages are just escaped. */
export function highlight(code, language) {
  if (!LANGUAGES[language]) return escapeHtml(code);
  const { regex, classes } = compile(language);
  regex.lastIndex = 0;
  let html = '';
  let last = 0;
  let match;
  while ((match = regex.exec(code)) !== null) {
    if (match[0] === '') { regex.lastIndex++; continue; }
    const groupIndex = match.slice(1).findIndex((group) => group !== undefined);
    html += escapeHtml(code.slice(last, match.index));
    html += `<span class="tok-${classes[groupIndex]}">${escapeHtml(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  return html + escapeHtml(code.slice(last));
}
