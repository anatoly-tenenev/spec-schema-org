# Specification Description Standard

## Document Status

Status of this revision: `Draft`.
Last updated: `2026-03-26`.
Standard version: `0.0.5`.

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
- JMESPath Specification;
- CommonMark 0.31.2 (base Markdown syntax for headings and links; label form `<title> {#<label>}` is defined by this standard as a local extension, Section 13.2).

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
- `Reference field` (`entityRef`) - a metadata field defined with `schema.type: entityRef` and containing the `id` of another entity.
- `Reference resolution` (`resolve`) - an unambiguous mapping of a reference field value to a specific existing entity in the specification dataset.
- `Pattern` (`pattern`) - a string with literal fragments and/or `${expr}` interpolations used for validation.
- `Expression interpolation` (`expression interpolation`) - a fragment of the form `${expr}`, where `expr` is a JMESPath expression evaluated in the context of a specific entity implementation.
- `Prefix` (`prefix`) - a fixed string at the beginning of a value used as part of a validation rule.
- `Section label` (`anchor label`) - anchor identifier value without the `#` prefix (for example, `goal`).
- `Label reference` - a reference with the `#` prefix (for example, `#goal`).
- `Validator` - an implementation that checks schema and/or specification dataset conformance to this standard.
- `Implementation profile` - a documented set of validator parameters that defines at minimum: (1) path normalization rules; (2) `YAML frontmatter` parsing model (YAML version, scalar resolution schema, handling rules for non-standard/unknown tags); (3) deterministic rules for resolving `entityRef` references; (4) JMESPath implementation used or another guarantee of equivalent behavior.

## 4. General Schema Data Model

A schema MUST contain:

- `version` - schema format version (string in `MAJOR.MINOR.PATCH` format);
- `entity` - mapping of entity type descriptions.

A schema MAY contain:

- `description` - informative schema description (non-empty string) that does not affect validation result.

Allowed top-level schema keys in this version of the standard: `version`, `entity`, `description`.

Reserved keys of this standard and built-in implementation fields MUST use `camelCase`. This rule does not constrain the naming style of user-defined `entity.<typeName>`, `meta.fields.<fieldName>`, and `content.sections.<sectionName>` names, provided they satisfy the syntactic constraints of the standard.

A closed-world key model applies to normative schema objects:

- keys not explicitly listed as allowed in the corresponding section of this standard are not allowed;
- keys prefixed with `x-` are not allowed.

Duplicate keys in the YAML representation of a schema (including nested YAML mappings) are not allowed; if the YAML parser used allows them by default, validator MUST enable duplicate-key prohibition mode or perform an equivalent additional check.

Violation of the closed-world key model is a `SchemaError` class violation (Section 14.4).

Top-level structure example (informative):

