# Specification Description Standard

## Document Status

Status of this revision: `Draft`.
Last updated: `2026-02-28`.

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
- `Parent` (`parent`) - the actual parent entity of an instance.
- `$root` - a special top-level pseudo-parent.
- `Pattern` (`pattern`) - a string with placeholders used for validation.
- `Prefix` (`prefix`) - a fixed string at the beginning of a value used as part of a validation rule.
- `Section label` (`anchor label`) - anchor identifier value without the `#` prefix (for example, `goal`).
- `Label reference` - a reference with the `#` prefix (for example, `#goal`).
- `Validator` - an implementation that checks schema and/or specification dataset conformance to this standard.
- `Implementation profile` - a documented set of validator parameters that defines at minimum: (1) the way to deterministically identify the actual parent for each entity implementation; (2) rules for computing `parent:*` when the actual parent is `$root`.

## 4. General Schema Data Model

A schema MUST contain:

- `version` - schema format version (string in `MAJOR.MINOR.PATCH` format);
- `entity` - mapping of entity type descriptions.

Top-level structure example (informative):

```yaml
version: 0.0.1
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

- `parent`
- `meta`
- `content`

Other fields in `entity.<type_name>` are not defined by this version of the standard.
If an implementation supports extensions, such fields MUST be processed as extensions and MUST NOT change semantics of standard fields.

## 6. `parent` Field Rules

### 6.1. Allowed Values

If specified, `parent` MUST be either a string or a non-empty list of strings of allowed parent types.
If `parent` is specified as a string, it is treated as a single-item list.
Further in this text, `parent` list means normalized `parent` list (after this rule is applied).
Normalized `parent` list MUST be non-empty and MUST NOT contain duplicates.
Each value in normalized `parent` list MUST be either `$root` or the name of an existing entity type (a key in `entity`).

Example (informative):

```yaml
parent: domain
```

```yaml
parent: [$root, domain]
```

### 6.2. Default Value

If `parent` is not specified, only `$root` is considered an allowed parent.

### 6.3. Cardinality

For each specific entity implementation, the actual parent MUST be exactly one.

Example entry (informative):

```yaml
parent: [domain, service]
```

means "one of the specified types is allowed", not multiple inheritance.

### 6.4. Determining the Actual Parent

This standard requires that for each entity implementation, a validator can unambiguously determine the actual parent (or `$root`) according to implementation profile rules.

The specific mechanism for determining the actual parent (for example, an external relation index, repository traversal rules, an additional implementation field) is defined by the implementation profile.

Regardless of mechanism, the validator MUST apply it consistently across the whole specification dataset.

### 6.5. Minimum Required Contract of the Implementation Profile

Each validator implementation MUST explicitly document the implementation profile it uses.

At minimum, the implementation profile MUST define:

- a deterministic rule for determining the actual parent (or `$root`) for each entity implementation;
- a rule for the case where actual parent is `$root`: for each placeholder `{parent:slug}` and `{parent:dir_path}`, the profile either defines an unambiguous string value or explicitly prohibits its use;
- repeatability guarantee: with identical schema/data input, actual parent selection MUST be the same.

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

Numeric suffix `N` in `"{id_prefix}-N"` is treated as a counter:

- unique within entity type;
- starting from `0`.

`N` MUST be interpreted as a non-negative integer in unsigned decimal notation.
This standard does not require sequence continuity (gaps are allowed).

## 8. `path_pattern` Field Rules

### 8.1. Purpose

`path_pattern` defines validation pattern for file (or document) path of an entity implementation.
Matching MUST be performed against the whole path, not a substring.

Path MUST be validated as a relative path from specification dataset root in POSIX form (`/` separator).
Comparison is performed on normalized path representation, where `./` prefix, empty segments, and `..` segments are not allowed.

### 8.2. Single Allowed Parent

If only one parent type is allowed for an entity type (including case where `parent` is omitted and defaults to `[$root]`), `path_pattern` MAY be a string or a single-entry mapping.

Example (informative):

```yaml
path_pattern: "docs/specs/domains/{slug}/index.md"
```

### 8.3. Multiple Allowed Parents

If multiple `parent` options are allowed for an entity type (normalized `parent` list has more than one value), `path_pattern` MUST be a mapping where:

- keys are values from normalized `parent` list (parent type names and/or `$root`);
- values are path patterns for corresponding parent type.

Key `$root` is allowed in `path_pattern` if `$root` is present in normalized `parent` list.

A pattern in `path_pattern` MUST be specified for each value from normalized `parent` list.
Extra keys in `path_pattern` mapping that are absent in normalized `parent` list are not allowed.

If `path_pattern` is specified as a mapping with a single allowed parent, mapping MUST contain exactly one key matching that parent type.

### 8.4. Pattern Selection During Validation

During validation, pattern corresponding to actual parent type of a specific entity implementation is selected.

### 8.5. Use of Metadata Placeholders in `path_pattern`

`path_pattern` additionally allows placeholders of form `{meta:field_name}`, where `field_name` is a field name from `meta.fields` of this entity type, only if all following conditions are met:

- for corresponding `meta.fields` element, `name` field is specified as a literal name (without placeholders) and is strictly equal to `field_name`;
- for each allowed actual parent value where selected `path_pattern` contains `{meta:field_name}`, combination of `required` and `required_on` parameters of corresponding `meta.fields` element MUST make the field required;
- corresponding `meta.fields` element specifies `schema.type` from set `string`, `integer`, `boolean`, `null`;
- corresponding `meta.fields` element specifies `schema.enum`.

Such placeholders in `path_pattern` denote actual value of `field_name` field from `YAML frontmatter` of specific entity implementation.
For path matching, this value is converted to string representation according to rules in Section 12.3.

If a field from `meta.fields` does not satisfy these constraints, use of `{meta:field_name}` placeholder in `path_pattern` is a `SchemaError` class violation (Section 14.4).
Fields with dynamic `name` (containing `{parent:type}`) cannot be used through `{meta:...}` placeholders in `path_pattern`.

Example of valid schema (informative):

```yaml
entity:
  feature:
    parent: [service]
    id_prefix: "FEAT"
    path_pattern:
      service: "{parent:dir_path}/features/{meta:status}/{created_date}-{slug}.md"
    meta:
      fields:
        - name: status
          required: true
          schema:
            type: string
            enum: [draft, testing, actual, deprecated]
