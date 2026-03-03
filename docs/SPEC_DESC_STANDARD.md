# Specification Description Standard

## Document Status

Status of this revision: `Draft`.
Last updated: `2026-03-03`.
Standard version: `0.0.2`.

Before release `1.0.0`, incompatible schema format changes (breaking changes) are allowed when increasing `MINOR` and/or `MAJOR`.

## Normative Interpretation of Modality

In this standard, modal terms have the following normative force:

- `MUST` / `MUST NOT` - strictly mandatory requirement;
- `SHOULD` / `SHOULD NOT` - recommended requirement; deviation is allowed with documented rationale;
- `MAY` - permissible behavior at the implementation's discretion.

Lowercase forms of the same words are interpreted equivalently.

## Normative References

The following base specifications are used when applying this standard:

- ISO 8601-1:2019 (Date and time - Representations for information interchange - Part 1: Basic rules);
- RFC 3339 (Date and Time on the Internet: Timestamps);
- YAML 1.2.2 (YAML Ain't Markup Language, Version 1.2.2);
- JSON Schema Draft 2020-12 (Core and Validation);
- CommonMark 0.31.2 (minimum Markdown syntax for compatible parsing of headings and links).

If a rule of this standard explicitly clarifies or restricts a rule from an external specification, the rule of this standard applies.

## 1. Purpose and Motivation of the Standard

### 1.1. Problem

In teams and organizations, specifications are often stored as Markdown documents with informal conventions:

- different metadata structures;
- different file naming rules;
- inconsistent entity nesting;
- inability to automatically validate integrity.

This leads to navigation errors, duplication, tool incompatibility, and high maintenance cost.

### 1.2. Goal of the Standard

This standard defines a unified machine-readable format for a specification description schema that allows:

- validating existing specification datasets and entity implementations;
- unifying repository structure;
- ensuring generator and validator compatibility;
- ensuring a predictable machine contract for tools with AI agents;
- formalizing rules for identifiers, paths, and required sections.

### 1.3. Application Principle

The standard is intended primarily for validation.
Generation tools may use the same rules as a template source, but generation is not the primary function of the standard.

## 2. Scope

The standard applies to:

- schemas describing entity types and their implementations;
- identifier and path validation rules;
- requirements for metadata and document content.

Requirements of this standard are split by conformance assessment object:

- schema conformance (`Schema-conformant`);
- specification dataset conformance (`Dataset-conformant`);
- validator conformance (`Validator-conformant`).

Criteria for each conformance class are provided in Section 14.

Requirements for an individual document are formulated using the term `entity implementation`.
Requirements for a set of documents are formulated using the term `specification dataset`.

This revision defines the general schema format and requirements for Markdown entity implementations.
For other implementation formats, applying the same rules is allowed provided that the implementation provides an equivalent representation of metadata and content for validation.

The standard does not define:

- a specific format for storing the body of an entity implementation document (except rules for checking labels of required sections);
- business meaning of entities;
- documentation rendering rules.

## 3. Terms and Definitions

- `Schema` - a YAML document that describes entity types and their validation rules.
- `Specification` - a general term for a document within a specification dataset.
- `Entity type` - a named category of entity implementations (for example, `domain`, `service`, `feature`). Type names are not fixed.
- `Entity implementation` - a concrete entity instance (document/object) of a given type. For a Markdown implementation (a `.md` file), `YAML frontmatter` MUST be located at the beginning of the file.
- `Specification dataset` - a set of entity implementations validated together.
- `YAML frontmatter` - an initial metadata block of a Markdown document delimited by `---`/`...` separators.
- `YAML mapping` (`mapping`) - a top-level YAML key-value object.
- `Reference field` (`entity_ref`) - a metadata field defined with `schema.type: entity_ref` and containing the `id` of another entity.
- `Reference resolution` (`resolve`) - an unambiguous mapping of a reference field value to a specific existing entity in the specification dataset.
- `Pattern` (`pattern`) - a string with placeholders used for validation.
- `Prefix` (`prefix`) - a fixed string at the beginning of a value used as part of a validation rule.
- `Section label` (`anchor label`) - anchor identifier value without the `#` prefix (for example, `goal`).
- `Label reference` - a reference with the `#` prefix (for example, `#goal`).
- `Validator` - an implementation that checks schema and/or specification dataset conformance to this standard.
- `Implementation profile` - a documented set of validator parameters that defines at minimum: (1) path normalization rules; (2) deterministic rules for resolving `entity_ref` references and computing `{ref:*:dir_path}`.

## 4. General Schema Data Model

A schema MUST contain:

- `version` - schema format version (string in `MAJOR.MINOR.PATCH` format);
- `entity` - mapping of entity type descriptions.

A schema MAY contain:

- `description` - informative schema description (non-empty string) that does not affect validation result.

Allowed top-level schema keys in this version of the standard: `version`, `entity`, `description`.

A closed-world key model applies to normative schema objects:

- keys not explicitly listed as allowed in the corresponding section of this standard are not allowed;
- keys prefixed with `x-` are not allowed.

Violation of the closed-world key model is a `SchemaError` class violation (Section 14.4).

Top-level structure example (informative):

```yaml
version: 0.0.2
description: "Base specification schema"
entity:
  domain: ...
  service: ...
```

Semantics of `version`:

- changing `MAJOR` means an incompatible schema format change;
- changing `MINOR` means a backward-compatible schema format extension;
- changing `PATCH` means editorial clarifications and/or fixes that do not change the normative semantics of the schema format.

For versions with `MAJOR = 0` (`Draft` status), incompatible changes are allowed when increasing `MINOR` and/or `MAJOR`.

## 5. Entity Type Description Rules

Each `entity.<type_name>` element describes one entity type.

### 5.1. Required Entity Type Fields

- `id_prefix`
- `path_pattern`

### 5.2. Optional Entity Type Fields

- `meta`
- `content`
- `description`

If specified, `description` MUST be a non-empty string and is informative (does not affect validation result).

Allowed keys in `entity.<type_name>`: `id_prefix`, `path_pattern`, `meta`, `content`, `description`.
Any other key in `entity.<type_name>` is not allowed and is a `SchemaError` class violation (Section 14.4).

### 5.3. Deterministic Identification of Entity Implementation Type

For each entity implementation, validator MUST determine the entity type before applying `path_pattern`, `meta`, and `content` rules.

Implementation type MUST be determined primarily by required `type` field from `YAML frontmatter`.
Using file path, directory name, or other heuristics for type selection is not allowed.

Type identification algorithm:

1. Read `type` field value from implementation `YAML frontmatter`.
2. If `type` is absent, is not a string, or does not match any `entity.<type_name>` key, this is an `InstanceError` class violation (Section 14.4).
3. Treat `type` value as implementation type.
4. Validate consistency of `id` with `entity.<type>.id_prefix` by rules of Section 7.
5. Any inconsistency between `id` value and `id_prefix` of selected type is an `InstanceError` class violation (Section 14.4).

## 6. Reference Field Rules (`entity_ref`)

### 6.1. General Model

This standard does not define a special `parent` entity and does not reserve names of reference fields.
Relationships between entities are defined only through `meta.fields[]` with `schema.type: entity_ref`.

Reference field name is chosen by schema author according to domain semantics (for example, `owner`, `service`, `domain_owner`, `depends_on`).

### 6.2. Reference Cardinality and Typing

A single `entity_ref` field value defines a reference to one entity.
Multiple relationships are represented by separate fields or via arrays under general `schema.type: array` rules (Section 12.2).

Allowed target entity types are restricted by `schema.refTypes` (Sections 12.2 and 12.3).

### 6.3. Reference Resolution

For each present `entity_ref` reference, validator MUST unambiguously determine target entity in the specification dataset.
Resolution is performed by string `id` value of the reference, considering `refTypes` constraints when present.

Regardless of index storage mechanism, validator MUST apply the same resolution rule across the whole specification dataset.

### 6.4. `ref` Context

For each successfully resolved reference `meta.<field_name>`, `ref` namespace MAY be used in substitution and expressions:

- `ref.<field_name>.id`
- `ref.<field_name>.type`
- `ref.<field_name>.slug`
- `ref.<field_name>.dir_path`

`ref.<field_name>.dir_path` means path to the target entity file directory relative to specification dataset root in POSIX form, without trailing `/`.

### 6.5. Minimum Required Contract of the Implementation Profile

Each validator implementation MUST explicitly document the implementation profile it uses.

At minimum, the implementation profile MUST define:

- path normalization rule;
- deterministic resolution rule for `entity_ref` references;
- rule for computing `ref.<field_name>.dir_path` for a resolved reference;
- repeatability guarantee: with identical schema/data input, resolution and validation results MUST be the same.

## 7. `id_prefix` Field Rules

### 7.1. Purpose

`id_prefix` defines the prefix of the `id` field for implementations of the corresponding entity type.
The `id` field MUST have format `"{id_prefix}-N"`, where `N` is a non-negative integer in unsigned decimal notation.
Validation MUST be performed against the whole `id` value, not a substring.

### 7.2. Requiredness

`id_prefix` is required for each entity type.

### 7.3. `id` Format and Numeric Suffix

`id_prefix` MUST be a non-empty ASCII string and MUST fully match regular expression `^[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*$`.
`id_prefix` MUST NOT contain placeholders of form `{...}`.
`id_prefix` values MUST be globally unique within `entity`; repeating `id_prefix` across different entity types is a `SchemaError` class violation (Section 14.4).

Numeric suffix `N` in `"{id_prefix}-N"` is treated as a counter:

- unique within entity type;
- starting from `0`.

`N` MUST be interpreted as a non-negative integer in unsigned decimal notation.
This standard does not require sequence continuity (gaps are allowed).

## 8. `path_pattern` Field Rules

### 8.1. Purpose

`path_pattern` defines a path validation pattern or a set of conditional path validation patterns for an entity implementation file (or document).
Matching MUST be performed against the whole path, not a substring.

Path MUST be validated as a relative path from specification dataset root in POSIX form (`/` separator).
Comparison is performed on normalized path representation, where `./` prefix, empty segments, and `..` segments are not allowed.

### 8.2. Simple Form

`path_pattern` MAY be a string. In this case, the string is treated as an unconditional path pattern.

Example (informative):

```yaml
path_pattern: "docs/specs/domains/{slug}/index.md"
```

### 8.3. Conditional Form (`cases`)

Conditional `path_pattern` logic is defined by cases (`cases`) using `if / else if / else` model.
Two container forms are supported:

- short form: `path_pattern` is a list of cases;
- canonical form: `path_pattern` is an object containing `cases` field.

Short form is syntactic sugar and is normalized to canonical form by rules of Section 8.4.
In canonical form, `path_pattern` object MAY contain only `cases` key.

A case MUST be an object with following fields:

- `use` (required) - string path pattern;
- `when` (optional) - boolean value or expression by rules of Section 11.6.

Other fields in a case are not allowed and are a `SchemaError` class violation (Section 14.4).

Requirements for case list:

- list MUST be non-empty;
- there MUST be exactly one unconditional case (case without `when`);
- unconditional case MUST be the last list element.

For canonical form:

- `cases` is required and MUST satisfy requirements above;
- other `path_pattern` object fields are not allowed and are a `SchemaError` class violation (Section 14.4).

### 8.4. Normalization and Pattern Selection During Validation

Before evaluating conditions, validator MUST normalize `path_pattern` to internal canonical form `path_pattern.cases`:

1. If `path_pattern` is a string, it is equivalent to `path_pattern: { cases: [{ use: "<string>" }] }`.
2. If `path_pattern` is a list, it is equivalent to `path_pattern: { cases: <that_list> }`.
3. If `path_pattern` is an object, `cases` field is used.

After normalization, validator MUST:

1. evaluate `cases[]` left to right;
2. choose `use` of the first case that satisfies one of conditions:
   - `when` field is absent (unconditional case, `else` branch);
   - `when` field is present and evaluates to `true`.

### 8.5. Using Placeholders in `path_pattern`

`path_pattern` allows:

- built-in placeholders (Section 9.1);
- metadata placeholders `{meta:field_name}`;
- reference placeholders `{ref:field_name:part}`, where `part` is one of `id`, `type`, `slug`, `dir_path`.

Constraints for `{meta:field_name}`:

- field `field_name` MUST be declared in `meta.fields` of this entity type;
- corresponding `schema.type` MUST be one of `string`, `integer`, `boolean`, `null`;
- `schema.enum` MUST be specified.

Constraints for `{ref:field_name:part}`:

- field `field_name` MUST be declared in `meta.fields` of this entity type;
- corresponding `schema.type` MUST equal `entity_ref`.

If selected pattern contains `{meta:...}` or `{ref:...}`, and corresponding value is absent or cannot be computed, this is an `InstanceError` class violation (Section 14.4).

Example of valid schema (informative, canonical form):

```yaml
entity:
  feature:
    id_prefix: "FEAT"
    path_pattern:
      cases:
        - when: { exists: meta.owner }
          use: "{ref:owner:dir_path}/features/{created_date}-{slug}.md"
        - use: "spec/features/{slug}.md"
    meta:
      fields:
        - name: owner
          required: false
          schema:
            type: entity_ref
            refTypes: [service]
```

Equivalent short form (informative):

```yaml
entity:
  feature:
    id_prefix: "FEAT"
    path_pattern:
      - when: { exists: meta.owner }
        use: "{ref:owner:dir_path}/features/{created_date}-{slug}.md"
      - use: "spec/features/{slug}.md"
```

## 9. Placeholders

### 9.1. Supported Set

The standard defines three classes of placeholders used in patterns and string values of metadata rules:

- built-in placeholders (listed below);
- metadata placeholders in `path_pattern` (by rules of Section 8.5);
- reference placeholders in `path_pattern` (by rules of Sections 6.4 and 8.5).

`<...>` notation in this standard text is used only as a metavariable for structure description (for example, `entity.<type_name>`).
`{...}` notation is used only for placeholders subject to substitution during validation.
Literal `{` and `}` characters in string values of rules that support placeholders are not allowed.

Built-in placeholders:

- `{id}`
- `{slug}`
- `{created_date}`
- `{updated_date}`

Metadata placeholders use `meta` namespace and have form `{meta:field_name}`.
Reference placeholders use `ref` namespace and have form `{ref:field_name:part}`.

Arbitrary placeholders are not supported.
Any substring of form `{...}` that does not match a supported placeholder is a `SchemaError` class violation (Section 14.4).

### 9.2. `ref:*` Rules

`{ref:field_name:id}`, `{ref:field_name:type}`, `{ref:field_name:slug}`, and `{ref:field_name:dir_path}` are computed from resolution result of `meta.field_name` reference field.

`ref:*` substitution is allowed only when the corresponding `entity_ref` field is present and successfully resolved.
Value semantics:

- `id` - `id` value of target entity;
- `type` - target entity type (key name in `entity`);
- `slug` - `slug` value of target entity;
- `dir_path` - path to directory of target entity file relative to specification dataset root in POSIX form, without trailing `/`.

### 9.3. Repeated Placeholder Use

If the same placeholder is used more than once in a pattern, all its occurrences MUST match the same value.

## 10. Required Fields of Any Entity Implementation

The following fields are built-in fields of an entity implementation and MUST NOT be re-declared as built-in schema requirements. Fields `type`, `id`, `slug`, `created_date`, and `updated_date` are required for any entity implementation:

- `type`
- `id`
- `slug`
- `created_date`
- `updated_date`

## 11. Validation Rules for Entity Implementation Fields

For a Markdown entity implementation (a `.md` file), `YAML frontmatter` MUST be present at the beginning of the file.
Built-in fields (`type`, `id`, `slug`, `created_date`, `updated_date`) and metadata fields validated by `meta.fields` rules are specified as fields of one YAML mapping (`mapping`) in this block.
This standard does not require presence of `meta` block/key itself in entity implementation.

For Markdown implementation, `YAML frontmatter` MUST start at the first line of the file with `---` separator and contain one top-level YAML mapping (`mapping`).
`YAML frontmatter` MUST end with a separate `---` or `...` separator line before document body starts.
Duplicate keys in `YAML frontmatter` (including nested YAML mappings) are not allowed; if the YAML parser used allows them by default, validator MUST enable duplicate-key prohibition mode or perform equivalent additional validation.
Metadata type validation MUST be performed after YAML parsing, without implicit type conversion by validator.

Built-in `type` field rules:

- field is required;
- value MUST be a string;
- value MUST match one of `entity.<type_name>` keys in schema.

Allowed `YAML frontmatter` keys for a specific implementation: built-in fields (`type`, `id`, `slug`, `created_date`, `updated_date`) and fields declared in `meta.fields` of corresponding entity type.
Any other `YAML frontmatter` key is an `InstanceError` class violation (Section 14.4).

### 11.1. `id` Field

- required;
- MUST match format `"{id_prefix}-N"` for the type specified in `type` field, where `N` is a non-negative integer in unsigned decimal notation;
- MUST be globally unique across the whole specification dataset (among all entity types).

### 11.2. `slug` Field

- required;
- MUST be unique within entity type;
- MUST match regular expression `^[a-z0-9]+(?:-[a-z0-9]+)*$` (validation against whole `slug` value).

### 11.3. `created_date` and `updated_date` Fields

- required;
- MUST be in RFC 3339 `full-date` format (`YYYY-MM-DD`), which is a restricted profile of ISO 8601;
- MUST be calendar-valid dates (for example, `3026-02-30` is invalid).

If a value is used in a path pattern (for example, `{created_date}`), comparison MUST be strict (literal match, without format normalization).

### 11.4. Reference Fields (`entity_ref`)

For each field declared in `meta.fields` with `schema.type: entity_ref`, following rules apply:

- if key is absent and field is not required by Section 11.5, this is allowed;
- when key is present, its value MUST be an `id` string;
- key absence and `null` value are not equivalent: `null` is treated as a present `null`-typed value and violates the string type requirement.

Reference resolution and `refTypes` checks are defined in Section 12.3.

### 11.5. General Requiredness Model (`required`, `required_when`)

This model applies to `meta.fields[]` (Section 12) and `content.sections[]` (Section 13).

If specified, `required` field MUST be a boolean value.
If specified, `required_when` field MUST be either a boolean value or an expression by rules of Section 11.6.

If `required` is omitted, effective `required` value is `false`.
If `required_when` is omitted, effective `required_when` value is `false`.
Simultaneous use of `required: true` and `required_when` key is not allowed and is a `SchemaError` class violation (Section 14.4).

For a specific implementation, an element is considered required if at least one of conditions holds:

- effective `required` value equals `true`;
- `required_when` expression evaluates to `true`.

In all other cases, element is considered optional.

### 11.6. `required_when` Expressions

If `required_when` is a boolean value, this value is used.
If `required_when` is an expression object, object MUST contain exactly one operator key from the list:

- `eq`
- `eq?`
- `in`
- `in?`
- `all`
- `any`
- `not`
- `exists`

Evaluation context for a specific entity implementation:

- `meta.<field_name>` - value of a field from `YAML frontmatter` of specific implementation (including built-in fields `type`, `id`, `slug`, `created_date`, `updated_date` and fields described in `meta.fields`);
- `ref.<field_name>.<part>` - attribute value of resolved reference, where `part` is one of `id`, `type`, `slug`, `dir_path`.

Reference of form `meta.<field_name>` to a name absent among built-in fields and among `meta.fields` fields with literal `name` is not allowed and is a `SchemaError` class violation (Section 14.4).
Reference of form `ref.<field_name>.<part>` to a field not declared as `entity_ref`, or with unsupported `part`, is not allowed and is a `SchemaError` class violation (Section 14.4).
If a valid reference points to a missing `YAML frontmatter` field or to a reference that cannot be resolved for a specific implementation, its value is treated as `missing`.

Operator semantics:

- `eq: [A, B]` - strict comparison of two operands; list MUST contain exactly two elements;
- `eq?: [A, B]` - safe strict comparison of two operands; list MUST contain exactly two elements; if any operand is `missing`, result is `false`;
- `in: [A, [B1, B2, ...]]` - membership of value `A` in a non-empty list of values; outer list MUST contain exactly two elements, second element MUST be a non-empty list;
- `in?: [A, [B1, B2, ...]]` - safe membership check; outer list MUST contain exactly two elements, second element MUST be a non-empty list; if checked value `A` or any list element is `missing`, result is `false`;
- `all: [E1, E2, ...]` - logical AND over a non-empty list of expressions; evaluated left to right with short-circuit;
- `any: [E1, E2, ...]` - logical OR over a non-empty list of expressions; evaluated left to right with short-circuit;
- `not: E` - logical negation of expression;
- `exists: R` - presence check for reference `R`; `R` MUST be a context reference (`meta.<field_name>` or `ref.<field_name>.<part>`), result is `true` when corresponding value exists in context (for `YAML frontmatter`: key is present; `null` counts as existing).

Operands `A`, `B`, `B1`... MAY be literals (`string`, `integer`, `number`, `boolean`, `null`) or context references (`meta.<field_name>`, `ref.<field_name>.<part>`).
For `eq`, `eq?`, `in`, `in?`, compared operands MUST be scalar values (`string`, `integer`, `number`, `boolean`, `null`); `array` and `object` literals are not allowed.
`meta.<field_name>` reference in `eq`, `eq?`, `in`, `in?` is allowed only for built-in fields and for `meta.fields` fields where `schema.type` is in `string`, `integer`, `number`, `boolean`, `null`, `entity_ref`.
Value of `meta.<field_name>` with `schema.type: entity_ref` in these expressions is treated as `id` string.
Field requiredness status (`required`, `required_when`) does not affect admissibility of `meta.<field_name>` reference in `eq?` and `in?`.
If such field is absent in a specific implementation, `eq?`/`in?` return `false` by `missing` rule, and requiredness violation for that field is diagnosed separately by Section 12.3.
Violation of these typing constraints is a `SchemaError` class violation (Section 14.4).

For strict operators `eq` and `in`, presence of `missing` in any operand is an `InstanceError` class violation (Section 14.4).

Strict comparison for `eq`, `eq?`, `in`, `in?` is performed by language-independent rules:

- `string` and `boolean` - exact value equality;
- `null` equals only `null`;
- `integer` and `number` - numeric value equality.

Any other `required_when` structure (unsupported operator, invalid argument cardinality, invalid argument type) is a `SchemaError` class violation (Section 14.4).
The same expression model is used for `path_pattern.cases[].when` (Section 8.3).

Example of conditional requiredness (informative):

```yaml
meta:
  fields:
    - name: status
      required: true
      schema:
        type: string
        enum: [draft, testing, actual, deprecated]
    - name: test_file
      required_when:
        in: [meta.status, [testing, actual]]
      schema:
        type: string
```

Example of safe check for a potentially missing reference (informative):

```yaml
meta:
  fields:
    - name: owner
      schema:
        type: entity_ref
        refTypes: [service]
    - name: owner_binding
      required_when:
        eq?: [ref.owner.type, "service"]
      schema:
        type: string
```

## 12. `meta` Rules

### 12.1. `meta.fields` Field

If `meta` block is specified, it may contain `fields` - a list of metadata fields for this entity type.
`meta` in schema describes `YAML frontmatter` fields of entity implementation (Markdown document).
These fields are specified at top level in `YAML frontmatter` and are not represented as a `meta` block in the implementation itself.

Allowed keys of `meta` object: `fields`.
Other keys of `meta` object are not allowed and are a `SchemaError` class violation (Section 14.4).

If `fields` is specified, it MUST be a list of objects with unique `name` values.

Each `fields` element specifies:

- `name`
- `required` (optional; if omitted, effective value is `false` by rules of Section 11.5)
- `required_when` (optional; if omitted, effective value is `false` by rules of Section 11.5)
- `description` (optional; non-empty string, informative field)
- `schema`

If specified, `description` does not affect validation result.

Allowed keys of `meta.fields[]` element: `name`, `required`, `required_when`, `description`, `schema`.
Other keys are not allowed and are a `SchemaError` class violation (Section 14.4).

Built-in field names (`type`, `id`, `slug`, `created_date`, `updated_date`) MUST NOT be used in `meta.fields`.

`name` field MUST be a non-empty string literal field name. Placeholders of form `{...}` in `name` are not allowed.

`required` and `required_when` fields for `meta.fields[]` are interpreted by general requiredness model (Section 11.5).

`schema` field defines constraints for metadata field value and MUST be an object.
Supported `schema` keys are defined in Section 12.2.
Other `schema` keys are not allowed and are a `SchemaError` class violation (Section 14.4).

A field from `meta.fields` may be used in `path_pattern` (Section 8.5):

- as `{meta:field_name}` - only if `schema.enum` is specified and `schema.type` equals `string`, `integer`, `boolean`, or `null`;
- as `{ref:field_name:part}` - only if `schema.type` equals `entity_ref`.

### 12.2. `schema` Field

`schema` field uses a restricted subset of JSON Schema Draft 2020-12 (Core + Validation) to validate metadata field value.
Keywords listed in this section have semantics of the specified JSON Schema dialect, unless otherwise defined by this standard.
This standard defines following `schema` keys:

- `type` (required)
- `const` (optional)
- `enum` (optional)
- `items` (optional)
- `minItems` (optional)
- `maxItems` (optional)
- `uniqueItems` (optional)
- `refTypes` (optional)

Other `schema` keys are not allowed and are a `SchemaError` class violation (Section 14.4).

`type` key defines expected type of metadata value after parsing YAML/JSON representation (by actual value type, not by its string representation).
Supported `type` values:

- `string`
- `number`
- `integer`
- `boolean`
- `array`
- `null`
- `entity_ref` (extension of this standard; absent in JSON Schema Draft 2020-12)

`type` validation MUST be strict, without implicit type conversion (for example, string `"1"` is not equal to number `1`).
For `type: integer`, value MUST be a number without fractional part.
Composite `type` forms (for example, `string|null`, `array<string>`) are not supported by this standard.
`type: entity_ref` defines a specialized reference type; its value in `YAML frontmatter` MUST be an `id` string validated by referential integrity rules (Section 12.3).
Use of `type: object` is not supported in this version of the standard and is a `SchemaError` class violation (Section 14.4).

If specified, `const` key defines value that actual field value MUST strictly match (by value and type after YAML parsing).
If `const` has string type, placeholders from Section 9 are allowed in it (for example, `{ref:owner:slug}`).
If `const` has string type, any substring in curly braces MUST be a supported placeholder by Section 9; literal `{` and `}` are not allowed.
For `type: entity_ref`, if `const` is specified, `const` value MUST be an `id` string and is validated in addition to referential integrity rules.

Example of metadata field where value is fixed to `slug` of resolved referenced entity (informative):

```yaml
- name: owner_slug
  required_when:
    exists: meta.owner
  schema:
    type: string
    const: "{ref:owner:slug}"
```

If specified, `enum` key MUST be a non-empty list.
Actual field value MUST strictly match at least one `enum` item.
If an `enum` item has string type, placeholders from Section 9 are allowed in it.
If an `enum` item has string type, any substring in curly braces MUST be a supported placeholder by Section 9; literal `{` and `}` are not allowed.
If both `type` and `enum` are specified, each `enum` item MUST conform to `type`; otherwise it is a `SchemaError` class violation (Section 14.4).
For `type: entity_ref`, if `enum` is specified, each `enum` item MUST be an `id` string and is validated in addition to referential integrity rules.

`items` key is allowed only with `type: array`.
`items` value MUST be a `schema` object and applies to each array element.

`minItems`, `maxItems`, `uniqueItems` keys are allowed only with `type: array`.
`minItems` and `maxItems` MUST be non-negative integers; if both keys are specified, `minItems <= maxItems` MUST hold.
`uniqueItems`, if specified, MUST be a boolean value.

`refTypes` key is allowed only with `type: entity_ref`.

If specified, `refTypes` key MUST be a non-empty list of strings without duplicates.
Each `refTypes` item MUST reference an existing entity type (a key in `entity`).

Example describing an array of strings (informative):

```yaml
- name: tags
  schema:
    type: array
    items:
      type: string
    minItems: 1
    uniqueItems: true
```

### 12.3. Validation Semantics

For each `fields` element, validator MUST use the literal field name from `name`.
Duplicate `name` values within one `fields` list are a `SchemaError` class violation (Section 14.4).

For each `fields` element, field presence is validated by following rules:

- field is required if effective `required` value equals `true`;
- field is required if `required_when` expression evaluates to `true` for a specific implementation;
- otherwise field is optional.
- absence of a required field is an `InstanceError` class violation (Section 14.4).

If `eq?` or `in?` is used in `required_when`, an absent operand (including an absent required field) is handled only by `missing -> false` rule and does not create a separate evaluation error.

`schema` validation is performed for each present field from `meta.fields` by following rules:

- actual value MUST conform to `schema.type`;
- if `schema.const` is specified, actual value MUST strictly match it; for string `schema.const`, comparison is performed after placeholder substitution for specific entity implementation;
- if `schema.enum` is specified, actual value MUST strictly match at least one `schema.enum` item; for string `schema.enum` items, comparison is performed after placeholder substitution for specific entity implementation;
- if `schema.type` equals `array` and `schema.items` is specified, each array element MUST be validated against `schema.items` recursively;
- if `schema.type` equals `array` and `schema.minItems` is specified, array length MUST be at least `minItems`;
- if `schema.type` equals `array` and `schema.maxItems` is specified, array length MUST be at most `maxItems`;
- if `schema.type` equals `array` and `schema.uniqueItems: true` is specified, array elements MUST be pairwise distinct under strict value comparison.
- if `schema.type` equals `entity_ref`, actual value MUST be an `id` string of an existing entity:
  - with `schema.refTypes`, reference MUST resolve to exactly one existing entity of one of specified types and match `id` format of that type;
  - if `schema.refTypes` is not specified, reference MUST resolve to exactly one existing entity among all `entity` types by globally unique `id` (Section 11.1);
  - on successful resolution, reference forms context `ref.<field_name>.*` by rules of Sections 6.4 and 9.2.

If field value is used in `path_pattern` through placeholder by rules of Section 8.5, validator MUST:

- first validate field by `meta.fields` rules (including `required`, `required_when`, `schema.type`, and `schema.enum`);
- then substitute values into path pattern:
  - for `{meta:field_name}`, use actual field value in string representation (`string` as-is, `integer` as decimal notation, `boolean` as `true`/`false`, `null` as `null`);
  - for `{ref:field_name:part}`, use corresponding value of resolved target entity;
- compare result to implementation path by general `path_pattern` rules.

Additional `YAML frontmatter` fields (beyond built-in fields and `meta.fields` fields) are not allowed and are an `InstanceError` class violation (Section 14.4).

## 13. `content` Rules

### 13.1. `content.sections` Field

`content.sections` defines list of sections to validate in document body.
If specified, `content.sections` list MUST be non-empty.

Allowed keys of `content` object: `sections`.
Other keys of `content` object are not allowed and are a `SchemaError` class violation (Section 14.4).

Each `content.sections` element MUST be an object with following fields:

- `name` (required) - non-empty string without `#` prefix; defines section label (`anchor label`);
- `required` (optional; if omitted, effective value is `false` by rules of Section 11.5) - boolean value defining unconditional requiredness of section;
- `required_when` (optional; if omitted, effective value is `false` by rules of Sections 11.5 and 11.6) - boolean value or expression defining conditional requiredness of section;
- `title` (optional) - string or non-empty list of non-empty strings without duplicates; defines allowed section heading text;
- `description` (optional) - non-empty string, informative field.

If specified, `description` does not affect validation result.

Allowed keys of `content.sections[]` element: `name`, `required`, `required_when`, `title`, `description`.
Other keys are not allowed and are a `SchemaError` class violation (Section 14.4).

`name` values within `content.sections` MUST NOT repeat.

If `title` is specified as a string, for validation purposes it is treated as a single-item list.

`required` and `required_when` fields for `content.sections[]` are interpreted by general requiredness model (Section 11.5).

### 13.2. Validation Semantics

Section validation is performed by a normalized section model and by presence of section label (`anchor label`), not by exact heading text.

Label in `content.sections[].name` is specified without `#` prefix (for example, `goal`) and compared case-sensitively.
Section labels within one document MUST be unique; repetition of the same label is an `InstanceError` class violation (Section 14.4).

For Markdown implementation, validator MUST build an internal normalized section list in form `{ label, title }`.
`label` MUST be extracted only from explicit marking in one of canonical syntaxes:

- link in heading line: `[<title>](#<label>)`;
- label attribute at end of heading line: `<title> {#<label>}`.

Automatic derivation of label from heading text without explicit marker is not allowed.

`title` text for validating `content.sections[].title` is extracted:

- for `[<title>](#<label>)` form - from link text part `<title>`;
- for `<title> {#<label>}` form - from heading text without `{#<label>}` suffix.

For each `content.sections` element, validator MUST apply following rules:

- if effective `required` value equals `true`, section with `name` label is required;
- if `required_when` expression evaluates to `true` for a specific implementation, section with `name` label is required;
- if effective `required` value equals `false` and `required_when` expression evaluates to `false`, absence of section with `name` label is not an error;
- if `title` is specified and section is found, heading text of this section MUST strictly match at least one allowed `title` value (case-sensitive comparison).

Example of allowed heading for `goal` section (informative):

```md
## [Goal](#goal)
```

```md
## Goal {#goal}
```

A section is considered found if the required label is present.

## 14. Conformance to the Standard

### 14.0. Conformance Classes

This standard defines three conformance classes:

- `Schema-conformant` - correctness of schema itself;
- `Dataset-conformant` - correctness of specification dataset relative to schema;
- `Validator-conformant` - correctness of validator implementation behavior.

### 14.1. Schema Conformance (`Schema-conformant`)

A schema is conformant to the standard if all mandatory requirements of this standard applicable to schema are met, including:

- requirements for top-level structure and entity type descriptions (Sections 4 and 5);
- requirements for `entity_ref` reference fields and `ref` context (Section 6);
- requirements for `id_prefix` (Section 7);
- requirements for `path_pattern` (Section 8);
- requirements for supported placeholders and their semantics (Section 9);
- requirements for `meta` block and `meta.fields[].schema` field (Section 12);
- requirements for `content.sections` block (Section 13).

### 14.2. Specification Dataset Conformance (`Dataset-conformant`)

A specification dataset is conformant to the standard and schema if:

- each entity implementation is unambiguously classified by type under rules of Section 5.3 and passes validation against that type;
- uniqueness requirements are met (`slug` within entity type, numeric `id` suffix within entity type, full `id` globally across all entity types);
- paths, identifiers, metadata, `entity_ref` referential integrity, and required sections are valid.

### 14.3. Validator Conformance (`Validator-conformant`)

A validator implementation is conformant to the standard if it:

- checks all mandatory requirements of this standard applicable to validator;
- documents implementation profile (Section 6.5);
- produces diagnostics according to rules in Section 14.4.

### 14.4. Diagnostic Message Classes

Validator MUST use unified diagnostic classes:

- `SchemaError` - violation of requirements for schema structure and semantics;
- `InstanceError` - violation of requirements for a specific entity implementation or specification dataset;
- `ProfileError` - violation of implementation profile requirements or inability to deterministically apply profile.

For each diagnostic, validator MUST provide at minimum:

- diagnostic message class;
- violation description text;
- reference to section/subsection of this standard whose requirement is violated.

Normative mapping of violation types to diagnostic classes:

- `SchemaError`:
  - violations of schema top-level structure and `entity.<type_name>` structure (Sections 4 and 5);
  - violations of rules for `id_prefix`, `path_pattern`, placeholders, and `required_when`/`when` expressions (Sections 7, 8, 9, 11.6);
  - violations of `meta.fields[].schema` constraints, including incompatible `enum` types, use of unsupported `type: object`, and other Section 12.2 violations;
  - violations of closed-world key model for normative schema objects (Sections 4, 5, 8, 12, 13).
- `InstanceError`:
  - violations of built-in implementation fields (`type`, `id`, `slug`, `created_date`, `updated_date`) and other validation rules for a specific implementation (Section 11);
  - `meta.fields` and `content.sections` violations at implementation data level (Sections 12.3 and 13.2);
  - `entity_ref` referential integrity violations at implementation data level (Sections 6.3 and 12.3);
  - inability to classify implementation type due to missing/invalid `type` field or inconsistency between `type` and `id` (Sections 5.3 and 11.1);
  - use of strict `eq`/`in` operators with `missing` operand during expression evaluation (Section 11.6).
- `ProfileError`:
  - absence or incompleteness of required implementation profile (Section 6.5);
  - inability to deterministically apply documented implementation profile when validating a dataset.

## 15. Recommendations for Validator Implementations

It is recommended to separate checks into two levels:

- schema structural checks (for example, JSON Schema);
- semantic checks (cross-references, uniqueness, validation of `path_pattern.cases[].when`, `entity_ref` resolution, normalization of `content.sections`).

Additionally, it is recommended to explicitly fix in validator implementation:

- path normalization rule;
- YAML parser used and its typing mode;
- `entity_ref` reference resolution mechanism.

This ensures portability and tool compatibility across programming languages and organizations.