```yaml
version: 0.0.5
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

Each `entity.<typeName>` element describes one entity type.

### 5.1. Required Entity Type Fields

- `idPrefix`
- `pathTemplate`

### 5.2. Optional Entity Type Fields

- `meta`
- `content`
- `description`

If specified, `description` MUST be a non-empty string and is informative (does not affect validation result).

Allowed keys in `entity.<typeName>`: `idPrefix`, `pathTemplate`, `meta`, `content`, `description`.
Any other key in `entity.<typeName>` is not allowed and is a `SchemaError` class violation (Section 14.4).

### 5.3. Deterministic Identification of Entity Implementation Type

For each entity implementation, validator MUST determine the entity type before applying `pathTemplate`, `meta`, and `content` rules.

Implementation type MUST be determined primarily by required `type` field from `YAML frontmatter`.
Using file path, directory name, or other heuristics for type selection is not allowed.

Type identification algorithm:

1. Read `type` field value from implementation `YAML frontmatter`.
2. If `type` is absent, is not a string, or does not match any `entity.<typeName>` key, this is an `InstanceError` class violation (Section 14.4).
3. Treat `type` value as implementation type.
4. Validate consistency of `id` with `entity.<type>.idPrefix` by rules of Section 7.
5. Any inconsistency between `id` value and `idPrefix` of selected type is an `InstanceError` class violation (Section 14.4).

## 6. Reference Field Rules (`entityRef`)

### 6.1. General Model

This standard does not define a special `parent` entity and does not reserve names of reference fields.
Relationships between entities are defined only through fields declared in `meta.fields` with `schema.type: entityRef`.

Reference field name is chosen by schema author according to domain semantics (for example, `owner`, `service`, `domainOwner`, `dependsOn`).

### 6.2. Reference Cardinality and Typing

A single `entityRef` field value defines a reference to one entity.
Multiple relationships are represented by separate fields or via arrays under general `schema.type: array` rules (Section 12.2).

Allowed target entity types are restricted by `schema.refTypes` (Sections 12.2 and 12.3).

### 6.3. Reference Resolution

For each present `entityRef` reference, validator MUST unambiguously determine target entity in the specification dataset.
Resolution is performed by string `id` value of the reference, taking `refTypes` constraints into account when present.

Regardless of index storage mechanism, validator MUST apply the same resolution rule across the whole specification dataset.

### 6.4. `refs` Context

Value of reference field `meta.<fieldName>` in `YAML frontmatter` remains the original `id` string specified in implementation data.

For each field `meta.<fieldName>` with `schema.type: entityRef`, `refs` namespace MAY be used in expressions and interpolation:

- `refs.<fieldName>`
- `refs.<fieldName>.id`
- `refs.<fieldName>.type`
- `refs.<fieldName>.slug`
- `refs.<fieldName>.dirPath`

Value of `refs.<fieldName>` is interpreted as follows:

- on successful resolution, an object with properties `id`, `type`, `slug`, `dirPath`;
- if the field is absent in `YAML frontmatter` or the reference cannot be resolved for a specific implementation, `null`.

`refs.<fieldName>.dirPath` means path to target entity file directory relative to specification dataset root in POSIX form, without trailing `/`.

### 6.5. Minimum Required Contract of the Implementation Profile

Each validator implementation MUST explicitly document the implementation profile it uses.

At minimum, the implementation profile MUST define:

- path normalization rule;
- `YAML frontmatter` parsing model: YAML version, scalar resolution schema, and handling rules for non-standard/unknown tags;
- deterministic resolution rule for `entityRef` references;
- JMESPath implementation used (library, version, or an equivalent behavioral specification);
- rule for computing `refs.<fieldName>.dirPath` for a resolved reference;
- repeatability guarantee: with identical schema/data input, `YAML frontmatter` parsing, resolution, and validation results MUST be the same.

## 7. `idPrefix` Field Rules

### 7.1. Purpose

`idPrefix` defines the prefix of the `id` field for implementations of the corresponding entity type.
The `id` field MUST have format `"{idPrefix}-N"`, where `N` is a non-negative integer in unsigned decimal notation.
Validation MUST be performed against the whole `id` value, not a substring.

### 7.2. Requiredness

`idPrefix` is required for each entity type.

### 7.3. `id` Format and Numeric Suffix

`idPrefix` MUST be a non-empty ASCII string and MUST fully match regular expression `^[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*$`.
`idPrefix` MUST NOT contain interpolations of the form `${...}`.
`idPrefix` values MUST be globally unique within `entity`; repeating `idPrefix` across different entity types is a `SchemaError` class violation (Section 14.4).

Numeric suffix `N` in `"{idPrefix}-N"` is treated as a counter:

- unique within entity type;
- starting from `0`.

`N` MUST be interpreted as a non-negative integer in unsigned decimal notation.
This standard does not require sequence continuity (gaps are allowed).

## 8. `pathTemplate` Field Rules

### 8.1. Purpose

`pathTemplate` defines a path validation template or a set of conditional path validation templates for an entity implementation file (or document).
Matching MUST be performed against the whole path, not a substring.

Path MUST be validated as a relative path from specification dataset root in POSIX form (`/` separator).
Comparison is performed on normalized path representation, where `./` prefix, empty segments, and `..` segments are not allowed.

### 8.2. Simple Form

`pathTemplate` MAY be a string. In this case, the string is treated as an unconditional path template.
`pathTemplate` string is a template string and MAY contain literal fragments and `${expr}` interpolations by rules of Sections 9 and 11.6.

Example (informative):

```yaml
pathTemplate: "docs/specs/domains/${slug}/index.md"
```

### 8.3. Conditional Form (`cases`)

Conditional `pathTemplate` logic is defined by cases (`cases`) using `if / else if / else` model.
Two container forms are supported:

- short form: `pathTemplate` is a list of cases;
- canonical form: `pathTemplate` is an object containing `cases` field.

Short form is syntactic sugar and is normalized to canonical form by rules of Section 8.4.
In canonical form, `pathTemplate` object MAY contain only `cases` key.

A case MUST be an object with following fields:

- `use` (required) - string path template;
- `when` (optional) - boolean value or `${expr}` expression by rules of Section 11.6.

Other fields in a case are not allowed and are a `SchemaError` class violation (Section 14.4).

Requirements for case list:

- list MUST be non-empty;
- there MUST be exactly one unconditional case (case without `when`);
- unconditional case MUST be the last list element.

For canonical form:

- `cases` is required and MUST satisfy requirements above;
- other `pathTemplate` object fields are not allowed and are a `SchemaError` class violation (Section 14.4).

### 8.4. Normalization and Template Selection During Validation

Before evaluating conditions, validator MUST normalize `pathTemplate` to internal canonical form `pathTemplate.cases`:

1. If `pathTemplate` is a string, it is equivalent to `pathTemplate: { cases: [{ use: "<string>" }] }`.
2. If `pathTemplate` is a list, it is equivalent to `pathTemplate: { cases: <that_list> }`.
3. If `pathTemplate` is an object, `cases` field is used.

After normalization, validator MUST:

1. evaluate `cases[]` left to right;
2. choose `use` of first case that satisfies one of conditions:
   - `when` field is absent (unconditional case, `else` branch);
   - `when` field is present and evaluates to a truth-like value by rules of Section 11.6.

### 8.5. Using Interpolations in `pathTemplate`

Only `${expr}` interpolations allowed for context `pathTemplate.cases[].use` (Section 9.4) are permitted in template strings `pathTemplate.cases[].use`.
Each `expr` is evaluated by rules of Section 11.6 in context of specific entity implementation.

If the selected template contains an interpolation that cannot be evaluated for a specific implementation or does not produce a value compatible with string interpolation under Section 9.3, this is an `InstanceError` class violation (Section 14.4).

Example of valid schema (informative, canonical form):

```yaml
entity:
  feature:
    idPrefix: "FEAT"
    pathTemplate:
      cases:
        - when: ${refs.owner}
          use: "${refs.owner.dirPath}/features/${createdDate}-${slug}.md"
        - use: "spec/features/${slug}.md"
    meta:
      fields:
        owner:
          required: false
          schema:
            type: entityRef
            refTypes: [service]
```

Equivalent short form (informative):

```yaml
entity:
  feature:
    idPrefix: "FEAT"
    pathTemplate:
      - when: ${refs.owner}
        use: "${refs.owner.dirPath}/features/${createdDate}-${slug}.md"
      - use: "spec/features/${slug}.md"
```

### 8.6. Evaluation of Selected `pathTemplate`

After selecting a case by rules of Section 8.4, validator MUST evaluate only `use` string of the selected case.
Unselected cases are not interpreted on the level of a specific implementation.

For each `${expr}` interpolation in the selected `use` string, validator MUST:

1. evaluate `expr` in context of specific implementation;
2. verify that result is compatible with string interpolation by rules of Section 9.3;
3. substitute string representation of result into the template.

If result of expression is `null`, or has type `array` or `object`, this is an `InstanceError` class violation (Section 14.4).

If validator can deterministically establish that a `${expr}` expression in `use` string is invalid or cannot produce a value compatible with string interpolation in this context, it MAY report this as a `SchemaError` (Section 14.4) already at the schema-validation stage.

## 9. `${expr}` Interpolation

### 9.1. General Model

This standard uses a unified notation for expressions and substitutions: `${expr}`, where `expr` is a JMESPath expression by the rules of Section 11.6.

The `<...>` notation in this standard text is used only as a metavariable for structure description (for example, `entity.<typeName>`).
The `${...}` notation is used only for expressions and interpolations to be evaluated during validation.
Plain `{...}` notation has no special semantics unless explicitly stated otherwise by this standard.

In positions where standard expects a scalar expression (for example, `required` and `when`), the value MUST be either a YAML boolean or a string consisting entirely of a single `${expr}` interpolation.
In string templates, any number of `${expr}` interpolations MAY be mixed with literal text.

Each `${...}` substring in a context that supports interpolation MUST contain a syntactically valid JMESPath expression.
Interpolation boundaries MUST be determined with regard to JMESPath syntax rather than by simply searching for the first `}` character.
If validator can deterministically establish that a `${expr}` interpolation is syntactically invalid or uses an expression that is definitely incompatible with the context, this is a `SchemaError` class violation (Section 14.4).

In string values of validation rules where interpolation is not allowed by this standard, the presence of a `${...}` substring is a `SchemaError` class violation (Section 14.4).

### 9.2. `refs.*` Rules

`refs.<fieldName>` is interpreted by the rules of Section 6.4.
On successful reference resolution, `refs.<fieldName>.id`, `refs.<fieldName>.type`, `refs.<fieldName>.slug`, and `refs.<fieldName>.dirPath` are evaluated as properties of the `refs.<fieldName>` object.

In `${expr}` expressions, both `refs.<fieldName>` as a whole and individual `refs.<fieldName>.<part>` properties MAY be used.
In string interpolation, only expressions that actually produce a string-compatible value by the rules of Section 9.3 are allowed.

### 9.3. Converting an Interpolation Result to a String

For each `${expr}` interpolation in a string context, result of expression MUST have one of the following types:

- `string`
- `number`
- `boolean`

Conversion to string is performed as follows:

- `string` - the value is used as is;
- `number` - a deterministic decimal string representation is used according to rules of the implementation profile;
- `boolean` - the string `true` or `false` is used.

Value `null`, as well as values of types `array` and `object`, are not allowed in string interpolation and are an `InstanceError` class violation (Section 14.4).

### 9.4. Interpolation Usage Contexts

`${expr}` interpolation is allowed only in the following string contexts:

- `pathTemplate.cases[].use`;
- `meta.fields.<fieldName>.schema.const` (only when `const` has string type);
- `meta.fields.<fieldName>.schema.enum[*]` (only for string `enum` items).

If, in one of the contexts in this section, a `${expr}` interpolation cannot be evaluated for a specific implementation or produces a result incompatible with string interpolation, this is an `InstanceError` class violation (Section 14.4).

## 10. Required Fields of Any Entity Implementation

The following fields are built-in fields of an entity implementation and MUST NOT be re-declared as built-in schema requirements. Fields `type`, `id`, `slug`, `createdDate`, and `updatedDate` are required for any entity implementation:

- `type`
- `id`
- `slug`
- `createdDate`
- `updatedDate`

## 11. Validation Rules for Entity Implementation Fields

For a Markdown entity implementation (a `.md` file), `YAML frontmatter` MUST be present at the beginning of the file.
Built-in fields (`type`, `id`, `slug`, `createdDate`, `updatedDate`) and metadata fields validated by `meta.fields` rules are specified as fields of one YAML mapping (`mapping`) in this block.
This standard does not require presence of `meta` block/key itself in entity implementation.

For Markdown implementation, `YAML frontmatter` MUST start at the first line of the file with `---` separator and contain one top-level YAML mapping (`mapping`).
`YAML frontmatter` MUST end with a separate `---` or `...` separator line before document body starts.
Duplicate keys in `YAML frontmatter` (including nested YAML mappings) are not allowed; if the YAML parser used allows them by default, validator MUST enable duplicate-key prohibition mode or perform equivalent additional check.
`YAML frontmatter` parsing MUST follow YAML 1.2.2 with the typing model fixed in implementation profile (Section 6.5).
Metadata type validation MUST be performed against this parsing result, without implicit type conversion by validator.

Built-in `type` field rules:

- field is required;
- value MUST be a string;
- value MUST match one of `entity.<typeName>` keys in schema.

Allowed `YAML frontmatter` keys for a specific implementation: built-in fields (`type`, `id`, `slug`, `createdDate`, `updatedDate`) and fields declared in `meta.fields` of corresponding entity type.
Any other `YAML frontmatter` key is an `InstanceError` class violation (Section 14.4).

### 11.1. `id` Field

- required;
- MUST match format `"{idPrefix}-N"` for the type specified in `type` field, where `N` is a non-negative integer in unsigned decimal notation;
- MUST be globally unique across the whole specification dataset (among all entity types).

### 11.2. `slug` Field

- required;
- MUST be unique within entity type;
- MUST match regular expression `^[a-z0-9]+(?:-[a-z0-9]+)*$` (validation against whole `slug` value).

### 11.3. `createdDate` and `updatedDate` Fields

- required;
- MUST be in RFC 3339 `full-date` format (`YYYY-MM-DD`), which is a restricted profile of ISO 8601;
- MUST be calendar-valid dates (for example, `3026-02-30` is invalid).

If a value is used in a path template (for example, `${createdDate}`), comparison MUST be strict (literal match, without format normalization).

### 11.4. Reference Fields (`entityRef`)

For each field declared in `meta.fields` with `schema.type: entityRef`, following rules apply:

- if key is absent and field is not required by Section 11.5, this is allowed;
- when the key is present, its value MUST be an `id` string;
- key absence and `null` value are not equivalent: `null` is treated as a present `null`-typed value and violates the string type requirement.

Reference resolution and `refTypes` checks are defined in Section 12.3.

### 11.5. General Requiredness Model (`required`)

This model applies to each field description in `meta.fields` (Section 12) and to each section description in `content.sections` (Section 13).

If specified, `required` field MUST be either a boolean value or a `${expr}` expression by rules of Section 11.6.

If `required` is omitted, its effective value is `true`.
If `required` is specified as a boolean value, this value is used.
If `required` is specified as a `${expr}` expression, it is evaluated for specific implementation by rules of Section 11.6.

For a specific implementation, an element is considered required if effective `required` value is truth-like.
In all other cases, element is considered optional.

Examples of requiredness interpretation (informative):

```yaml
meta:
  fields:
    owner:
      schema:
        type: string