```

## 9. Placeholders

### 9.1. Supported Set

The standard defines two classes of placeholders used in patterns and string values of metadata rules:

- built-in placeholders (listed below);
- metadata placeholders in `path_pattern` (by rules of Section 8.5).

`<...>` notation in this standard text is used only as a metavariable for structure description (for example, `entity.<type_name>`).
`{...}` notation is used only for placeholders subject to substitution during validation.

Built-in placeholders:

- `{id}`
- `{slug}`
- `{created_date}`
- `{parent:type}`
- `{parent:id}`
- `{parent:slug}`
- `{parent:dir_path}`

Metadata placeholders use `meta` namespace and have form `{meta:field_name}`.

Arbitrary placeholders are not supported.
Any substring of form `{...}` that does not match a supported placeholder is a `SchemaError` class violation (Section 14.4).

### 9.2. `parent:*` Rules

- `{parent:type}`, `{parent:id}`, `{parent:slug}`, and `{parent:dir_path}` MUST be computed from actual parent of a specific entity implementation.
- If multiple parent types are allowed, only data of the actual parent is used.
- If actual parent equals `$root`, use of `{parent:id}` is not allowed.
- If actual parent equals `$root`, use of `{parent:slug}` and `{parent:dir_path}` is allowed only if their value is unambiguously defined by implementation profile (Section 6.5).

`{parent:type}` denotes type name of actual parent. If actual parent equals `$root`, `{parent:type}` value is `$root`.

`{parent:id}` denotes value of `id` field of actual parent.

`{parent:slug}` denotes value of `slug` field of actual parent.

`{parent:dir_path}` denotes path to directory of parent implementation relative to specification dataset root in POSIX form, without trailing `/`.

### 9.3. Repeated Placeholder Use

If the same placeholder is used more than once in a pattern, all its occurrences MUST match the same value.

## 10. Required Fields of Any Entity Implementation

The following fields are built-in fields of an entity implementation and MUST NOT be re-declared as built-in schema requirements. Fields `id`, `slug`, `created_date`, and `updated_date` are required for any entity implementation; field `parent_id` is conditionally required by rules of Section 11.4:

- `id`
- `slug`
- `created_date`
- `updated_date`
- `parent_id` (required if actual parent is not `$root`)

## 11. Validation Rules for Entity Implementation Fields

For a Markdown entity implementation (a `.md` file), `YAML frontmatter` MUST be present at the beginning of the file.
Built-in fields (`id`, `slug`, `created_date`, `updated_date`, `parent_id`) and metadata fields validated by `meta.fields` rules are specified as fields of one YAML mapping (`mapping`) in this block.
This standard does not require presence of `meta` block/key itself in entity implementation.

For Markdown implementation, `YAML frontmatter` MUST start at the first line of the file with `---` separator and contain one top-level YAML mapping (`mapping`).
`YAML frontmatter` MUST end with a separate `---` or `...` separator line before document body starts.
Duplicate keys in `YAML frontmatter` (including nested YAML mappings) are not allowed; if the YAML parser used allows them by default, validator MUST enable duplicate-key prohibition mode or perform equivalent additional validation.
Metadata type validation MUST be performed after YAML parsing, without implicit type conversion by validator.

### 11.1. `id` Field

- required;
- MUST match format `"{id_prefix}-N"` of its entity type, where `N` is a non-negative integer in unsigned decimal notation;
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

### 11.4. `parent_id` Field

- if actual parent of a specific implementation is not `$root`, `parent_id` field is required;
- if actual parent of a specific implementation is `$root`, `parent_id` field MUST be absent;
- `parent_id` value MUST be a string;
- if actual parent of a specific implementation is not `$root`, `parent_id` value MUST strictly equal `id` field value of actual parent.

### 11.5. General Requiredness Model (`required`, `required_on`)

This model applies to `meta.fields[]` (Section 12) and `content.sections[]` (Section 13).

If specified, `required` field MUST be a boolean value.
If specified, `required_on` field MUST be either a non-empty string or a non-empty list of non-empty strings of allowed parent types.
If `required_on` is specified as a string, it is treated as a single-item list.
Further in this text, `required_on` list means normalized `required_on` list (after applying this rule).
Normalized `required_on` list MUST NOT contain duplicates.
Empty `required_on` value (empty string or empty list) is not allowed.
Each value in normalized `required_on` list MUST belong to normalized `parent` list of this entity type (Section 6).
If `required_on` is not specified, normalized `required_on` list is considered empty.

Simultaneous use of `required` and `required_on` is allowed.
If `required` is explicitly specified, its effective value equals specified boolean value.
If `required` is not specified, its effective value equals `true` when normalized `required_on` list is empty, and equals `false` when normalized `required_on` list is non-empty.

For a specific implementation, an element is considered required if at least one of conditions holds:

- effective `required` value equals `true`;
- actual parent belongs to normalized `required_on` list.

In all other cases, element is considered optional.

## 12. `meta` Rules

### 12.1. `meta.fields` Field

If `meta` block is specified, it may contain `fields` - a list of metadata fields for this entity type.
`meta` in schema describes `YAML frontmatter` fields of entity implementation (Markdown document).
These fields are specified at top level in `YAML frontmatter` and are not represented as a `meta` block in the implementation itself.

If `fields` is specified, it MUST be a list of objects with unique `name` values in source schema (before substitutions).

Each `fields` element specifies:

- `name`
- `required` (optional; if omitted, effective value is determined by rules of Section 11.5)
- `required_on` (optional)
- `schema`

Other fields in `meta.fields` elements are allowed as extensions and MUST NOT change semantics of standard fields (`name`, `required`, `required_on`, `schema`).

Names of built-in fields (`id`, `slug`, `created_date`, `updated_date`, `parent_id`) MUST NOT be used in `meta.fields`.

`name` field MUST be a string. `name` may be specified either as a literal field name or as a string with `{parent:type}` placeholder, which allows requiring a field whose name depends on actual parent type (for example, `domain`, `service`).

For each allowed actual parent value of this entity type (including `$root`), `name` values after substitution MUST be pairwise distinct and MUST NOT match names of built-in fields.

`required` and `required_on` fields for `meta.fields[]` are interpreted by general requiredness model (Section 11.5).

`schema` field defines constraints for metadata field value and MUST be an object.
Supported `schema` keys are defined in Section 12.2.
Other keys in `schema` are allowed as extensions and MUST NOT change semantics of supported keys.

A field from `meta.fields` may be used as a placeholder in `path_pattern` (Section 8.5) only when `schema.enum` is present and only if `schema.type` equals `string`, `integer`, `boolean`, or `null`. Additional `required` and `required_on` constraints for such usage are defined in Section 8.5.

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

`type` key defines expected type of metadata value after parsing YAML/JSON representation (by actual value type, not by its string representation).
Supported `type` values:

- `string`
- `number`
- `integer`
- `boolean`
- `array`
- `object`
- `null`
- `entity_ref` (extension of this standard; absent in JSON Schema Draft 2020-12)

`type` validation MUST be strict, without implicit type conversion (for example, string `"1"` is not equal to number `1`).
For `type: integer`, value MUST be a number without fractional part.
Composite `type` forms (for example, `string|null`, `array<string>`) are not supported by this standard.
`type: entity_ref` defines a specialized reference type; its value in `YAML frontmatter` MUST be an `id` string validated by referential integrity rules (Section 12.3).

If specified, `const` key defines value that actual field value MUST strictly match (by value and type after YAML parsing).
If `const` has string type, placeholders from Section 9 are allowed in it (for example, `{parent:slug}`).
For `type: entity_ref`, if `const` is specified, `const` value MUST be an `id` string and is validated in addition to referential integrity rules.

Example of metadata field where name depends on parent type and value is fixed to parent `slug` (informative):

```yaml
- name: "{parent:type}"
  required: true
  schema:
    type: string
    const: "{parent:slug}"
