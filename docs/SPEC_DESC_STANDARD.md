# Specification Description Standard

## Document Status

Status of this revision: `Draft`.
Standard author: Anatolii Tenenev.
Standard creation date: `2026-02-28`.
Last updated: `2026-08-30`.
Standard version: `0.0.9`.

Before release `1.0.0`, incompatible schema format changes (breaking changes) are allowed when increasing any version component.

## Normative Interpretation of Modality

In this standard, modal terms have the following normative force:

- `MUST` / `MUST NOT` - strictly mandatory requirement;
- `SHOULD` / `SHOULD NOT` - recommended requirement; deviation is allowed with documented rationale;
- `MAY` - permissible behavior at the implementation's discretion.

Only uppercase forms carry normative force. The same words in lowercase are used in their ordinary language meaning and have no normative force.

## Normative References

The following base specifications are used when applying this standard:

- ISO 8601-1:2019 (Date and time - Representations for information interchange - Part 1: Basic rules);
- RFC 3339 (Date and Time on the Internet: Timestamps);
- YAML 1.2.2 (YAML Ain't Markup Language, Version 1.2.2);
- JSON Schema Draft 2020-12 (Core and Validation);
- ECMA-262 (regular expression dialect for the `pattern` key, Section 12.2);
- JMESPath Specification;
- CommonMark 0.31.2 (recognition of headings and links in document body; label form `<title> {#<label>}` is defined by this standard as a local extension, Section 13.2).

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

The `schema` block (Section 12.2) MUST remain statically resolvable, that is, resolvable without access to data of a specific entity implementation. This allows using it as a model description source for tools that do not perform validation.

## 2. Scope

The standard applies to:

- schemas describing entity types and their implementations;
- identifier and path validation rules;
- requirements for metadata and document content.

Requirements of this standard address three objects: the schema, the specification dataset, and the validator.

Requirements for an individual document are formulated using the term `entity implementation`.
Requirements for a set of documents are formulated using the term `specification dataset`.

This revision defines the general schema format and requirements for Markdown entity implementations.
For other implementation formats, applying the same rules is allowed provided that the implementation provides an equivalent representation of metadata and content for validation.

The standard does not define:

- business meaning of entities;
- documentation rendering rules;
- the rule for determining specification dataset composition (Section 6.5);
- entity projection in read APIs (Section 6.4).

## 3. Terms and Definitions

- `Schema` - a YAML document that describes entity types and their validation rules.
- `Specification` - a general term for a document within a specification dataset.
- `Entity type` - a named category of entity implementations (for example, `domain`, `service`, `feature`). Type names are not fixed.
- `Entity implementation` - a concrete entity instance (document/object) of a given type. For a Markdown implementation (a `.md` file), `YAML frontmatter` MUST be located at the beginning of the file.
- `Specification dataset` - a set of entity implementations validated together.
- `Specification dataset root` - the directory relative to which entity implementation paths are matched. The root is a validation parameter provided by the validator implementation; the schema does not define it.
- `YAML frontmatter` - an initial metadata block of a Markdown document delimited by `---`/`...` separators.
- `YAML mapping` (`mapping`) - a top-level YAML key-value object.
- `Reference field` (`entityRef`) - a metadata field defined with `schema.type: entityRef` or with `schema.type: array` and `items.type: entityRef`, and containing the `id` of another entity.
- `Reference resolution` (`resolve`) - an unambiguous mapping of a reference field value to a specific existing entity in the specification dataset.
- `Pattern` (`pattern`) - a string with literal fragments and/or `${expr}` interpolations used for validation.
- `Expression interpolation` (`expression interpolation`) - a fragment of the form `${expr}`, where `expr` is a JMESPath expression evaluated in the context of a specific entity implementation.
- `Prefix` (`prefix`) - a fixed string at the beginning of a value used as part of a validation rule.
- `Section label` (`anchor label`) - anchor identifier value without the `#` prefix (for example, `goal`).
- `Label reference` - a reference with the `#` prefix (for example, `#goal`).
- `Section body` - the text fragment belonging to a section; boundaries are defined in Section 13.2.
- `Validator` - an implementation that checks schema and/or specification dataset conformance to this standard.
- `Implementation profile` - a documented set of validator parameters; the minimum required contract is defined in Section 6.5.

## 4. General Schema Data Model

A schema MUST contain:

- `version` - schema format version (string in `MAJOR.MINOR.PATCH` format);
- `entity` - mapping of entity type descriptions.

A schema MAY contain:

- `description` - informative schema description (non-empty string) that does not affect validation result.

Allowed top-level schema keys in this version of the standard: `version`, `entity`, `description`.

The `version` value MUST be a string. A non-string `version` value is a `SchemaError` class violation.

Reserved keys of this standard and built-in implementation fields MUST use `camelCase`. This rule does not constrain the naming style of user-defined `entity.<typeName>`, `meta.fields.<fieldName>`, and `content.sections.<sectionName>` names, provided they satisfy the syntactic constraints of the standard.

A closed-world key model applies to normative schema objects:

- keys not explicitly listed as allowed in the corresponding section of this standard are not allowed;
- keys prefixed with `x-` are not allowed.

Duplicate keys in the YAML representation of a schema (including nested YAML mappings) are not allowed; if the YAML parser used allows them by default, validator MUST enable duplicate-key prohibition mode or perform an equivalent additional check.

Top-level structure example (informative):

```yaml
version: "0.0.9"
description: "Base specification schema"
entity:
  domain: ...
  service: ...
```

### 4.1. Version Semantics

Semantics of `version`:

- changing `MAJOR` means an incompatible schema format change;
- changing `MINOR` means a backward-compatible schema format extension;
- changing `PATCH` means editorial clarifications and/or fixes that do not change the normative semantics of the schema format.

For versions with `MAJOR = 0` (`Draft` status), incompatible changes are allowed when increasing any version component, including `PATCH`.

### 4.2. Version Compatibility

Validator MUST reject the schema as a whole if the `version` declared in it is incompatible with the schema format version the validator supports. Partial schema validation MUST NOT be performed in this case: it produces diagnostics about disallowed keys for constructs that are allowed in the declared version.

Compatibility rule for `MAJOR >= 1`:

- differing `MAJOR` - incompatible;
- schema `MINOR` higher than supported - incompatible;
- schema `MINOR` lower than supported - compatible;
- differing `PATCH` - does not affect compatibility.

With `MAJOR = 0`, only an exactly matching version is compatible, including `PATCH`.

A version incompatibility diagnostic MUST include the declared version and the list of versions supported by the validator. Such a diagnostic SHOULD be assigned a code that distinguishes version incompatibility from schema structure violations.

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

### 5.3. Deterministic Identification of Entity Implementation Type

For each entity implementation, validator MUST determine the entity type before applying `pathTemplate`, `meta`, and `content` rules.

Implementation type MUST be determined primarily by required `type` field from `YAML frontmatter`.
Using file path, directory name, or other heuristics for type selection is not allowed.

Type identification algorithm:

1. Read `type` field value from implementation `YAML frontmatter`.
2. If `type` is absent, is not a string, or does not match any `entity.<typeName>` key, this is a violation.
3. Treat `type` value as implementation type.
4. Validate consistency of `id` with `entity.<type>.idPrefix` by rules of Section 7.
5. Any inconsistency between `id` value and `idPrefix` of selected type is a violation.

## 6. Reference Field Rules (`entityRef`)

### 6.1. General Model

This standard does not define a special `parent` entity and does not reserve names of reference fields.
Relationships between entities are defined only through reference fields declared in `meta.fields`.

Reference field name is chosen by schema author according to domain semantics (for example, `owner`, `service`, `domainOwner`, `dependsOn`).

A reference field value in implementation data is the `id` of the target entity. The `slug` value is not used for this role: `slug` participates in path computation and changes when an entity is renamed, whereas `id` is stable under renaming, so references to the entity are preserved.

### 6.2. Reference Cardinality and Typing

A reference field with `schema.type: entityRef` defines a reference to one entity.
A reference field with `schema.type: array` and `items.type: entityRef` defines an ordered list of references; general `schema.type: array` rules apply to it (Section 12.2).

Use of `type: entityRef` deeper than one array level (for example, `items.items.type: entityRef`) is not allowed.

Allowed target entity types are restricted by `schema.refType` (Sections 12.2 and 12.3).

### 6.3. Reference Resolution

For each present reference, validator MUST unambiguously determine target entity in the specification dataset.
Resolution is performed by string `id` value of the reference, taking `refType` constraint into account when present.
For a list of references, resolution is performed per element.

Regardless of index storage mechanism, validator MUST apply the same resolution rule across the whole specification dataset.

### 6.4. `refs` Context

Value of a reference field in `YAML frontmatter` remains the original `id` string (or list of `id` strings) specified in implementation data.
In expressions and interpolation, access to reference fields is available only through `refs` namespace.

For each reference field `meta.fields.<fieldName>`, the value `refs.<fieldName>` is available:

| Cardinality   | State                                     | Value of `refs.<fieldName>`                            |
| ------------- | ----------------------------------------- | ------------------------------------------------------ |
| single        | field absent or its value is not a string | `null`                                                 |
| single        | resolution succeeded                      | object with properties `id`, `type`, `slug`, `dirPath` |
| list          | field absent                              | `null`                                                 |
| list          | field present                             | list positionally corresponding to the field value     |
| list, element | element is not a string                   | `null` at its position                                 |
| list, element | resolution succeeded                      | object with properties `id`, `type`, `slug`, `dirPath` |

Positional correspondence is mandatory: the length of `refs.<fieldName>` for a list MUST equal the length of the field value in implementation data.

`refs.<fieldName>.dirPath` means path to target entity file directory relative to specification dataset root in POSIX form, without trailing `/`.

The representation of an unresolved reference is not defined by this standard. It does not affect validation result: when an unresolved reference is present, expressions are not evaluated for that implementation (Section 12.3).

Implementations that provide a read API SHOULD NOT discard the original reference data: they SHOULD preserve the `id` value from implementation data and an explicit resolution indicator.

This standard defines the `refs` namespace solely as the expression evaluation context. Entity projection in read APIs (queries, field selection, GraphQL) is not defined by this standard and may include a different set of properties.

### 6.5. Minimum Required Contract of the Implementation Profile

Each validator implementation MUST explicitly document the implementation profile it uses.

At minimum, the implementation profile MUST define:

- path normalization rule, including the rule for case-sensitivity of path comparison;
- the rule for determining specification dataset composition (discovery of entity implementations);
- deterministic reference resolution rule;
- JMESPath implementation used (library, version, or an equivalent behavioral specification);
- rule for computing `refs.<fieldName>.dirPath` for a resolved reference;
- limit on evaluation time for `pattern` regular expressions (Section 12.2);
- repeatability guarantee: with identical schema/data input, `YAML frontmatter` parsing, resolution, and validation results MUST be the same.

The `YAML frontmatter` parsing model is not defined by the profile: it is fixed in Section 11.

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
`idPrefix` values MUST be globally unique within `entity`.

Numeric suffix `N` in `"{idPrefix}-N"` is treated as a counter:

- unique within entity type;
- starting from `0`.

`N` MUST be interpreted as a non-negative integer in unsigned decimal notation.
This standard does not require sequence continuity (gaps are allowed).

From global uniqueness of `idPrefix` and the requirement that `id` be consistent with the type's `idPrefix` (Section 5.3), it follows that the entity type is unambiguously determined by the prefix of its `id`.

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

Other fields in a case are not allowed.

Requirements for case list:

- list MUST be non-empty;
- there MUST be exactly one unconditional case (case without `when`);
- unconditional case MUST be the last list element.

For canonical form:

- `cases` is required and MUST satisfy requirements above;
- other `pathTemplate` object fields are not allowed.

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

`pathTemplate.cases[].use` is the only string context in which `${expr}` interpolation is allowed (Section 9.4).
Each `expr` is evaluated by rules of Section 11.6 in context of specific entity implementation.

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
            refType: service
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

If result of expression has a type not allowed for string interpolation under Section 9.3, this is an implementation-level violation.

If validator can statically establish that a `${expr}` expression in `use` string cannot produce a value compatible with string interpolation, it MUST report this as a `SchemaError` already at the schema-validation stage. In particular, an expression addressing a reference field of list cardinality (for example, `${refs.dependsOn}`) definitely produces a value of type `array` and is a `SchemaError` class violation, since the type is known from the schema and does not depend on data.

`pathTemplate` validation is not performed when the implementation has unresolved references (Section 12.3).

## 9. `${expr}` Interpolation

### 9.1. General Model

This standard uses a unified notation for expressions and substitutions: `${expr}`, where `expr` is a JMESPath expression by the rules of Section 11.6.

The `<...>` notation in this standard text is used only as a metavariable for structure description (for example, `entity.<typeName>`).
The `${...}` notation is used only for expressions and interpolations to be evaluated during validation.
Plain `{...}` notation has no special semantics unless explicitly stated otherwise by this standard.

In positions where standard expects a scalar expression (`required`, `when`, `assert`), the value MUST be either a YAML boolean or a string consisting entirely of a single `${expr}` interpolation.
In string templates, any number of `${expr}` interpolations MAY be mixed with literal text.

Each `${...}` substring in a context that supports interpolation MUST contain a syntactically valid JMESPath expression.
Interpolation boundaries MUST be determined with regard to JMESPath syntax rather than by simply searching for the first `}` character.
If validator can statically establish that a `${expr}` interpolation is syntactically invalid or uses an expression that is definitely incompatible with the context, this is a `SchemaError` class violation.

In string values of the schema for which interpolation is not provided by this standard, a `${...}` substring is ordinary text. No escaping mechanism is introduced.

One transitional exception is made to this rule. The presence of a `${...}` substring in the values of

- `meta.fields.<fieldName>.schema.const`,
- `meta.fields.<fieldName>.schema.enum[*]`,
- `content.sections.<sectionName>.title`

is a `SchemaError` class violation. In revision `0.0.8`, interpolation in these contexts was supported; computed conditions are expressed through `meta.fields.<fieldName>.assert` (Section 12.1). This exception is to be removed once revision `0.0.8` is out of circulation.

### 9.2. `refs.*` Rules

`refs.<fieldName>` is interpreted by the rules of Section 6.4.
On successful reference resolution, `refs.<fieldName>.id`, `refs.<fieldName>.type`, `refs.<fieldName>.slug`, and `refs.<fieldName>.dirPath` are evaluated as properties of the `refs.<fieldName>` object.

In `${expr}` expressions, both `refs.<fieldName>` as a whole and individual `refs.<fieldName>.<part>` properties MAY be used.
In string interpolation, only expressions that actually produce a value of an allowed type by the rules of Section 9.3 are allowed.

### 9.3. Converting an Interpolation Result to a String

For each `${expr}` interpolation in a string context, result of expression MUST have one of the following types:

- `string`
- `integer`

Conversion to string is performed as follows:

- `string` - the value is used as is;
- `integer` - unsigned decimal notation without leading zeros is used.

Values of types `number`, `boolean`, `null`, `array`, and `object` are not allowed in string interpolation and are an implementation-level violation.

Restricting allowed types to `string` and `integer` removes dependence of the result on the implementation: string representation of floating-point numbers has no single rule and was previously delegated to the implementation profile.

### 9.4. Interpolation Usage Contexts

`${expr}` interpolation is allowed in a single string context: `pathTemplate.cases[].use`.

In addition, `${expr}` expressions are used in scalar expression positions: `required`, `pathTemplate.cases[].when`, and `assert` (Section 11.6).

If a `${expr}` interpolation cannot be evaluated for a specific implementation or produces a result incompatible with string interpolation, this is an implementation-level violation.

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

`YAML frontmatter` parsing MUST follow YAML 1.2.2 with the `core schema` scalar resolution model of that version.
Use of the YAML 1.1 typing model is not allowed: in it, values `yes`, `no`, `on`, `off` resolve as booleans, which yields a different type validation result for the same data.
Non-standard and unknown YAML tags are not allowed and are a parsing error.
Metadata type validation MUST be performed against this parsing result, without implicit type conversion by validator.

Built-in `type` field rules:

- field is required;
- value MUST be a string;
- value MUST match one of `entity.<typeName>` keys in schema.

Allowed `YAML frontmatter` keys for a specific implementation: built-in fields (`type`, `id`, `slug`, `createdDate`, `updatedDate`) and fields declared in `meta.fields` of corresponding entity type.
Any other `YAML frontmatter` key is a violation.

### 11.1. `id` Field

- required;
- MUST match format `"{idPrefix}-N"` for the type specified in `type` field, where `N` is a non-negative integer in unsigned decimal notation;
- MUST be globally unique across the whole specification dataset (among all entity types).

### 11.2. `slug` Field

- required;
- MUST be unique within entity type;
- MUST match regular expression `^[a-z0-9]+(?:-[a-z0-9]+)*$` (validation against whole `slug` value).

From uniqueness of `slug` within a type follows the invariant: **the pair (`type`, `slug`) unambiguously identifies an entity implementation in the specification dataset.**

Purpose of this invariant: the pair (`type`, `slug`) is known to the author before an `id` is assigned to the entity, and is intended for references to the entity when creating documents, at which point the `id` of the target entity does not yet exist.

Resolution of a reference by `slug` value MUST be unambiguous. Uniqueness of `slug` is guaranteed within a type, therefore an unqualified `slug` is unambiguous only when the set of allowed target types consists of a single type. If a `slug` value matches more than one entity among the allowed types, the implementation MUST report the ambiguity and require the type or `id` to be specified; arbitrary selection of one of the entities is not allowed.

### 11.3. `createdDate` and `updatedDate` Fields

- required;
- MUST be in RFC 3339 `full-date` format (`YYYY-MM-DD`), which is a restricted profile of ISO 8601;
- MUST be calendar-valid dates (for example, `3026-02-30` is invalid).

If a value is used in a path template (for example, `${createdDate}`), comparison MUST be strict (literal match, without format normalization).

### 11.4. Reference Fields

For each reference field declared in `meta.fields`, following rules apply:

- if key is absent and field is not required by Section 11.5, this is allowed;
- when the key is present, its value MUST be an `id` string (for list cardinality, a list of `id` strings);
- key absence and `null` value are not equivalent: `null` is treated as a present `null`-typed value and violates the type requirement.

Reference resolution and `refType` checks are defined in Section 12.3.

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

The same expression model is used for `required`, `pathTemplate.cases[].when`, and `assert`.
If `pathTemplate.cases[].when` is specified, it MUST be either a boolean value or a `${expr}` expression by this section.

Evaluation context for a specific entity implementation MUST contain:

- built-in top-level fields: `type`, `id`, `slug`, `createdDate`, `updatedDate`;
- object `meta` containing the built-in fields and only those fields described in `meta.fields` that are not reference fields;
- object `refs` containing values by rules of Section 6.4 for reference fields.

Reference fields are not included in the `meta` object regardless of cardinality. Access model: `meta` contains scalar data, `refs` contains relationships.

In expressions under this standard, an absent value and a `null` value are not distinguished: if an expression cannot obtain a value at the specified path, result is treated as `null` by rules of JMESPath.

Truth-like / false-like semantics are determined by the rules of JMESPath.
In particular, `false`, `null`, the empty string, the empty array, and the empty object are considered false-like; all other values are considered truth-like.
Accordingly, `required`, `when`, and `assert` do not have to evaluate specifically to `boolean`: they MAY return any JMESPath value, which is then interpreted according to JMESPath truthiness rules.

If validator can statically establish that `${expr}` expression:

- is syntactically invalid;
- uses a context reference incompatible with given schema;
- or cannot be evaluated correctly in given context,

this is a `SchemaError` class violation determined at the schema-validation stage.

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
        refType: service
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

If `fields` is specified, it MUST be a YAML mapping.
Each key of `meta.fields` defines the literal field name, and the value under that key defines the field description.
Order of keys in `meta.fields` does not affect validation result.

Field name in `meta.fields`:

- MUST be a non-empty ASCII string and MUST fully match regular expression `^[A-Za-z_][A-Za-z0-9_-]*$`;
- MUST NOT match the names of built-in fields `type`, `id`, `slug`, `createdDate`, `updatedDate`.

For each element `meta.fields.<fieldName>`, the following are specified:

- `required` (optional; if omitted, effective value is determined by rules of Section 11.5)
- `description` (optional; non-empty string, informative field)
- `schema` (required)
- `assert` (optional)

If specified, `description` does not affect validation result.

Allowed keys of `meta.fields.<fieldName>`: `required`, `description`, `schema`, `assert`.

`required` field for `meta.fields.<fieldName>` is interpreted by the general requiredness model (Section 11.5).

`schema` field defines constraints for metadata field value and MUST be an object.
Supported `schema` keys are defined in Section 12.2.
The `schema` block MUST be statically resolvable: its content does not depend on data of a specific entity implementation.

#### `assert` Field

If specified, `assert` MUST be a `${expr}` expression by rules of Section 11.6.
It defines a correctness condition for the field value in the context of the whole entity implementation, and is intended for constraints that cannot be expressed locally: consistency of the field with other fields and with resolved references.

Evaluation conditions for `assert` are defined in Section 12.3.

Example (informative):

```yaml
meta:
  fields:
    owner:
      required: false
      schema:
        type: entityRef
        refType: service

    ownerSlug:
      description: "Slug of the owning service. Duplicates owner.slug for reading without reference resolution."
      required: ${refs.owner}
      schema:
        type: string
      assert: ${meta.ownerSlug == refs.owner.slug}
```

#### Field Access in Expressions

Fields from `meta.fields` MAY be used in `${expr}` expressions by rules of Section 11.6.
Reference fields are available only through `refs` namespace.
In string interpolation (Section 9.4), the following are allowed:

- `${meta.<fieldName>}` - only if `schema.type` equals `string` or `integer`;
- `${refs.<fieldName>.<part>}` - only for a reference field of single cardinality.

### 12.2. `schema` Field

`schema` field uses a restricted subset of JSON Schema Draft 2020-12 (Core + Validation) to validate metadata field values.
Keywords listed in this section have semantics of the specified JSON Schema dialect unless otherwise defined by this standard.

This standard defines following `schema` keys:

| Category   | Keys                                                                         | Applicability                                |
| ---------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| general    | `type` (required), `const`, `enum`                                           |                                              |
| strings    | `minLength`, `maxLength`, `pattern`, `format`                                | only with `type: string`                     |
| numbers    | `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`                 | only with `type: number` and `type: integer` |
| arrays     | `items` (required with `type: array`), `minItems`, `maxItems`, `uniqueItems` | only with `type: array`                      |
| references | `refType`                                                                    | only with `type: entityRef`                  |

#### `type` Key

`type` key defines expected type of metadata value after parsing YAML with the model fixed in Section 11, that is, by actual value type rather than its string representation.
Supported `type` values:

- `string`
- `number`
- `integer`
- `boolean`
- `array`
- `entityRef` (extension of this standard; absent in JSON Schema Draft 2020-12)

`type` validation MUST be strict, without implicit type conversion (for example, string `"1"` is not equal to number `1`).
For `type: integer`, value MUST be a number without fractional part.
Composite `type` forms (for example, `string|null`, `array<string>`) are not supported by this standard.
`type: entityRef` defines a specialized reference type; its value in `YAML frontmatter` MUST be an `id` string validated by referential integrity rules (Section 12.3).
Use of `type: null` and `type: object` is not supported in this version of the standard.

#### `const` and `enum` Keys

If specified, `const` key defines value that actual field value MUST strictly match (by value and type after YAML parsing). The `const` value is a literal and is not subject to evaluation.

If specified, `enum` key MUST be a non-empty list.
Actual field value MUST strictly match at least one `enum` item. `enum` items are literals and are not subject to evaluation.
If both `type` and `enum` are specified, each `enum` item MUST conform to `type`.

For `type: entityRef`, if `const` and `enum` are specified, they MUST be `id` strings and are validated in addition to referential integrity rules.

Computed constraints are expressed through `meta.fields.<fieldName>.assert` (Section 12.1), not through `const` and `enum`.

#### String Keys

If specified, `minLength` and `maxLength` MUST be non-negative integers; if both keys are specified, `minLength <= maxLength` MUST hold.

If specified, `pattern` MUST be a string containing a regular expression of the ECMA-262 dialect.
In accordance with JSON Schema semantics, matching succeeds if the expression matches anywhere within the value. To match the whole value, schema author MUST use anchors `^` and `$`.
Implementation MUST limit evaluation time for `pattern` (Section 6.5).

If specified, `format` MUST take one of the values of a closed list. This revision defines one value:

- `date` - RFC 3339 `full-date` with a calendar validity requirement, that is, the same semantics defined in Section 11.3 for `createdDate` and `updatedDate` fields.

A `format` value not in the list is not allowed.
Unlike JSON Schema, where `format` is an annotation by default, in this standard `format` is an assertion and affects validation result.

#### Numeric Keys

If specified, `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum` MUST be numbers.
If `minimum` and `maximum` are specified, `minimum <= maximum` MUST hold.

#### Array Keys

`items` key is required with `type: array` and is not allowed with other `type` values.
`items` value MUST be a `schema` object and applies to each array element.

`minItems` and `maxItems` MUST be non-negative integers; if both keys are specified, `minItems <= maxItems` MUST hold.
`uniqueItems`, if specified, MUST be a boolean value.

#### `refType` Key

If specified, `refType` key MUST be either a string defining one allowed entity type, or a non-empty list of strings without duplicates.
String `refType` value and each `refType` list item MUST reference an existing entity type (a key in `entity`).
For validation, `refType` is interpreted as a set of allowed types: a string defines a one-element set, a list defines a set of the listed elements.
For example, `refType: service` and `refType: [service, domain]` are both valid forms.

Example (informative):

```yaml
meta:
  fields:
    summary:
      schema:
        type: string
        minLength: 1
        maxLength: 200

    ticket:
      required: false
      schema:
        type: string
        pattern: "^[A-Z][A-Z0-9]+-[0-9]+$"

    rolloutPercent:
      required: false
      schema:
        type: integer
        minimum: 0
        maximum: 100

    deprecatedDate:
      required: ${meta.status == 'deprecated'}
      schema:
        type: string
        format: date

    tags:
      required: false
      schema:
        type: array
        items:
          type: string
          pattern: "^[a-z][a-z0-9-]*$"
        minItems: 1
        uniqueItems: true

    dependsOn:
      required: false
      schema:
        type: array
        items:
          type: entityRef
          refType: service
        uniqueItems: true
```

### 12.3. Validation Semantics

For each element `meta.fields.<fieldName>`, validator MUST use the literal field name from key name `fieldName`.

#### Order of Implementation Validation Phases

Validator MUST validate a specific entity implementation in the following order:

1. parse `YAML frontmatter` and determine type by `type` field (Section 5.3);
2. resolve reference fields and build the `refs` context (Section 6.4);
3. evaluate `required` and check presence of fields and sections;
4. validate `schema` for present fields;
5. evaluate `assert` for present fields;
6. evaluate `pathTemplate` and compare path (Section 8.6).

Reference resolution is performed before `required` evaluation, since `required` may be specified as an expression over `refs`.

#### Suppression of Checks with Unresolved References

If an entity implementation has at least one unresolved reference, the following checks that depend on expression evaluation are not performed for that implementation:

- `pathTemplate` matching;
- `assert` evaluation;
- evaluation of `required` specified as an expression.

The `required` key specified as a boolean value, and all checks that do not depend on expression evaluation, are performed as usual.

A reference field of list cardinality is considered unresolved if at least one of its elements does not resolve.

This rule removes diagnostics derived from an unresolved reference. Without it, absence of a target entity produces an additional diagnostic about a path mismatch that points at the wrong fix: it suggests moving the file, whereas the reference is what must be corrected.

#### Presence Validation

For each element `meta.fields.<fieldName>`, field presence is validated by the following rules:

- field is required if effective `required` value for a specific implementation is truth-like;
- in all other cases field is optional;
- absence of a required field is a violation.

#### `schema` Validation

`schema` validation is performed for each present field from `meta.fields` by following rules:

- actual value MUST conform to `schema.type`;
- if `schema.const` is specified, actual value MUST strictly match it;
- if `schema.enum` is specified, actual value MUST strictly match at least one `schema.enum` item;
- if string keys (`minLength`, `maxLength`, `pattern`, `format`) are specified, value MUST conform to them;
- if numeric keys (`minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`) are specified, value MUST conform to them;
- if `schema.type` equals `array`, each array element MUST be validated recursively against `schema.items`;
- if `schema.type` equals `array` and `schema.minItems` is specified, array length MUST be at least `minItems`;
- if `schema.type` equals `array` and `schema.maxItems` is specified, array length MUST be at most `maxItems`;
- if `schema.type` equals `array` and `schema.uniqueItems: true` is specified, array elements MUST be pairwise distinct under strict value comparison;
- if `schema.type` equals `entityRef`, actual value MUST be an `id` string of an existing entity:
  - with `schema.refType`, reference MUST resolve to exactly one existing entity of one of the types allowed by `refType` and match the `id` format of that type;
  - if `schema.refType` is not specified, reference MUST resolve to exactly one existing entity among all `entity` types by globally unique `id` (Section 11.1);
  - on successful resolution, reference forms the `refs.<fieldName>.*` context by rules of Sections 6.4 and 9.2.

#### `assert` Validation

For each element `meta.fields.<fieldName>` with `assert` specified, following rules apply:

- `assert` is not evaluated if the field is absent from implementation data;
- `assert` is not evaluated when the suppression rule for unresolved references applies;
- in all other cases, `assert` is evaluated by rules of Section 11.6; a false-like result is an implementation-level violation.

#### Other

Additional `YAML frontmatter` fields (beyond the built-in fields and the `meta.fields` fields) are not allowed.

## 13. `content` Rules

### 13.1. `content.sections` Field

`content.sections` defines a mapping of sections to validate in the document body.
If specified, `content.sections` MUST be a non-empty YAML mapping.

Allowed keys of `content` object: `sections`.

Each key of `content.sections` defines a section label (`anchor label`) and:

- MUST be a non-empty ASCII string and MUST fully match the regular expression `^[A-Za-z_][A-Za-z0-9_-]*$`.

The order of keys in `content.sections` in the schema defines the canonical section order for this entity type **for generation purposes** and is not checked during validation. Schema parsing MUST preserve the order of `content.sections` keys (Section 6.5).

Each element `content.sections.<sectionName>` MUST be an object with the following fields:

- `required` (optional; if omitted, effective value is determined by rules of Section 11.5) - boolean value or `${expr}` expression defining section requiredness;
- `title` (optional) - non-empty string; defines allowed text of the section heading. The `title` value is a literal and is not subject to evaluation;
- `description` (optional) - a non-empty string, informative field.

If specified, `description` does not affect validation result.

Allowed keys of `content.sections.<sectionName>`: `required`, `title`, `description`.

`required` field for `content.sections.<sectionName>` is interpreted by the general requiredness model (Section 11.5).

### 13.2. Section Recognition

Section validation is performed using a normalized section model and by presence of section label (`anchor label`), not by exact heading text.

Label in key `content.sections.<sectionName>` is specified without `#` prefix (for example, `goal`) and compared case-sensitively.
Section labels within one document MUST be unique; repetition of the same label is a violation. This rule also applies to labels not declared in the schema.

#### Heading Recognition

Headings in the document body are recognized per CommonMark. Content of code blocks, HTML blocks, and block quotes is not a heading.

Only the ATX heading form (`## Heading`) is considered a section heading. The Setext form (underlining with `===` or `---`) is not a section heading.

A section heading MUST be at level 2. A heading that carries a label and has a different level is a violation.

The fixed-level requirement follows from `content.sections` being a flat mapping with no notion of nesting. A label on a deeper-level heading would create a document in which one declared section is nested inside another, whereas the schema declares them as siblings.

#### Label Extraction

`label` MUST be extracted only from explicit marking in one of the canonical syntaxes:

- a link constituting the entire heading content: `[<title>](#<label>)`;
- a label attribute at end of heading text: `<title> {#<label>}`.

For the `[<title>](#<label>)` form, the link MUST constitute the entire heading content. A heading that contains a link alongside other text is not a section heading: otherwise an ordinary cross-reference inside a heading would declare a section.

Form `<title> {#<label>}` is a local extension of this standard and MUST be recognized by validator as a textual suffix of heading text regardless of extension support in a specific Markdown parser. The suffix is searched in the text of a heading already recognized per CommonMark, not in an arbitrary file line.

Automatic derivation of label from heading text without an explicit marker is not allowed.

`title` text for validating `content.sections.<sectionName>.title` is extracted:

- for `[<title>](#<label>)` form, from link text part `<title>`;
- for `<title> {#<label>}` form, from heading text without `{#<label>}` suffix.

Example of allowed heading for `goal` section (informative):

```md
## [Goal](#goal)
```

```md
## Goal {#goal}
```

#### Section Body

Section body is the text from the line following its heading up to the nearest subsequent heading of level 1 or 2. If there is no such heading, the section body continues to the end of the document.

Headings of level 3 and deeper are not section body boundaries and remain part of it.

Text located before the first heading of the document does not belong to any section.
Leading and trailing blank lines of the body are discarded.

Example (informative):

```md
## Decision {#decision}

We use capped exponential backoff.

### Parameters

base=100ms, max=5s.

## Consequences {#consequences}

Load during incidents decreases.
```

The body of section `decision` includes the "Parameters" subheading and its text, and ends before the `## Consequences` heading.

### 13.3. Validation Semantics

For each element `content.sections.<sectionName>`, validator MUST apply the following rules:

- if effective `required` value for a specific implementation is truth-like, the section with label `sectionName` is required;
- if effective `required` value for a specific implementation is false-like, absence of the section with label `sectionName` is not an error;
- if `title` is specified and the section with label `sectionName` is not found, `title` validation is not performed for this implementation;
- if `title` is specified and the section is found, heading text of the found section MUST strictly match the `title` value (case-sensitive comparison).

A section is considered found if the required label is present.

Presence in the document of a section with a label not declared in `content.sections` is not a violation.

This rule intentionally differs from the closed-world key model of `YAML frontmatter` (Section 12.3): `YAML frontmatter` is a closed set of machine fields with declared types, whereas the document body is human text whose structure is only partially declared. A label is often added for an internal reference within the document, and prohibiting undeclared labels would restrict ordinary Markdown practice.

## 14. Diagnostics

### 14.1. Diagnostic Message Classes

Validator MUST use unified diagnostic classes:

- `SchemaError` - violation of requirements for the schema;
- `InstanceError` - violation of requirements for a specific entity implementation or specification dataset;
- `ProfileError` - violation of implementation profile requirements or inability to deterministically apply profile.

### 14.2. Violation Classification

The diagnostic class is determined by what the violated requirement applies to:

- a requirement for the schema - `SchemaError`;
- a requirement for an entity implementation or specification dataset - `InstanceError`;
- a requirement for the implementation profile, or inability to apply it deterministically - `ProfileError`.

This principle applies to all requirements of the standard, including those for which the class is not named explicitly in the rule text.

Examples of applying the principle (informative):

| Violated requirement                                | Requirement object    | Class           |
| --------------------------------------------------- | --------------------- | --------------- |
| `minItems` MUST be a non-negative integer           | schema                | `SchemaError`   |
| duplicate keys in the schema                        | schema                | `SchemaError`   |
| `${expr}` expression is syntactically invalid       | schema                | `SchemaError`   |
| `id` is unique within the dataset                   | specification dataset | `InstanceError` |
| duplicate keys in `YAML frontmatter`                | entity implementation | `InstanceError` |
| `type` field absent in implementation               | entity implementation | `InstanceError` |
| interpolation produced a value of a disallowed type | entity implementation | `InstanceError` |
| implementation path did not match the template      | entity implementation | `InstanceError` |

The case of Section 8.6 is clarified separately: if validator statically establishes that an expression in `pathTemplate.cases[].use` cannot produce a value compatible with string interpolation, the violated requirement applies to the schema, and the diagnostic class is `SchemaError`, despite the fact that the condition is detected while working with entity implementations.

### 14.3. Diagnostic Message Content

For each diagnostic, validator MUST provide at minimum:

- diagnostic message class;
- violation description text;
- reference to section/subsection of this standard whose requirement is violated.

The diagnostic output format is not defined by this standard.

## 15. Recommendations for Validator Implementations

It is recommended to separate checks into two levels:

- structural schema checks (for example, JSON Schema);
- semantic checks: cross-references, uniqueness, validation of `pathTemplate.cases[].when`, evaluation of `pathTemplate.cases[].use`, evaluation of `meta.fields.<fieldName>.assert`, reference resolution, normalization of `content.sections`, and computation of section body boundaries.

It is recommended to parse `${expr}` expressions once at schema load time: this allows statically detecting syntax errors and references to non-existent fields (Section 11.6) before processing entity implementations.

In addition to mandatory implementation-profile parameters (Section 6.5), it is recommended to explicitly define in validator implementation:

- YAML parser used (library and version) and confirmation of support for the YAML 1.2 core schema typing model;
- reference resolution mechanism;
- JMESPath implementation used (library and version, or an equivalent behavioral specification);
- regular expression implementation used and the mechanism for limiting its evaluation time.

This ensures portability and tool compatibility across programming languages and organizations.