```

For `owner`, `required` key is absent, so the field is required by default (`required = true`).

```yaml
meta:
  fields:
    status:
      schema:
        type: string
        enum: [draft, testing, actual, deprecated]
    testFile:
      required: ${meta.status == 'testing' || meta.status == 'actual'}
      schema:
        type: string
```

For `testFile`, the field is required only when `${meta.status == 'testing' || meta.status == 'actual'}` expression evaluates to a truth-like value.

### 11.6. `${expr}` Expressions

`${expr}` expressions use JMESPath syntax and semantics.
This standard does not introduce a special expression language on top of JMESPath.

The same expression model is used for `required` and `pathTemplate.cases[].when`.
If `pathTemplate.cases[].when` is specified, it MUST be either a boolean value or a `${expr}` expression by this section.

Evaluation context for a specific entity implementation MUST contain:

- built-in top-level fields: `type`, `id`, `slug`, `createdDate`, `updatedDate`;
- object `meta` containing the built-in fields and the fields described in `meta.fields`;
- object `refs` containing values by rules of Section 6.4 for `entityRef` fields.

For `meta.<fieldName>` fields with `schema.type: entityRef`, the value in expressions is treated as the original `id` string from `YAML frontmatter`.
In expressions under this standard, an absent value and a `null` value are not distinguished: if an expression cannot obtain a value at the specified path, result is treated as `null` by rules of JMESPath.

Truth-like / false-like semantics are determined by the rules of JMESPath.
In particular, `false`, `null`, the empty string, the empty array, and the empty object are considered false-like; all other values are considered truth-like.
Accordingly, `required` and `when` do not have to evaluate specifically to `boolean`: they MAY return any JMESPath value, which is then interpreted according to JMESPath truthiness rules.

If validator can deterministically establish that `${expr}` expression:

- is syntactically invalid;
- uses a context reference incompatible with given schema;
- or cannot be evaluated correctly in given context,

it MAY report this as a `SchemaError` (Section 14.4) already at the schema-validation stage.

Example of valid `when` for `pathTemplate.cases` with an optional field (informative):

```yaml
entity:
  feature:
    idPrefix: "FEAT"
    pathTemplate:
      cases:
        - when: ${meta.owner == 'SRV-1'}
          use: "services/${meta.owner}/${slug}.md"
        - use: "features/${slug}.md"
    meta:
      fields:
        owner:
          required: false
          schema:
            type: string
            enum: [SRV-1, SRV-2]