```

If specified, `enum` key MUST be a non-empty list.
Actual field value MUST strictly match at least one `enum` item.
If an `enum` item has string type, placeholders from Section 9 are allowed in it.
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

For each `fields` element, validator MUST determine expected field name from `name`. If `name` contains `{parent:type}`, substitution is performed using actual parent of specific entity implementation.
If after substitution for a specific implementation, two or more `fields` elements produce the same expected name, this is a `SchemaError` class violation (Section 14.4).

For each `fields` element, field presence is validated by following rules:

- field is required if effective `required` value equals `true`;
- field is required if actual parent belongs to normalized `required_on` list;
- otherwise field is optional.

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
  - if `schema.refTypes` is not specified, reference MUST resolve to exactly one existing entity among all `entity` types by globally unique `id` (Section 11.1).

If field value is used in `path_pattern` through placeholder by rules of Section 8.5, validator MUST:

- first validate field by `meta.fields` rules (including `required`, `required_on`, `schema.type`, and `schema.enum`);
- then substitute actual value of this field into path template in string representation; for `string`, string value is used as is; for `integer`, decimal representation without surrounding quotes; for `boolean`, lowercase `true` or `false`; for `null`, `null`;
- compare result to implementation path by general `path_pattern` rules.

Additional `YAML frontmatter` fields (beyond built-in fields and `meta.fields` fields) are allowed and are not an error.

## 13. `content` Rules

### 13.1. `content.sections` Field

`content.sections` defines list of sections to validate in document body.
If specified, `content.sections` list MUST be non-empty.

Each `content.sections` element MUST be an object with following fields:

- `name` (required) - non-empty string without `#` prefix; defines section label (`anchor label`);
- `required` (optional; if omitted, effective value is determined by rules of Section 11.5) - boolean value defining baseline requiredness of section;
- `required_on` (optional) - non-empty string or non-empty list of non-empty strings of allowed parent types for which section is additionally required;
- `title` (optional) - string or non-empty list of non-empty strings without duplicates; defines allowed section heading text.