```

Example of conditional requiredness of a field (informative):

```yaml
meta:
  fields:
    status:
      schema:
        type: string
        enum: [draft, testing, actual, deprecated]
    testFile:
      required: ${meta.status == 'testing' || meta.status == 'actual'}
      schema:
        type: string
```

Example of checking resolved reference via `refs.<field>` (informative):

```yaml
meta:
  fields:
    owner:
      required: false
      schema:
        type: entityRef
        refTypes: [service]
    ownerBinding:
      required: ${refs.owner.type == 'service'}
      schema:
        type: string
```

## 12. `meta` Rules

### 12.1. `meta.fields` Field

If `meta` block is specified, it MAY contain `fields` - a mapping of metadata field descriptions for this entity type.
`meta` in schema describes `YAML frontmatter` fields of entity implementation (Markdown document).
These fields are specified at top level in `YAML frontmatter` and are not represented as a `meta` block in the implementation itself.

Allowed keys of `meta` object: `fields`.
Other keys of `meta` object are not allowed and are a `SchemaError` class violation (Section 14.4).

If `fields` is specified, it MUST be a YAML mapping.
Each key of `meta.fields` defines the literal field name, and the value under that key defines the field description.
Order of keys in `meta.fields` does not affect validation result.

Field name in `meta.fields`:

- MUST be a non-empty ASCII string and MUST fully match regular expression `^[A-Za-z_][A-Za-z0-9_-]*$`;
- MUST NOT match the names of built-in fields `type`, `id`, `slug`, `createdDate`, `updatedDate`.

For each element `meta.fields.<fieldName>`, the following are specified:

- `required` (optional; if omitted, effective value is determined by rules of Section 11.5)
- `description` (optional; non-empty string, informative field)
- `schema`

If specified, `description` does not affect validation result.

Allowed keys of `meta.fields.<fieldName>`: `required`, `description`, `schema`.
Other keys are not allowed and are a `SchemaError` class violation (Section 14.4).
Key `name` inside `meta.fields.<fieldName>` is not allowed and is a `SchemaError` class violation (Section 14.4).

`required` field for `meta.fields.<fieldName>` is interpreted by the general requiredness model (Section 11.5).

`schema` field defines constraints for metadata field value and MUST be an object.
Supported `schema` keys are defined in Section 12.2.
Other keys in `schema` are not allowed and are a `SchemaError` class violation (Section 14.4).

A field from `meta.fields` MAY be used in `${expr}` expressions by rules of Section 11.6.
In string interpolation contexts (Section 9.4), the following are allowed:

- `${meta.<fieldName>}` - only if `schema.type` equals `string`, `number`, `integer`, `boolean`, or `entityRef`;
- `${refs.<fieldName>.<part>}` - only if `schema.type` equals `entityRef`.

### 12.2. `schema` Field

`schema` field uses a restricted subset of JSON Schema Draft 2020-12 (Core + Validation) to validate metadata field values.
Keywords listed in this section have semantics of the specified JSON Schema dialect unless otherwise defined by this standard.
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

`type` key defines expected type of metadata value after parsing YAML/JSON representation with the typing model fixed in implementation profile (Section 6.5), that is, by actual value type rather than its string representation.
Supported `type` values:

- `string`
- `number`
- `integer`
- `boolean`
- `array`
- `null`
- `entityRef` (extension of this standard; absent in JSON Schema Draft 2020-12)

`type` validation MUST be strict, without implicit type conversion (for example, string `"1"` is not equal to number `1`).
For `type: integer`, value MUST be a number without fractional part.
Composite `type` forms (for example, `string|null`, `array<string>`) are not supported by this standard.
`type: entityRef` defines a specialized reference type; its value in `YAML frontmatter` MUST be an `id` string validated by referential integrity rules (Section 12.3).
Use of `type: object` is not supported in this version of the standard and is a `SchemaError` class violation (Section 14.4).

If specified, `const` key defines value that actual field value MUST strictly match (by value and type after YAML parsing).
If `const` has string type, only `${expr}` interpolations allowed for context `meta.fields.<fieldName>.schema.const` (Section 9.4) are permitted in it, for example `${refs.owner.slug}`.
If a `${expr}` interpolation in a string `const` cannot be evaluated for a specific implementation, this is an `InstanceError` class violation (Section 14.4).
For `type: entityRef`, if `const` is specified, `const` value MUST be an `id` string and is validated in addition to referential integrity rules.

Example of metadata field where value is fixed to `slug` of resolved referenced entity (informative):

```yaml
ownerSlug:
  required: ${refs.owner}
  schema:
    type: string
    const: "${refs.owner.slug}"
```

If specified, `enum` key MUST be a non-empty list.
Actual field value MUST strictly match at least one `enum` item.
If an `enum` item has string type, only `${expr}` interpolations allowed for context `meta.fields.<fieldName>.schema.enum[*]` (Section 9.4) are permitted in it.
If a `${expr}` interpolation in a string `enum` item cannot be evaluated for a specific implementation, this is an `InstanceError` class violation (Section 14.4).
If both `type` and `enum` are specified, each `enum` item MUST conform to `type`; otherwise this is a `SchemaError` class violation (Section 14.4).
For `type: entityRef`, if `enum` is specified, each `enum` item MUST be an `id` string and is validated in addition to referential integrity rules.

`items` key is allowed only with `type: array`.
`items` value MUST be a `schema` object and applies to each array element.

`minItems`, `maxItems`, and `uniqueItems` keys are allowed only with `type: array`.
`minItems` and `maxItems` MUST be non-negative integers; if both keys are specified, `minItems <= maxItems` MUST hold.
`uniqueItems`, if specified, MUST be a boolean value.

`refTypes` key is allowed only with `type: entityRef`.

If specified, `refTypes` key MUST be a non-empty list of strings without duplicates.
Each `refTypes` item MUST reference an existing entity type (a key in `entity`).

Example describing an array of strings (informative):

```yaml
tags:
  schema:
    type: array
    items:
      type: string
    minItems: 1
    uniqueItems: true