`name` values within `content.sections` MUST NOT repeat.

If `title` is specified as a string, for validation purposes it is treated as a single-item list.

`required` and `required_on` fields for `content.sections[]` are interpreted by general requiredness model (Section 11.5).

### 13.2. Validation Semantics

Section validation is performed by presence of section label (`anchor label`), not by exact heading text.

Label in `content.sections[].name` is specified without `#` prefix (for example, `goal`) and compared case-sensitively.
Section labels within one document MUST be unique; repetition of the same label is an `InstanceError` class violation (Section 14.4).

For each `content.sections` element, validator MUST apply following rules:

- if effective `required` value equals `true`, section with `name` label is required;
- if actual parent belongs to normalized `required_on` list, section with `name` label is required;
- if effective `required` value equals `false` and actual parent does not belong to normalized `required_on` list, absence of section with `name` label is not an error;
- if `title` is specified and section is found, heading text of this section MUST strictly match at least one allowed `title` value (case-sensitive comparison).

Example of allowed heading for `goal` section (informative):

```md
## [Goal](#goal)
```

A section is considered found if the required label is present.

For Markdown implementation, validator MUST at minimum support extracting label from link of form `[...](#label)` inside heading line.
When this basic syntax is used, heading text for `title` validation MUST be extracted from link text part (`...`).
Implementation MAY support additional syntaxes for extracting label and heading text, but MUST NOT change result for the specified basic syntax.