```

### 12.3. Validation Semantics

For each element `meta.fields.<fieldName>`, validator MUST use the literal field name from key name `fieldName`.

For each element `meta.fields.<fieldName>`, field presence is validated by the following rules:

- field is required if effective `required` value for a specific implementation is truth-like;
- in all other cases field is optional;
- absence of a required field is an `InstanceError` class violation (Section 14.4).

`schema` validation is performed for each present field from `meta.fields` by following rules:

- actual value MUST conform to `schema.type`;
- if `schema.const` is specified, actual value MUST strictly match it; for string `schema.const`, comparison is performed after evaluating `${expr}` interpolations for specific entity implementation;
- if `schema.enum` is specified, actual value MUST strictly match at least one `schema.enum` item; for string `schema.enum` items, comparison is performed after evaluating `${expr}` interpolations for specific entity implementation;
- if `schema.type` equals `array` and `schema.items` is specified, each array element MUST be validated recursively against `schema.items`;
- if `schema.type` equals `array` and `schema.minItems` is specified, array length MUST be at least `minItems`;
- if `schema.type` equals `array` and `schema.maxItems` is specified, array length MUST be at most `maxItems`;
- if `schema.type` equals `array` and `schema.uniqueItems: true` is specified, array elements MUST be pairwise distinct under strict value comparison;
- if `schema.type` equals `entityRef`, actual value MUST be an `id` string of an existing entity:
  - with `schema.refTypes`, reference MUST resolve to exactly one existing entity of one of the specified types and match the `id` format of that type;
  - if `schema.refTypes` is not specified, reference MUST resolve to exactly one existing entity among all `entity` types by globally unique `id` (Section 11.1);
  - on successful resolution, reference forms the `refs.<fieldName>.*` context by rules of Sections 6.4 and 9.2.

When validating `pathTemplate`, validator MUST:

- first validate metadata by `meta.fields` rules (including `required`, `schema.type`, `schema.const`, and `schema.enum`);
- then evaluate the selected path template by the rules of Sections 8.5, 8.6, 9, and 11.6;
- compare result with implementation path by general `pathTemplate` rules.

Additional `YAML frontmatter` fields (beyond the built-in fields and the `meta.fields` fields) are not allowed and are an `InstanceError` class violation (Section 14.4).

## 13. `content` Rules

### 13.1. `content.sections` Field

`content.sections` defines an ordered mapping of sections to validate in the document body.
If specified, `content.sections` MUST be a non-empty YAML mapping.
The order of keys in `content.sections` in the schema is the canonical section order for this entity type.

Allowed keys of `content` object: `sections`.
Other keys of `content` object are not allowed and are a `SchemaError` class violation (Section 14.4).

Each key of `content.sections` defines a section label (`anchor label`) and:

- MUST be a non-empty ASCII string and MUST fully match the regular expression `^[A-Za-z_][A-Za-z0-9_-]*$`.

Each element `content.sections.<sectionName>` MUST be an object with the following fields:

- `required` (optional; if omitted, effective value is determined by rules of Section 11.5) - boolean value or `${expr}` expression defining section requiredness;
- `title` (optional) - string or non-empty list of non-empty strings without duplicates; defines allowed text of the section heading;
- `description` (optional) - a non-empty string, informative field.

If specified, `description` does not affect validation result.

Allowed keys of `content.sections.<sectionName>`: `required`, `title`, `description`.
Other keys are not allowed and are a `SchemaError` class violation (Section 14.4).
Key `name` inside `content.sections.<sectionName>` is not allowed and is a `SchemaError` class violation (Section 14.4).

If `title` is specified as a string, for validation purposes it is treated as a single-item list.

`required` field for `content.sections.<sectionName>` is interpreted by the general requiredness model (Section 11.5).

### 13.2. Validation Semantics

Section validation is performed using a normalized section model and by presence of section label (`anchor label`), not by exact heading text.

Label in key `content.sections.<sectionName>` is specified without `#` prefix (for example, `goal`) and compared case-sensitively.
Section labels within one document MUST be unique; repetition of the same label is an `InstanceError` class violation (Section 14.4).

For Markdown implementation, validator MUST build an internal normalized section list in form `{ label, title }`.
`label` MUST be extracted only from explicit marking in one of the canonical syntaxes:

- a link in heading line: `[<title>](#<label>)`;
- a label attribute at end of heading line: `<title> {#<label>}`.

Form `<title> {#<label>}` is a local extension of this standard and MUST be recognized by validator as a textual heading-line suffix regardless of extension support in a specific Markdown parser.

Automatic derivation of label from heading text without an explicit marker is not allowed.

`title` text for validating `content.sections.<sectionName>.title` is extracted:

- for `[<title>](#<label>)` form, from link text part `<title>`;
- for `<title> {#<label>}` form, from heading text without `{#<label>}` suffix.

For each element `content.sections.<sectionName>`, validator MUST apply the following rules:

- if effective `required` value for a specific implementation is truth-like, the section with label `sectionName` is required;
- if effective `required` value for a specific implementation is false-like, absence of the section with label `sectionName` is not an error;
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

- `Schema-conformant` - correctness of the schema itself;
- `Dataset-conformant` - correctness of the specification dataset relative to the schema;
- `Validator-conformant` - correctness of validator implementation behavior.

### 14.1. Schema Conformance (`Schema-conformant`)

A schema is conformant to the standard if all mandatory requirements of this standard applicable to schema are met, including:

- requirements for top-level structure and entity type descriptions (Sections 4 and 5);
- requirements for `entityRef` reference fields and `refs` context (Section 6);
- requirements for `idPrefix` (Section 7);
- requirements for `pathTemplate` (Section 8);
- requirements for `${expr}` interpolations and their semantics (Section 9);
- requirements for `meta` block and `meta.fields.<fieldName>.schema` field (Section 12);
- requirements for `content.sections` block (Section 13).

### 14.2. Specification Dataset Conformance (`Dataset-conformant`)

A specification dataset is conformant to the standard and schema if:

- each entity implementation is unambiguously classified by type under rules of Section 5.3 and passes validation against that type;
- uniqueness requirements are met (`slug` within an entity type, numeric `id` suffix within an entity type, full `id` globally across all entity types);
- paths, identifiers, metadata, `entityRef` referential integrity, and required sections are valid.

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
  - violations of schema top-level structure and `entity.<typeName>` structure (Sections 4 and 5);
  - violations of rules for `idPrefix`, `pathTemplate`, `${expr}` interpolations, and `required`/`when` expressions (Sections 7, 8, 9, 11.5, 11.6);
  - using `${expr}` interpolation in a context where substitution is not supported, or using an expression definitely incompatible with that context (Sections 8.6, 9.1, 9.4, 11.6);
  - violations of `meta.fields.<fieldName>.schema` constraints, including incompatible `enum` types, use of unsupported `type: object`, and other Section 12.2 violations;
  - violations of closed-world key model for normative schema objects (Sections 4, 5, 8, 12, 13).
- `InstanceError`:
  - violations of built-in implementation fields (`type`, `id`, `slug`, `createdDate`, `updatedDate`) and other validation rules for a specific implementation (Section 11);
  - `meta.fields` and `content.sections` violations at implementation-data level (Sections 12.3 and 13.2);
  - inability to compute a context-allowed `${expr}` interpolation on a specific implementation (including `pathTemplate.cases[].use`, string `schema.const`, and string items of `schema.enum`) or obtaining a result incompatible with string interpolation;
  - `entityRef` referential integrity violations at implementation-data level (Sections 6.3 and 12.3);
  - inability to classify implementation by type due to a missing/invalid `type` field or inconsistency between `type` and `id` (Sections 5.3 and 11.1).
- `ProfileError`:
  - absence or incompleteness of required implementation profile (Section 6.5);
  - inability to deterministically apply documented implementation profile when validating a dataset.

## 15. Recommendations for Validator Implementations

It is recommended to separate checks into two levels:

- structural schema checks (for example, JSON Schema);
- semantic checks (cross-references, uniqueness, validation of `pathTemplate.cases[].when`, evaluation of `pathTemplate.cases[].use`, `entityRef` resolution, normalization of `content.sections`).

In addition to mandatory implementation-profile parameters (Section 6.5), it is recommended to explicitly define in validator implementation:

- path normalization rule;
- YAML parser used (library and version) and its typing mode;
- `entityRef` reference resolution mechanism;
- JMESPath implementation used (library and version, or an equivalent behavioral specification).

This ensures portability and tool compatibility across programming languages and organizations.