## 14. Conformance to the Standard

### 14.0. Conformance Classes

This standard defines three conformance classes:

- `Schema-conformant` - correctness of schema itself;
- `Dataset-conformant` - correctness of specification dataset relative to schema;
- `Validator-conformant` - correctness of validator implementation behavior.

### 14.1. Schema Conformance (`Schema-conformant`)

A schema is conformant to the standard if all mandatory requirements of this standard applicable to schema are met, including:

- requirements for top-level structure and entity type descriptions (Sections 4 and 5);
- requirements for `parent` and determining actual parent (Section 6);
- requirements for `id_prefix` (Section 7);
- requirements for `path_pattern` (Section 8);
- requirements for supported placeholders and their semantics (Section 9);
- requirements for `meta` block and `meta.fields[].schema` field (Section 12);
- requirements for `content.sections` block (Section 13).

### 14.2. Specification Dataset Conformance (`Dataset-conformant`)

A specification dataset is conformant to the standard and schema if:

- each entity implementation passes validation against its type;
- uniqueness requirements are met (`slug` within entity type, numeric `id` suffix within entity type, full `id` globally across all entity types);
- paths, identifiers, metadata, and required sections are valid.

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

## 15. Recommendations for Validator Implementations

It is recommended to separate checks into two levels:

- schema structural checks (for example, JSON Schema);
- semantic checks (cross-references, uniqueness, matching of `path_pattern` keys to normalized `parent` list, markdown label parsing).

Additionally, it is recommended to explicitly fix in validator implementation:

- path normalization rule;
- YAML parser used and its typing mode;
- actual parent determination mechanism.

This ensures portability and tool compatibility across programming languages and organizations.
